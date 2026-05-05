import type { DongScore } from "@/lib/data";

export type MetricKey = "syli" | "commute" | "rent" | "infra";

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  description: string;
  value: (score: DongScore) => number;
};

export type BoundaryFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
};

export type BoundaryCollection = {
  type: "FeatureCollection";
  features: BoundaryFeature[];
};

export type SvgDistrict = {
  center: readonly [number, number];
  dongCd: string;
  name: string;
  path: string;
  score?: DongScore;
};

export type SpatialRead = {
  accent: string;
  caption: string;
  label: readonly [number, number];
  path: string;
  points: Array<readonly [number, number]>;
  title: string;
};

export type MapCamera = {
  scale: number;
  x: number;
  y: number;
};

export const SVG_SIZE = 1000;
export const SVG_PADDING = 28;
export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 4.4;

export const METRICS: MetricDefinition[] = [
  {
    key: "syli",
    label: "종합",
    description: "출퇴근, 월세, 생활 편의, 청년들이 얼마나 머무는지를 함께 본 점수",
    value: (score) => score.SYLI_v02,
  },
  {
    key: "commute",
    label: "통근",
    description: "판교로 오가기 얼마나 쉬운지",
    value: (score) => score.SCORE_COMMUTE_PANGYO,
  },
  {
    key: "rent",
    label: "월세",
    description: "월세 부담이 얼마나 낮은지",
    value: (score) => score.SCORE_RENT,
  },
  {
    key: "infra",
    label: "생활",
    description: "가게와 생활 편의가 얼마나 충분한지",
    value: (score) => score.SCORE_INFRA,
  },
];

export const METRIC_BY_KEY = Object.fromEntries(
  METRICS.map((metric) => [metric.key, metric])
) as Record<MetricKey, MetricDefinition>;
