"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEventHandler,
  RefObject,
  WheelEventHandler,
} from "react";
import type { DongScore } from "@/lib/data";
import {
  elevationFor,
  metricToColor,
  reliefOpacity,
} from "@/components/map/geometry";
import {
  SVG_SIZE,
  type MetricDefinition,
  type SpatialRead,
  type SvgDistrict,
} from "@/components/map/model";

type DistrictMapCanvasProps = {
  activeMetric: MetricDefinition;
  districts: SvgDistrict[];
  hoveredDong: string | null;
  labelDistricts: SvgDistrict[];
  mapSvgRef: RefObject<SVGSVGElement | null>;
  mapViewBox: string;
  selectedDong?: string;
  spatialRead: SpatialRead | null;
  topRankMap: Map<string, number>;
  onChooseDistrict: (district?: DongScore) => void;
  onHoverDistrict: (dongCd: string | null) => void;
  onPointerCancel: PointerEventHandler<SVGSVGElement>;
  onPointerDown: PointerEventHandler<SVGSVGElement>;
  onPointerLeave: PointerEventHandler<SVGSVGElement>;
  onPointerMove: PointerEventHandler<SVGSVGElement>;
  onPointerUp: PointerEventHandler<SVGSVGElement>;
  onWheel: WheelEventHandler<SVGSVGElement>;
};

export function DistrictMapCanvas({
  activeMetric,
  districts,
  hoveredDong,
  labelDistricts,
  mapSvgRef,
  mapViewBox,
  selectedDong,
  spatialRead,
  topRankMap,
  onChooseDistrict,
  onHoverDistrict,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerMove,
  onPointerUp,
  onWheel,
}: DistrictMapCanvasProps) {
  return (
    <svg
      aria-label="성남시 행정동 지도"
      ref={mapSvgRef}
      className="map-canvas"
      data-map-svg
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={mapViewBox}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <defs>
        <filter id="district-lift" x="-20%" y="-20%" width="140%" height="140%">
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

      {spatialRead && <SpatialReadLayer read={spatialRead} />}
      <ReliefLayer activeMetric={activeMetric} districts={districts} />
      <DistrictLayer
        activeMetric={activeMetric}
        districts={districts}
        hoveredDong={hoveredDong}
        selectedDong={selectedDong}
        onChooseDistrict={onChooseDistrict}
        onHoverDistrict={onHoverDistrict}
      />
      <FocusLayer
        activeMetric={activeMetric}
        districts={districts}
        hoveredDong={hoveredDong}
        selectedDong={selectedDong}
      />
      <DistrictLabels
        districts={labelDistricts}
        hoveredDong={hoveredDong}
        selectedDong={selectedDong}
        topRankMap={topRankMap}
      />
    </svg>
  );
}

function SpatialReadLayer({ read }: { read: SpatialRead }) {
  return (
    <g aria-hidden="true" pointerEvents="none">
      <path
        d={read.path}
        fill="none"
        opacity="0.12"
        stroke={read.accent}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="28"
      />
      <path
        d={read.path}
        fill="none"
        opacity="0.72"
        stroke={read.accent}
        strokeDasharray="10 12"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      {read.points.map(([x, y], index) => (
        <circle
          key={`spatial-point-${index}`}
          cx={x}
          cy={y}
          fill="#ffffff"
          r="7"
          stroke={read.accent}
          strokeOpacity="0.76"
          strokeWidth="3"
        />
      ))}
      <g
        transform={`translate(${read.label[0].toFixed(2)} ${read.label[1].toFixed(2)})`}
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
          {read.title}
        </text>
        <text
          y="12"
          fill="#6e6e73"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
        >
          {read.caption}
        </text>
      </g>
    </g>
  );
}

function ReliefLayer({
  activeMetric,
  districts,
}: {
  activeMetric: MetricDefinition;
  districts: SvgDistrict[];
}) {
  return districts.map((district) => {
    const value = district.score ? activeMetric.value(district.score) : 0;
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
  });
}

function DistrictLayer({
  activeMetric,
  districts,
  hoveredDong,
  selectedDong,
  onChooseDistrict,
  onHoverDistrict,
}: {
  activeMetric: MetricDefinition;
  districts: SvgDistrict[];
  hoveredDong: string | null;
  selectedDong?: string;
  onChooseDistrict: (district?: DongScore) => void;
  onHoverDistrict: (dongCd: string | null) => void;
}) {
  return districts.map((district) => {
    const selected = selectedDong === district.dongCd;
    const hovered = hoveredDong === district.dongCd;
    const value = district.score ? activeMetric.value(district.score) : 0;
    const dimmed = hoveredDong !== null && !hovered && !selected;

    return (
      <path
        key={district.dongCd}
        aria-label={district.name}
        className="district-shape focus:outline-none"
        d={district.path}
        fill={metricToColor(value)}
        fillOpacity={selected || hovered ? 0.98 : dimmed ? 0.44 : 0.86}
        fillRule="evenodd"
        stroke={selected || hovered ? "#10252a" : "#ffffff"}
        strokeOpacity={selected || hovered ? 1 : 0.9}
        strokeWidth={selected ? 3.2 : hovered ? 2.4 : 1.4}
        data-map-dong={district.dongCd}
        style={{ outline: "none" }}
        tabIndex={0}
        vectorEffect="non-scaling-stroke"
        onKeyDown={(event) =>
          chooseWithKeyboard(event, district.score, onChooseDistrict)
        }
        onMouseEnter={() => onHoverDistrict(district.dongCd)}
        onMouseLeave={() => onHoverDistrict(null)}
      />
    );
  });
}

function FocusLayer({
  activeMetric,
  districts,
  hoveredDong,
  selectedDong,
}: {
  activeMetric: MetricDefinition;
  districts: SvgDistrict[];
  hoveredDong: string | null;
  selectedDong?: string;
}) {
  return districts
    .filter(
      (district) =>
        district.dongCd === hoveredDong || district.dongCd === selectedDong
    )
    .map((district) => {
      const value = district.score ? activeMetric.value(district.score) : 0;
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
    });
}

function DistrictLabels({
  districts,
  hoveredDong,
  selectedDong,
  topRankMap,
}: {
  districts: SvgDistrict[];
  hoveredDong: string | null;
  selectedDong?: string;
  topRankMap: Map<string, number>;
}) {
  return districts.map((district) => {
    const rank = topRankMap.get(district.dongCd);
    const selected = selectedDong === district.dongCd;
    const hovered = hoveredDong === district.dongCd;
    const labelWidth = 34 + district.name.length * 13;
    const [x, y] = district.center;
    const offsetY = selected || hovered ? -22 : -14;
    const showRank = Boolean(rank && !selected && !hovered);

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
          fill={selected || hovered ? "#10252a" : "#ffffff"}
          fillOpacity={selected || hovered ? 0.94 : 0.88}
          stroke={selected || hovered ? "#10252a" : "#d2d2d7"}
          strokeOpacity={selected || hovered ? 0.9 : 0.7}
        />
        {showRank && (
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
          x={showRank ? -labelWidth / 2 + 25 : 0}
          y="1"
          dominantBaseline="middle"
          fill={selected || hovered ? "#ffffff" : "#1d1d1f"}
          fontSize={selected || hovered ? "17" : "14"}
          fontWeight="700"
          textAnchor={showRank ? "start" : "middle"}
        >
          {district.name}
        </text>
      </g>
    );
  });
}

function chooseWithKeyboard(
  event: ReactKeyboardEvent<SVGPathElement>,
  district: DongScore | undefined,
  onChooseDistrict: (district?: DongScore) => void
) {
  if (!district) return;
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  onChooseDistrict(district);
}
