"use client";

import type { CSSProperties } from "react";
import { METRICS, type MetricKey } from "@/components/map/model";

type MetricTabsProps = {
  value: MetricKey;
  onChange: (metric: MetricKey) => void;
};

export function MetricTabs({ value, onChange }: MetricTabsProps) {
  const activeIndex = Math.max(
    0,
    METRICS.findIndex((metric) => metric.key === value)
  );
  const indicatorStyle = {
    transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
    width: "calc((100% - 1.25rem) / 4)",
  } satisfies CSSProperties;

  return (
    <div
      aria-label="지도 지표 선택"
      className="metric-tabs"
      data-map-metric-tabs
    >
      <span
        aria-hidden="true"
        className="metric-tabs-indicator"
        style={indicatorStyle}
      />
      {METRICS.map((metric) => {
        const active = metric.key === value;

        return (
          <button
            key={metric.key}
            type="button"
            onClick={() => onChange(metric.key)}
            className={`relative z-10 min-w-0 overflow-hidden rounded-full px-1 py-2 type-micro font-semibold transition-colors duration-200 sm:px-3 ${
              active ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            {metric.label}
          </button>
        );
      })}
    </div>
  );
}
