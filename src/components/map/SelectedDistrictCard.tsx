import type { DongScore } from "@/lib/data";
import type { MetricDefinition } from "@/components/map/model";

type SelectedDistrictCardProps = {
  activeMetric: MetricDefinition;
  district: DongScore;
  hovered: boolean;
  rank?: number;
};

export function SelectedDistrictCard({
  activeMetric,
  district,
  hovered,
  rank,
}: SelectedDistrictCardProps) {
  return (
    <div
      className="floating-district-card"
      data-map-selected-card
    >
      <div className="flex items-center justify-between gap-3">
        <p className="type-micro font-semibold text-subtle">
          {hovered ? "지도에서 보는 동" : "선택된 동"}
        </p>
        <span className="rounded-full bg-panel px-2.5 py-1 type-micro font-semibold text-muted">
          {district.구}
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold leading-tight text-ink sm:text-2xl">
        {district.동명}
      </p>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-field bg-panel px-3 py-2.5">
        <div className="min-w-0">
          <p className="type-micro font-semibold text-muted">
            {activeMetric.label} 점수
          </p>
          <p className="mt-0.5 copy-tiny font-medium text-subtle">
            {rank ? `Top ${rank}` : "현재 선택 기준"}
          </p>
        </div>
        <p className="shrink-0 type-util font-semibold leading-none tabular-nums text-deep sm:type-card">
          {activeMetric.value(district).toFixed(0)}
          <span className="ml-0.5 copy-label font-semibold text-muted">
            점
          </span>
        </p>
      </div>
    </div>
  );
}
