import { promises as fs } from "fs";
import path from "path";

export type DongScore = {
  dong_cd: string;
  동명: string;
  구: string;
  SCORE_INFRA: number;
  SCORE_YOUTH_STAY: number;
  SCORE_COMMUTE_PANGYO: number;
  SCORE_LIFESTYLE: number;
  SCORE_RENT: number;
  SYLI_v01: number;
  SYLI_v02: number;
  lifestyle: string;
  median_rent: number | null;
  median_rent_per_pyeong: number | null;
  n_contracts: number | null;
};

export type Scenario = {
  name: string;
  icon: string;
  desc: string;
  weights: {
    commute_pangyo: number;
    infra: number;
    youth_fit: number;
    lifestyle: number;
    rent: number;
  };
};

export type Insight = {
  id: number;
  title: string;
  value: string;
  source?: string;
};

export type InsightsData = {
  summary: {
    dong_count: number;
    top_3_syli: { 동명: string; 구: string; SYLI_v02: number }[];
    bottom_3_syli: { 동명: string; 구: string; SYLI_v02: number }[];
    rent_max: { 동명: string; 월세: number };
    rent_min: { 동명: string; 월세: number };
    gu_avg_syli: Record<string, number>;
  };
  insights: Insight[];
};

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function readJson<T>(name: string): Promise<T> {
  const p = path.join(DATA_DIR, name);
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw) as T;
}

export async function getSyliScores(): Promise<DongScore[]> {
  return readJson<DongScore[]>("syli_scores.json");
}

export async function getInsights(): Promise<InsightsData> {
  return readJson<InsightsData>("insights.json");
}

export async function getScenarios(): Promise<Record<string, Scenario>> {
  return readJson<Record<string, Scenario>>("scenarios.json");
}
