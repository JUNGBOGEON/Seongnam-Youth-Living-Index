"use client";

import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DongScore } from "@/lib/data";

type Props = { scores: DongScore[] };

type MetricKey = "syli" | "commute" | "rent" | "infra";

type MetricDefinition = {
  key: MetricKey;
  label: string;
  description: string;
  value: (score: DongScore) => number;
};

type BoundaryFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
};

type BoundaryCollection = {
  type: "FeatureCollection";
  features: BoundaryFeature[];
};

type SvgDistrict = {
  center: readonly [number, number];
  dongCd: string;
  name: string;
  path: string;
  score?: DongScore;
};

type SpatialRead = {
  accent: string;
  caption: string;
  label: readonly [number, number];
  path: string;
  points: Array<readonly [number, number]>;
  title: string;
};

type MapCamera = {
  scale: number;
  x: number;
  y: number;
};

type PointerPoint = {
  clientX: number;
  clientY: number;
};

type PanGesture = {
  didMove: boolean;
  panSpeed: number;
  pointerId: number;
  rect: DOMRect;
  startCamera: MapCamera;
  startX: number;
  startY: number;
  tapDistrict?: DongScore;
  type: "pan";
};

type PinchGesture = {
  didMove: boolean;
  rect: DOMRect;
  startCamera: MapCamera;
  startCenterX: number;
  startCenterY: number;
  startDistance: number;
  startSvgX: number;
  startSvgY: number;
  type: "pinch";
};

type MapGesture = PanGesture | PinchGesture;

const METRICS: MetricDefinition[] = [
  {
    key: "syli",
    label: "종합",
    description: "통근, 월세, 인프라, 청년 체류, 동 유형을 함께 본 적합도",
    value: (score) => score.SYLI_v02,
  },
  {
    key: "commute",
    label: "통근",
    description: "판교 업무지구 접근성과 청년 이동 강도",
    value: (score) => score.SCORE_COMMUTE_PANGYO,
  },
  {
    key: "rent",
    label: "월세",
    description: "중위 월세가 낮을수록 높게 환산한 접근성",
    value: (score) => score.SCORE_RENT,
  },
  {
    key: "infra",
    label: "생활",
    description: "생활 인프라와 청년 소비가 관측되는 정도",
    value: (score) => score.SCORE_INFRA,
  },
];

const METRIC_BY_KEY = Object.fromEntries(
  METRICS.map((metric) => [metric.key, metric])
) as Record<MetricKey, MetricDefinition>;

const SVG_SIZE = 1000;
const SVG_PADDING = 28;
const MIN_MAP_ZOOM = 1;
const MAX_MAP_ZOOM = 4.4;
const MOUSE_PAN_SPEED = 0.42;
const TOUCH_PAN_SPEED = 0.72;
const WHEEL_ZOOM_SENSITIVITY = 0.0014;

export function MapView({ scores }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("syli");
  const [districts, setDistricts] = useState<SvgDistrict[]>([]);
  const [hoveredDong, setHoveredDong] = useState<string | null>(null);
  const [mapCamera, setMapCamera] = useState<MapCamera>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const mapCameraRef = useRef(mapCamera);
  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const activePointers = useRef(new Map<number, PointerPoint>());
  const mapGesture = useRef<MapGesture | null>(null);
  const rankedBySyli = useMemo(
    () => [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02),
    [scores]
  );
  const [selected, setSelected] = useState<DongScore | null>(
    rankedBySyli[0] ?? null
  );

  const byCd = useMemo(
    () => Object.fromEntries(scores.map((score) => [score.dong_cd, score])),
    [scores]
  ) as Record<string, DongScore>;
  const activeMetric = METRIC_BY_KEY[selectedMetric];
  const rankedByMetric = useMemo(
    () =>
      [...scores].sort((a, b) => activeMetric.value(b) - activeMetric.value(a)),
    [activeMetric, scores]
  );
  const topRankByDong = useMemo(
    () =>
      new Map(
        rankedByMetric
          .slice(0, 5)
          .map((district, index) => [district.dong_cd, index + 1])
      ),
    [rankedByMetric]
  );
  const labeledDistricts = useMemo(() => {
    const labelIds = new Set<string>();

    rankedByMetric.slice(0, 5).forEach((district) => {
      labelIds.add(district.dong_cd);
    });
    if (selected) labelIds.add(selected.dong_cd);
    if (hoveredDong) labelIds.add(hoveredDong);

    return districts
      .filter((district) => labelIds.has(district.dongCd) && district.score)
      .sort((a, b) => {
        const aFocus =
          a.dongCd === selected?.dong_cd || a.dongCd === hoveredDong ? 1 : 0;
        const bFocus =
          b.dongCd === selected?.dong_cd || b.dongCd === hoveredDong ? 1 : 0;
        return aFocus - bFocus;
      });
  }, [districts, hoveredDong, rankedByMetric, selected]);
  const spatialRead = useMemo(
    () => createSpatialRead(selectedMetric, districts, rankedByMetric),
    [districts, rankedByMetric, selectedMetric]
  );
  const hovered = hoveredDong ? byCd[hoveredDong] : null;
  const displayDistrict = hovered ?? selected;
  const displayDistrictTopRank = displayDistrict
    ? topRankByDong.get(displayDistrict.dong_cd)
    : null;
  const metricIndex = Math.max(
    0,
    METRICS.findIndex((metric) => metric.key === selectedMetric)
  );
  const metricIndicatorStyle = {
    transform: `translateX(calc(${metricIndex} * (100% + 0.25rem)))`,
    width: "calc((100% - 1.25rem) / 4)",
  } satisfies CSSProperties;
  const mapViewBoxSize = SVG_SIZE / mapCamera.scale;
  const mapViewBox = `${mapCamera.x} ${mapCamera.y} ${mapViewBoxSize} ${mapViewBoxSize}`;

  useEffect(() => {
    let cancelled = false;

    async function loadBoundaries() {
      const res = await fetch("/data/dong_boundaries.geojson");
      const geo = (await res.json()) as BoundaryCollection;
      if (!cancelled) {
        setDistricts(createSvgDistricts(geo, byCd));
      }
    }

    loadBoundaries().catch(() => {
      if (!cancelled) setDistricts([]);
    });

    return () => {
      cancelled = true;
    };
  }, [byCd]);

  const updateMapCamera = useCallback((nextCamera: MapCamera) => {
    const clamped = clampMapCamera(nextCamera);

    mapCameraRef.current = clamped;
    setMapCamera(clamped);
  }, []);

  const chooseDistrict = useCallback((district?: DongScore) => {
    if (district) setSelected(district);
  }, []);

  const startPinchGesture = useCallback((rect: DOMRect) => {
    const pointers = [...activePointers.current.values()];
    if (pointers.length < 2) return;

    const [first, second] = pointers;
    const centerX = (first.clientX + second.clientX) / 2;
    const centerY = (first.clientY + second.clientY) / 2;
    const startCamera = mapCameraRef.current;
    const viewBoxSize = SVG_SIZE / startCamera.scale;

    mapGesture.current = {
      didMove: false,
      rect,
      startCamera,
      startCenterX: centerX,
      startCenterY: centerY,
      startDistance: getPointDistance(first, second),
      startSvgX:
        startCamera.x + ((centerX - rect.left) / rect.width) * viewBoxSize,
      startSvgY:
        startCamera.y + ((centerY - rect.top) / rect.height) * viewBoxSize,
      type: "pinch",
    };
  }, []);

  const handleMapPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = mapSvgRef.current;
      if (!svg) return;

      svg.setPointerCapture(event.pointerId);
      activePointers.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      const rect = svg.getBoundingClientRect();
      if (activePointers.current.size >= 2) {
        event.preventDefault();
        startPinchGesture(rect);
        return;
      }

      mapGesture.current = {
        didMove: false,
        panSpeed:
          event.pointerType === "mouse" ? MOUSE_PAN_SPEED : TOUCH_PAN_SPEED,
        pointerId: event.pointerId,
        rect,
        startCamera: mapCameraRef.current,
        startX: event.clientX,
        startY: event.clientY,
        tapDistrict: getPointerDistrict(event, byCd),
        type: "pan",
      };
    },
    [byCd, startPinchGesture]
  );

  const handleMapPointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const currentPoint = activePointers.current.get(event.pointerId);
      if (!currentPoint || !mapGesture.current) return;

      activePointers.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      const gesture = mapGesture.current;

      if (gesture.type === "pinch") {
        const pointers = [...activePointers.current.values()];
        if (pointers.length < 2 || gesture.startDistance <= 0) return;

        event.preventDefault();

        const [first, second] = pointers;
        const distance = getPointDistance(first, second);
        const centerX = (first.clientX + second.clientX) / 2;
        const centerY = (first.clientY + second.clientY) / 2;
        const scale = gesture.startCamera.scale * (distance / gesture.startDistance);
        const clampedScale = clamp(scale, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
        const nextViewBoxSize = SVG_SIZE / clampedScale;

        gesture.didMove =
          gesture.didMove ||
          Math.abs(distance - gesture.startDistance) > 5 ||
          getDistanceBetweenPoints(
            centerX,
            centerY,
            gesture.startCenterX,
            gesture.startCenterY
          ) > 5;

        updateMapCamera({
          scale: clampedScale,
          x:
            gesture.startSvgX -
            ((centerX - gesture.rect.left) / gesture.rect.width) *
              nextViewBoxSize,
          y:
            gesture.startSvgY -
            ((centerY - gesture.rect.top) / gesture.rect.height) *
              nextViewBoxSize,
        });
        return;
      }

      if (gesture.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const viewBoxSize = SVG_SIZE / gesture.startCamera.scale;

      gesture.didMove =
        gesture.didMove || getDistanceBetweenPoints(deltaX, deltaY, 0, 0) > 5;

      if (gesture.didMove) {
        event.preventDefault();
        updateMapCamera({
          scale: gesture.startCamera.scale,
          x:
            gesture.startCamera.x -
            (deltaX / gesture.rect.width) * viewBoxSize * gesture.panSpeed,
          y:
            gesture.startCamera.y -
            (deltaY / gesture.rect.height) * viewBoxSize * gesture.panSpeed,
        });
      }
    },
    [updateMapCamera]
  );

  const handleMapPointerEnd = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = mapSvgRef.current;
      if (svg?.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
      }

      const gesture = mapGesture.current;
      const wasDragging = gesture?.didMove ?? false;
      const tapDistrict =
        gesture?.type === "pan" ? gesture.tapDistrict : undefined;
      activePointers.current.delete(event.pointerId);

      if (activePointers.current.size >= 2 && svg) {
        startPinchGesture(svg.getBoundingClientRect());
        return;
      }

      if (activePointers.current.size === 1 && svg) {
        const [pointerId, pointer] = [...activePointers.current.entries()][0];
        mapGesture.current = {
          didMove: wasDragging,
          panSpeed: TOUCH_PAN_SPEED,
          pointerId,
          rect: svg.getBoundingClientRect(),
          startCamera: mapCameraRef.current,
          startX: pointer.clientX,
          startY: pointer.clientY,
          type: "pan",
        };
        return;
      }

      if (event.type === "pointerup" && !wasDragging && tapDistrict) {
        chooseDistrict(tapDistrict);
      }

      mapGesture.current = null;
    },
    [chooseDistrict, startPinchGesture]
  );

  const handleMapWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      event.preventDefault();

      const svg = mapSvgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const current = mapCameraRef.current;
      const currentViewBoxSize = SVG_SIZE / current.scale;
      const pointX =
        current.x + ((event.clientX - rect.left) / rect.width) * currentViewBoxSize;
      const pointY =
        current.y + ((event.clientY - rect.top) / rect.height) * currentViewBoxSize;
      const clampedWheel = clamp(-event.deltaY, -80, 80);
      const scaleFactor = Math.exp(clampedWheel * WHEEL_ZOOM_SENSITIVITY);
      const nextScale = clamp(current.scale * scaleFactor, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
      const nextViewBoxSize = SVG_SIZE / nextScale;

      updateMapCamera({
        scale: nextScale,
        x: pointX - ((event.clientX - rect.left) / rect.width) * nextViewBoxSize,
        y: pointY - ((event.clientY - rect.top) / rect.height) * nextViewBoxSize,
      });
    },
    [updateMapCamera]
  );

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#d2d2d7] bg-white">
      <div className="grid gap-px bg-[#d2d2d7] lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="bg-[#f5f5f7]">
          <div className="border-b border-[#d2d2d7] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow mb-2">Map View</p>
                <h2 className="text-[24px] font-semibold leading-[1.18] text-[#1d1d1f]">
                  동별 강도를 먼저 보고, 눌러서 이유를 확인합니다.
                </h2>
                <p className="mt-2 max-w-[640px] text-[14px] leading-[1.45] text-[#6e6e73]">
                  지표를 바꾸면 지도, 순위, 정책 판정이 함께 바뀝니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative flex flex-col p-4 sm:p-6 md:block md:min-h-[560px]">
              <div
                aria-label="지도 지표 선택"
                className="relative order-1 z-10 mx-auto grid w-full max-w-[330px] grid-cols-[repeat(4,minmax(0,1fr))] gap-1 overflow-hidden rounded-full border border-black/10 bg-white/92 p-1 shadow-[0_14px_30px_rgba(29,29,31,0.1)] backdrop-blur-md md:absolute md:left-6 md:top-6 md:mx-0 md:w-[330px] md:shadow-[0_18px_40px_rgba(29,29,31,0.12)]"
                data-map-metric-tabs
              >
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 left-1 top-1 rounded-full bg-[#10252a] shadow-[0_4px_14px_rgba(16,37,42,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={metricIndicatorStyle}
                />
                {METRICS.map((metric) => {
                  const active = metric.key === selectedMetric;

                  return (
                    <button
                      key={metric.key}
                      type="button"
                      onClick={() => setSelectedMetric(metric.key)}
                      className={`relative z-10 min-w-0 overflow-hidden rounded-full px-1 py-2 text-[11px] font-semibold transition-colors duration-200 sm:px-3 sm:text-[13px] ${
                        active
                          ? "text-white"
                          : "text-[#6e6e73] hover:text-[#1d1d1f]"
                      }`}
                    >
                      {metric.label}
                    </button>
                  );
                })}
              </div>

              {displayDistrict && (
                <div
                  className="relative order-3 z-10 mt-3 w-full rounded-[8px] border border-black/10 bg-white/92 p-3 shadow-[0_14px_30px_rgba(29,29,31,0.1)] backdrop-blur-md sm:p-4 md:absolute md:bottom-6 md:left-6 md:mt-0 md:w-[min(310px,calc(100%-3rem))] md:shadow-[0_18px_44px_rgba(29,29,31,0.14)]"
                  data-map-selected-card
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-semibold text-[#86868b]">
                      {hovered ? "지도에서 보는 동" : "선택된 동"}
                    </p>
                    <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[12px] font-semibold text-[#6e6e73]">
                      {displayDistrict.구}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-5">
                    <p className="text-[20px] font-semibold leading-[1.15] text-[#1d1d1f] sm:text-[22px]">
                      {displayDistrict.동명}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-[8px] bg-[#f5f5f7] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#6e6e73]">
                        {activeMetric.label} 점수
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#86868b]">
                        {displayDistrictTopRank
                          ? `Top ${displayDistrictTopRank}`
                          : "현재 선택 기준"}
                      </p>
                    </div>
                    <p className="shrink-0 text-[24px] font-semibold leading-none tabular-nums text-[#10252a] sm:text-[28px]">
                      {activeMetric.value(displayDistrict).toFixed(0)}
                      <span className="ml-0.5 text-[13px] font-semibold text-[#6e6e73]">
                        점
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <svg
                aria-label="성남시 행정동 지도"
                ref={mapSvgRef}
                className="order-2 mt-4 aspect-square w-full min-h-[360px] select-none touch-none md:mt-0 md:h-full md:min-h-[520px]"
                data-map-svg
                preserveAspectRatio="xMidYMid meet"
                role="img"
                viewBox={mapViewBox}
                onPointerCancel={handleMapPointerEnd}
                onPointerDown={handleMapPointerDown}
                onPointerLeave={handleMapPointerEnd}
                onPointerMove={handleMapPointerMove}
                onPointerUp={handleMapPointerEnd}
                onWheel={handleMapWheel}
              >
                <defs>
                  <filter
                    id="district-lift"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="7"
                      floodColor="#172326"
                      floodOpacity="0.16"
                      stdDeviation="6"
                    />
                  </filter>
                </defs>
                <rect width={SVG_SIZE} height={SVG_SIZE} fill="#f3f4f2" />
                <path
                  d="M58 826 C210 770 270 820 405 760 S632 688 803 742 S962 768 986 684"
                  fill="none"
                  opacity="0.18"
                  stroke="#b8beb9"
                  strokeDasharray="7 12"
                  strokeLinecap="round"
                  strokeWidth="2"
                />

                {spatialRead && (
                  <g aria-hidden="true" pointerEvents="none">
                    <path
                      d={spatialRead.path}
                      fill="none"
                      opacity="0.12"
                      stroke={spatialRead.accent}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="28"
                    />
                    <path
                      d={spatialRead.path}
                      fill="none"
                      opacity="0.72"
                      stroke={spatialRead.accent}
                      strokeDasharray="10 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                    {spatialRead.points.map(([x, y], index) => (
                      <circle
                        key={`spatial-point-${index}`}
                        cx={x}
                        cy={y}
                        fill="#ffffff"
                        r="7"
                        stroke={spatialRead.accent}
                        strokeOpacity="0.76"
                        strokeWidth="3"
                      />
                    ))}
                    <g
                      transform={`translate(${spatialRead.label[0].toFixed(2)} ${spatialRead.label[1].toFixed(2)})`}
                    >
                      <rect
                        x="-80"
                        y="-30"
                        width="160"
                        height="54"
                        rx="8"
                        fill="#ffffff"
                        fillOpacity="0.9"
                        stroke="#d2d2d7"
                        strokeOpacity="0.78"
                      />
                      <text
                        y="-7"
                        fill="#1d1d1f"
                        fontSize="15"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {spatialRead.title}
                      </text>
                      <text
                        y="12"
                        fill="#6e6e73"
                        fontSize="11"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {spatialRead.caption}
                      </text>
                    </g>
                  </g>
                )}

                {districts.map((district) => {
                  const value = district.score
                    ? activeMetric.value(district.score)
                    : 0;
                  const depth = elevationFor(value);

                  return (
                    <path
                      key={`relief-${district.dongCd}`}
                      d={district.path}
                      fill="#172326"
                      fillOpacity={reliefOpacity(value)}
                      fillRule="evenodd"
                      stroke="#172326"
                      strokeOpacity="0.06"
                      strokeWidth="1"
                      transform={`translate(${depth * 0.36} ${depth * 0.56})`}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}

                {districts.map((district) => {
                  const selectedDong = selected?.dong_cd === district.dongCd;
                  const hovered = hoveredDong === district.dongCd;
                  const value = district.score
                    ? activeMetric.value(district.score)
                    : 0;
                  const dimmed = hoveredDong !== null && !hovered && !selectedDong;

                  return (
                    <path
                      key={district.dongCd}
                      aria-label={district.name}
                      className="cursor-pointer outline-none transition-[fill,opacity,stroke-width] focus:outline-none"
                      d={district.path}
                      fill={metricToColor(value)}
                      fillOpacity={selectedDong || hovered ? 0.98 : dimmed ? 0.44 : 0.86}
                      fillRule="evenodd"
                      stroke={
                        selectedDong
                          ? "#10252a"
                          : hovered
                            ? "#10252a"
                            : "#ffffff"
                      }
                      strokeOpacity={selectedDong || hovered ? 1 : 0.9}
                      strokeWidth={selectedDong ? 3.2 : hovered ? 2.4 : 1.4}
                      data-map-dong={district.dongCd}
                      style={{ outline: "none" }}
                      tabIndex={0}
                      vectorEffect="non-scaling-stroke"
                      onKeyDown={(event) => {
                        if (
                          district.score &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          chooseDistrict(district.score);
                        }
                      }}
                      onMouseEnter={() => setHoveredDong(district.dongCd)}
                      onMouseLeave={() => setHoveredDong(null)}
                    />
                  );
                })}

                {districts
                  .filter(
                    (district) =>
                      district.dongCd === hoveredDong ||
                      district.dongCd === selected?.dong_cd
                  )
                  .map((district) => {
                    const value = district.score
                      ? activeMetric.value(district.score)
                      : 0;
                    const lift = elevationFor(value, true);

                    return (
                      <path
                        key={`focus-${district.dongCd}`}
                        aria-hidden="true"
                        d={district.path}
                        fill={metricToColor(value)}
                        fillOpacity="0.98"
                        fillRule="evenodd"
                        filter="url(#district-lift)"
                        pointerEvents="none"
                        stroke="#10252a"
                        strokeOpacity="0.72"
                        strokeWidth="2.8"
                        transform={`translate(${-lift * 0.16} ${-lift * 0.24})`}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}

                {labeledDistricts.map((district) => {
                  const rank = topRankByDong.get(district.dongCd);
                  const selectedDong = selected?.dong_cd === district.dongCd;
                  const hovered = hoveredDong === district.dongCd;
                  const labelWidth = 34 + district.name.length * 13;
                  const [x, y] = district.center;
                  const offsetY = selectedDong || hovered ? -22 : -14;

                  return (
                    <g
                      key={`label-${district.dongCd}`}
                      aria-hidden="true"
                      pointerEvents="none"
                      transform={`translate(${x.toFixed(2)} ${(y + offsetY).toFixed(2)})`}
                    >
                      <rect
                        x={-labelWidth / 2}
                        y="-18"
                        width={labelWidth}
                        height="28"
                        rx="8"
                        fill={selectedDong || hovered ? "#10252a" : "#ffffff"}
                        fillOpacity={selectedDong || hovered ? 0.94 : 0.88}
                        stroke={selectedDong || hovered ? "#10252a" : "#d2d2d7"}
                        strokeOpacity={selectedDong || hovered ? 0.9 : 0.7}
                      />
                      {rank && !selectedDong && !hovered && (
                        <text
                          x={-labelWidth / 2 + 10}
                          y="0"
                          fill="#86868b"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {rank}
                        </text>
                      )}
                      <text
                        x={rank && !selectedDong && !hovered ? -labelWidth / 2 + 25 : 0}
                        y="1"
                        dominantBaseline="middle"
                        fill={selectedDong || hovered ? "#ffffff" : "#1d1d1f"}
                        fontSize={selectedDong || hovered ? "17" : "14"}
                        fontWeight="700"
                        textAnchor={rank && !selectedDong && !hovered ? "start" : "middle"}
                      >
                        {district.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <aside className="border-t border-[#d2d2d7] bg-white p-5 xl:border-l xl:border-t-0">
              <p className="eyebrow mb-4">Top 5</p>
              <ol className="space-y-2">
                {rankedByMetric.slice(0, 5).map((district, index) => (
                  <li key={`${activeMetric.key}-${district.dong_cd}`}>
                    <button
                      type="button"
                      onClick={() => chooseDistrict(district)}
                      className={`grid w-full grid-cols-[24px_minmax(0,1fr)_44px] items-baseline gap-2 rounded-[6px] px-2 py-2 text-left transition-colors ${
                        selected?.dong_cd === district.dong_cd
                          ? "bg-[#f5f5f7]"
                          : "hover:bg-[#f5f5f7]"
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-[#86868b]">
                        {index + 1}
                      </span>
                      <span className="truncate text-[14px] font-semibold text-[#1d1d1f]">
                        {district.동명}
                      </span>
                      <span className="text-right text-[13px] font-semibold tabular-nums text-[#424245]">
                        {activeMetric.value(district).toFixed(0)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <aside className="bg-white">
          {selected ? (
            <DistrictPanel district={selected} activeMetric={activeMetric} />
          ) : (
            <div className="p-6">
              <p className="text-[15px] text-[#6e6e73]">동을 선택하세요.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DistrictPanel({
  district,
  activeMetric,
}: {
  district: DongScore;
  activeMetric: MetricDefinition;
}) {
  const scoreRows = [
    { key: "syli", label: "종합", value: district.SYLI_v02 },
    { key: "commute", label: "판교 통근", value: district.SCORE_COMMUTE_PANGYO },
    { key: "rent", label: "월세 접근성", value: district.SCORE_RENT },
    { key: "infra", label: "생활 인프라", value: district.SCORE_INFRA },
    { key: "youth", label: "청년 체류", value: district.SCORE_YOUTH_STAY },
    { key: "lifestyle", label: "동 유형", value: district.SCORE_LIFESTYLE },
  ];
  const explanatoryRows = scoreRows.filter(
    (row) => row.key !== "syli" && row.key !== "lifestyle"
  );
  const strongest = [...explanatoryRows].sort((a, b) => b.value - a.value)[0];
  const weakest = [...explanatoryRows].sort((a, b) => a.value - b.value)[0];
  const policyRead = getPolicyRead(district);
  const verdict = getPolicyVerdict(district);

  return (
    <div>
      <div className="border-b border-[#d2d2d7] p-6">
        <p className="text-[13px] font-semibold text-[#86868b]">
          {district.구} · {district.lifestyle}
        </p>
        <h2 className="mt-2 text-[34px] font-semibold leading-[1.05] text-[#1d1d1f]">
          {district.동명}
        </h2>
        <div className="mt-7">
          <div className="text-[56px] font-semibold leading-none tabular-nums text-[#1d1d1f]">
            {activeMetric.value(district).toFixed(1)}
          </div>
          <p className="mt-2 text-[13px] text-[#6e6e73]">
            {activeMetric.label} 기준
          </p>
        </div>
        <div className="mt-6 grid gap-2">
          <div className="rounded-[8px] border border-[#d2d2d7] bg-[#fbfbfd] p-4">
            <p className="text-[11px] font-semibold uppercase text-[#86868b]">
              정책 판정
            </p>
            <p className="mt-2 text-[18px] font-semibold leading-[1.2] text-[#1d1d1f]">
              {verdict.label}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[8px] bg-[#10252a] px-4 py-3 text-white">
            <span className="text-[12px] font-semibold text-white/62">
              다음 검토
            </span>
            <span className="text-right text-[14px] font-semibold">
              {verdict.nextStep}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[#d2d2d7]">
        <MetaCell label="월세 중위" value={formatRent(district)} />
        <MetaCell
          label="계약 수"
          value={`${(district.n_contracts ?? 0).toLocaleString()}건`}
        />
      </div>

      <div className="border-b border-[#d2d2d7] p-6">
        <p className="eyebrow mb-4">Read</p>
        <p className="text-[16px] leading-[1.45] text-[#1d1d1f]">
          {district.동명}은{" "}
          <span className="font-semibold">
            {withSubjectParticle(strongest.label)}
          </span>{" "}
          강하고,{" "}
          <span className="font-semibold">
            {withSubjectParticle(weakest.label)}
          </span>{" "}
          상대적으로 약합니다.
        </p>
        <p className="mt-3 text-[14px] leading-[1.45] text-[#6e6e73]">
          {policyRead}
        </p>
        <p className="mt-4 border-t border-[#d2d2d7] pt-4 text-[13px] leading-[1.45] text-[#86868b]">
          현재 지도는 {activeMetric.description} 기준의 분포를 보여줍니다.
        </p>
      </div>

      <dl className="space-y-4 p-6">
        {scoreRows.map((row) => (
          <ScoreBar
            key={row.key}
            label={row.label}
            value={row.value}
            active={row.key === activeMetric.key}
          />
        ))}
      </dl>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-4 text-[13px]">
        <dt className={active ? "font-semibold text-[#1d1d1f]" : "text-[#6e6e73]"}>
          {label}
        </dt>
        <dd className="font-semibold tabular-nums text-[#424245]">
          {value.toFixed(0)}
        </dd>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#ececf0]">
        <div
          className={`h-full rounded-full ${active ? "bg-[#1d1d1f]" : "bg-[#86868b]"}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fbfbfd] p-5">
      <dt className="text-[12px] font-semibold text-[#86868b]">{label}</dt>
      <dd className="mt-2 text-[20px] font-semibold text-[#1d1d1f]">{value}</dd>
    </div>
  );
}

function createSvgDistricts(
  geo: BoundaryCollection,
  byCd: Record<string, DongScore>
) {
  const bounds = getCoordinateBounds(geo);
  if (!bounds) return [];

  const [minLng, minLat, maxLng, maxLat] = bounds;
  const width = Math.max(0.000001, maxLng - minLng);
  const height = Math.max(0.000001, maxLat - minLat);
  const drawable = SVG_SIZE - SVG_PADDING * 2;

  const project = ([lng, lat]: [number, number]) => {
    const x = SVG_PADDING + ((lng - minLng) / width) * drawable;
    const y = SVG_PADDING + ((maxLat - lat) / height) * drawable;
    return [x, y] as const;
  };

  const districts: SvgDistrict[] = [];

  for (const feature of geo.features) {
    const dongCd = String(
      feature.properties.ADMI_CD ?? feature.properties.dong_cd
    );
    const score = byCd[dongCd];
    const path = geometryToSvgPath(feature.geometry, project);
    const center = geometryCenter(feature.geometry.coordinates, project);

    if (path && center) {
      districts.push({
        center,
        dongCd,
        name: score?.동명 ?? String(feature.properties.dong_name ?? dongCd),
        path,
        score,
      });
    }
  }

  return districts;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampMapCamera(camera: MapCamera) {
  const scale = clamp(camera.scale, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
  const viewBoxSize = SVG_SIZE / scale;
  const maxOffset = SVG_SIZE - viewBoxSize;

  return {
    scale,
    x: clamp(camera.x, 0, maxOffset),
    y: clamp(camera.y, 0, maxOffset),
  };
}

function getPointerDistrict(
  event: ReactPointerEvent<SVGSVGElement>,
  byCd: Record<string, DongScore>
) {
  if (!(event.target instanceof Element)) return undefined;

  const target = event.target.closest<SVGElement>("[data-map-dong]");
  const dongCd = target?.getAttribute("data-map-dong");

  return dongCd ? byCd[dongCd] : undefined;
}

function getPointDistance(first: PointerPoint, second: PointerPoint) {
  return getDistanceBetweenPoints(
    first.clientX,
    first.clientY,
    second.clientX,
    second.clientY
  );
}

function getDistanceBetweenPoints(
  firstX: number,
  firstY: number,
  secondX: number,
  secondY: number
) {
  return Math.hypot(firstX - secondX, firstY - secondY);
}

function geometryCenter(
  coordinates: unknown,
  project: (point: [number, number]) => readonly [number, number]
) {
  const points: Array<readonly [number, number]> = [];

  visitCoordinates(coordinates, (point) => {
    points.push(project(point));
  });

  if (points.length === 0) return null;

  const [sumX, sumY] = points.reduce(
    ([accX, accY], [x, y]) => [accX + x, accY + y],
    [0, 0]
  );

  return [sumX / points.length, sumY / points.length] as const;
}

function createSpatialRead(
  metricKey: MetricKey,
  districts: SvgDistrict[],
  rankedByMetric: DongScore[]
): SpatialRead | null {
  if (districts.length === 0) return null;

  const readMeta: Record<
    MetricKey,
    {
      accent: string;
      caption: string;
      names: string[];
      title: string;
    }
  > = {
    syli: {
      accent: "#2f6f73",
      caption: "통근·생활 균형",
      names: ["서현1동", "성남동", "야탑1동", "백현동", "삼평동"],
      title: "균형 적합축",
    },
    commute: {
      accent: "#0f4f66",
      caption: "판교 접근 강도",
      names: ["삼평동", "백현동", "판교동", "운중동", "서현1동"],
      title: "판교 접근축",
    },
    rent: {
      accent: "#7a6333",
      caption: "저비용 후보지",
      names: ["하대원동", "복정동", "은행2동", "은행1동", "상대원1동"],
      title: "월세 완충권",
    },
    infra: {
      accent: "#234c4e",
      caption: "생활 밀도",
      names: ["백현동", "정자1동", "서현1동", "수내1동", "삼평동"],
      title: "생활 중심축",
    },
  };
  const meta = readMeta[metricKey];
  const byName = new Map(districts.map((district) => [district.name, district]));
  const fallbackCodes = new Set(
    rankedByMetric.slice(0, 5).map((district) => district.dong_cd)
  );
  const targetDistricts = meta.names
    .map((name) => byName.get(name))
    .filter((district): district is SvgDistrict => Boolean(district));
  const resolved =
    targetDistricts.length >= 3
      ? targetDistricts
      : districts.filter((district) => fallbackCodes.has(district.dongCd));

  const points = resolved
    .map((district) => district.center)
    .sort(([ax, ay], [bx, by]) => ax - bx || ay - by)
    .slice(0, 6);

  if (points.length < 2) return null;

  const label = averagePoint(points);
  const labelX = Math.max(130, Math.min(SVG_SIZE - 130, label[0] + 56));
  const labelY = Math.max(92, Math.min(SVG_SIZE - 92, label[1] - 78));

  return {
    accent: meta.accent,
    caption: meta.caption,
    label: [labelX, labelY],
    path: pointsToPath(points),
    points,
    title: meta.title,
  };
}

function pointsToPath(points: Array<readonly [number, number]>) {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function averagePoint(points: Array<readonly [number, number]>) {
  const [sumX, sumY] = points.reduce(
    ([accX, accY], [x, y]) => [accX + x, accY + y],
    [0, 0]
  );

  return [sumX / points.length, sumY / points.length] as const;
}

function getCoordinateBounds(geo: BoundaryCollection) {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const feature of geo.features) {
    visitCoordinates(feature.geometry.coordinates, ([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat] as const;
}

function geometryToSvgPath(
  geometry: BoundaryFeature["geometry"],
  project: (point: [number, number]) => readonly [number, number]
) {
  if (geometry.type === "Polygon") {
    return polygonToSvgPath(geometry.coordinates, project);
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates
      .map((polygon) => polygonToSvgPath(polygon, project))
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function polygonToSvgPath(
  polygon: unknown,
  project: (point: [number, number]) => readonly [number, number]
) {
  if (!Array.isArray(polygon)) return "";

  return polygon
    .map((ring) => {
      if (!Array.isArray(ring)) return "";

      const commands = ring
        .filter(isCoordinate)
        .map((point, index) => {
          const [x, y] = project(point);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        });

      return commands.length ? `${commands.join(" ")} Z` : "";
    })
    .filter(Boolean)
    .join(" ");
}

function visitCoordinates(
  coordinates: unknown,
  visitor: (point: [number, number]) => void
) {
  if (isCoordinate(coordinates)) {
    visitor(coordinates);
    return;
  }

  if (Array.isArray(coordinates)) {
    coordinates.forEach((child) => visitCoordinates(child, visitor));
  }
}

function isCoordinate(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function metricToColor(value: number) {
  if (value >= 82) return "#123f49";
  if (value >= 70) return "#2f6f73";
  if (value >= 58) return "#7aa39d";
  if (value >= 46) return "#b9c9b8";
  if (value >= 34) return "#d9caa5";
  return "#efe8dc";
}

function elevationFor(value: number, focused = false) {
  const normalized = Math.max(0, Math.min(100, value));
  return 8 + Math.round(normalized * 0.22) + (focused ? 10 : 0);
}

function reliefOpacity(value: number) {
  const normalized = Math.max(0, Math.min(100, value));
  return 0.08 + normalized * 0.00125;
}

function getPolicyRead(district: DongScore) {
  if (district.SCORE_COMMUTE_PANGYO >= 80 && district.SCORE_RENT < 50) {
    return "판교 접근성은 좋지만 월세 장벽이 큽니다. 고가화 완충이나 주변 대체지를 함께 검토해야 합니다.";
  }

  if (district.SCORE_COMMUTE_PANGYO >= 75 && district.SCORE_RENT >= 65) {
    return "통근과 비용의 균형이 좋아 청년 실거주 후보지로 우선 검토할 만합니다.";
  }

  if (district.SCORE_RENT >= 85 && district.SCORE_COMMUTE_PANGYO < 35) {
    return "월세 접근성은 좋지만 판교 통근 보완 없이는 주거 선택지로 확장되기 어렵습니다.";
  }

  if (district.SCORE_INFRA >= 70 && district.SCORE_YOUTH_STAY >= 55) {
    return "생활 기반과 청년 체류가 함께 관측되어, 방문 수요를 거주 수요로 연결하기 좋은 동입니다.";
  }

  if (district.SCORE_INFRA < 35) {
    return "생활 인프라가 약해 주거비만으로는 선택지를 만들기 어렵습니다.";
  }

  return "한 축의 점수보다 통근, 비용, 생활 조건의 균형을 함께 봐야 하는 동입니다.";
}

function getPolicyVerdict(district: DongScore) {
  if (district.SCORE_COMMUTE_PANGYO >= 80 && district.SCORE_RENT < 50) {
    return {
      label: "통근 우수·가격 완충 필요",
      nextStep: "월세 완충",
    };
  }

  if (
    district.SCORE_COMMUTE_PANGYO >= 75 &&
    district.SCORE_RENT >= 65 &&
    district.SCORE_INFRA >= 60
  ) {
    return {
      label: "우선 검토 후보",
      nextStep: "실거주 검토",
    };
  }

  if (district.SCORE_RENT >= 85 && district.SCORE_COMMUTE_PANGYO < 35) {
    return {
      label: "저비용·통근 보완형",
      nextStep: "교통 연결",
    };
  }

  if (district.SCORE_INFRA >= 70 && district.SCORE_YOUTH_STAY >= 55) {
    return {
      label: "생활 중심 강화형",
      nextStep: "거주 전환",
    };
  }

  if (district.SCORE_INFRA < 35) {
    return {
      label: "생활 인프라 보강형",
      nextStep: "생활권 보강",
    };
  }

  return {
    label: "균형 검토형",
    nextStep: "복합 검토",
  };
}

function withSubjectParticle(label: string) {
  return `${label}${hasFinalConsonant(label) ? "이" : "가"}`;
}

function hasFinalConsonant(value: string) {
  const lastChar = value.trim().charCodeAt(value.trim().length - 1);

  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    return false;
  }

  return (lastChar - 0xac00) % 28 !== 0;
}

function formatRent(district: DongScore) {
  return district.median_rent
    ? `${district.median_rent.toFixed(0)}만원`
    : "데이터 없음";
}
