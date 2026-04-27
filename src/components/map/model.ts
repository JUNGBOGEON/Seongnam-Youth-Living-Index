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

export const METRIC_BY_KEY = Object.fromEntries(
  METRICS.map((metric) => [metric.key, metric])
) as Record<MetricKey, MetricDefinition>;
