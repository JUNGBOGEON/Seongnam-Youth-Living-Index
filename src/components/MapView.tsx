"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DongScore } from "@/lib/data";
import { DistrictMapCanvas } from "@/components/map/DistrictMapCanvas";
import { DistrictPanel } from "@/components/map/DistrictPanel";
import {
  createSpatialRead,
  createSvgDistricts,
} from "@/components/map/geometry";
import { MetricTabs } from "@/components/map/MetricTabs";
import { SelectedDistrictCard } from "@/components/map/SelectedDistrictCard";
import { TopDistrictList } from "@/components/map/TopDistrictList";
import {
  METRIC_BY_KEY,
  SVG_SIZE,
  type BoundaryCollection,
  type MetricKey,
  type SvgDistrict,
} from "@/components/map/model";
import { useMapCamera } from "@/components/map/useMapCamera";

type Props = {
  scores: DongScore[];
};

export function MapView({ scores }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("syli");
  const [districts, setDistricts] = useState<SvgDistrict[]>([]);
  const [hoveredDong, setHoveredDong] = useState<string | null>(null);
  const rankedBySyli = useMemo(
    () => [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02),
    [scores]
  );
  const [selectedDistrict, setSelectedDistrict] = useState<DongScore | null>(
    rankedBySyli[0] ?? null
  );
  const scoresByDongCode = useMemo(() => {
    const entries = scores.map((score) => [score.dong_cd, score] as const);
    return Object.fromEntries(entries);
  }, [scores]);
  const activeMetric = METRIC_BY_KEY[selectedMetric];
  const rankedByMetric = useMemo(
    () =>
      [...scores].sort((a, b) => activeMetric.value(b) - activeMetric.value(a)),
    [activeMetric, scores]
  );
  const topRankMap = useMemo(
    () =>
      new Map(
        rankedByMetric
          .slice(0, 5)
          .map((district, index) => [district.dong_cd, index + 1])
      ),
    [rankedByMetric]
  );
  const selectDistrict = useCallback((district?: DongScore) => {
    if (district) setSelectedDistrict(district);
  }, []);
  const {
    handleMapPointerDown,
    handleMapPointerEnd,
    handleMapPointerMove,
    handleMapWheel,
    mapCamera,
    mapSvgRef,
  } = useMapCamera({ onSelect: selectDistrict, scoresByDongCode });
  const labelDistricts = useMemo(
    () =>
      getLabelDistricts({
        districts,
        hoveredDong,
        rankedByMetric,
        selectedDong: selectedDistrict?.dong_cd,
      }),
    [districts, hoveredDong, rankedByMetric, selectedDistrict]
  );
  const spatialRead = useMemo(
    () => createSpatialRead(selectedMetric, districts, rankedByMetric),
    [districts, rankedByMetric, selectedMetric]
  );
  const hoveredDistrict = hoveredDong ? scoresByDongCode[hoveredDong] : null;
  const focusedDistrict = hoveredDistrict ?? selectedDistrict;
  const focusedRank = focusedDistrict
    ? topRankMap.get(focusedDistrict.dong_cd)
    : undefined;
  const mapViewBoxSize = SVG_SIZE / mapCamera.scale;
  const mapViewBox = `${mapCamera.x} ${mapCamera.y} ${mapViewBoxSize} ${mapViewBoxSize}`;

  useEffect(() => {
    let ignore = false;

    async function loadBoundaries() {
      const response = await fetch("/data/dong_boundaries.geojson");
      const geo = (await response.json()) as BoundaryCollection;

      if (!ignore) {
        setDistricts(createSvgDistricts(geo, scoresByDongCode));
      }
    }

    loadBoundaries().catch(() => {
      if (!ignore) setDistricts([]);
    });

    return () => {
      ignore = true;
    };
  }, [scoresByDongCode]);

  return (
    <div className="map-frame">
      <div className="map-shell-grid">
        <section className="bg-panel">
          <MapHeader />

          <div className="map-main-grid">
            <div className="map-stage">
              <MetricTabs value={selectedMetric} onChange={setSelectedMetric} />

              {focusedDistrict && (
                <SelectedDistrictCard
                  activeMetric={activeMetric}
                  district={focusedDistrict}
                  hovered={Boolean(hoveredDistrict)}
                  rank={focusedRank}
                />
              )}

              <DistrictMapCanvas
                activeMetric={activeMetric}
                districts={districts}
                hoveredDong={hoveredDong}
                labelDistricts={labelDistricts}
                mapSvgRef={mapSvgRef}
                mapViewBox={mapViewBox}
                selectedDong={selectedDistrict?.dong_cd}
                spatialRead={spatialRead}
                topRankMap={topRankMap}
                onChooseDistrict={selectDistrict}
                onHoverDistrict={setHoveredDong}
                onPointerCancel={handleMapPointerEnd}
                onPointerDown={handleMapPointerDown}
                onPointerLeave={handleMapPointerEnd}
                onPointerMove={handleMapPointerMove}
                onPointerUp={handleMapPointerEnd}
                onWheel={handleMapWheel}
              />
            </div>

            <TopDistrictList
              activeMetric={activeMetric}
              districts={rankedByMetric}
              selectedDong={selectedDistrict?.dong_cd}
              onSelect={selectDistrict}
            />
          </div>
        </section>

        <aside className="bg-white">
          {selectedDistrict ? (
            <DistrictPanel
              activeMetric={activeMetric}
              district={selectedDistrict}
            />
          ) : (
            <div className="p-6">
              <p className="copy-small text-muted">동을 선택하세요.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function MapHeader() {
  return (
    <div className="border-b border-line bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Map View</p>
          <h2 className="type-util font-semibold leading-tight text-ink">
            동별 강도를 먼저 보고, 눌러서 이유를 확인합니다.
          </h2>
          <p className="mt-2 copy-narrow copy-note leading-relaxed text-muted">
            지표를 바꾸면 지도, 순위, 정책 판정이 함께 바뀝니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function getLabelDistricts({
  districts,
  hoveredDong,
  rankedByMetric,
  selectedDong,
}: {
  districts: SvgDistrict[];
  hoveredDong: string | null;
  rankedByMetric: DongScore[];
  selectedDong?: string;
}) {
  const labelIds = new Set<string>();

  rankedByMetric.slice(0, 5).forEach((district) => {
    labelIds.add(district.dong_cd);
  });
  if (selectedDong) labelIds.add(selectedDong);
  if (hoveredDong) labelIds.add(hoveredDong);

  return districts
    .filter((district) => labelIds.has(district.dongCd) && district.score)
    .sort((a, b) => {
      const aFocused = a.dongCd === selectedDong || a.dongCd === hoveredDong;
      const bFocused = b.dongCd === selectedDong || b.dongCd === hoveredDong;
      return Number(aFocused) - Number(bFocused);
    });
}
