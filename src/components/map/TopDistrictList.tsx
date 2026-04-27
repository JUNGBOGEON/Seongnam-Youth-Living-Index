import type { DongScore } from "@/lib/data";
import type { MetricDefinition } from "@/components/map/model";

type TopDistrictListProps = {
  activeMetric: MetricDefinition;
  districts: DongScore[];
  selectedDong?: string;
  onSelect: (district: DongScore) => void;
};

export function TopDistrictList({
  activeMetric,
  districts,
  selectedDong,
  onSelect,
}: TopDistrictListProps) {
  return (
    <aside className="border-t border-line bg-white p-5 xl:border-l xl:border-t-0">
      <p className="eyebrow mb-4">Top 5</p>
      <ol className="space-y-2">
        {districts.slice(0, 5).map((district, index) => (
          <li key={`${activeMetric.key}-${district.dong_cd}`}>
            <button
              type="button"
              onClick={() => onSelect(district)}
              className={`top-list-row w-full items-baseline gap-2 rounded-row px-2 py-2 text-left transition-colors ${
                selectedDong === district.dong_cd
                  ? "bg-panel"
                  : "hover:bg-panel"
              }`}
            >
              <span className="copy-tiny font-semibold text-subtle">
                {index + 1}
              </span>
              <span className="truncate copy-note font-semibold text-ink">
                {district.동명}
              </span>
              <span className="text-right copy-label font-semibold tabular-nums text-utility">
                {activeMetric.value(district).toFixed(0)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
