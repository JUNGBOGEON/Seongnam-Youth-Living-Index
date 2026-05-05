import type { MetricDefinition } from "@/components/map/model";
import type { DongScore } from "@/lib/data";

export type AiPolicyInsightType = {
  summary: string;
  evidence: string[];
  action: string;
};

export type AiPolicyPayloadType = {
  dongCd: string;
  metricKey: MetricDefinition["key"];
};

type PolicyFactorType = {
  label: string;
  value: number;
};

export function createFallbackPolicyInsight(
  district: DongScore,
  activeMetric: MetricDefinition
): AiPolicyInsightType {
  const factorList = getPolicyFactorList(district);
  const strongest = [...factorList].sort((a, b) => b.value - a.value)[0];
  const weakest = [...factorList].sort((a, b) => a.value - b.value)[0];
  const activeScore = activeMetric.value(district);

  return {
    summary: `${district.동명}은 ${strongest.label} 점수가 높고 ${weakest.label} 점수는 더 살펴볼 필요가 있습니다.`,
    evidence: [
      `${activeMetric.label} 점수는 ${activeScore.toFixed(0)}점으로 ${getScoreTone(activeScore)}입니다.`,
      `${strongest.label} ${strongest.value.toFixed(0)}점, ${weakest.label} ${weakest.value.toFixed(0)}점입니다.`,
      `월세 중간값은 ${
        district.median_rent ? `${district.median_rent.toFixed(0)}만원` : "확인되지 않음"
      }, 계약 수는 ${(district.n_contracts ?? 0).toLocaleString()}건입니다.`,
    ],
    action: getFallbackAction(strongest, weakest),
  };
}

export function isAiPolicyInsight(value: unknown): value is AiPolicyInsightType {
  if (!value || typeof value !== "object") {
    return false;
  }

  const insight = value as Partial<AiPolicyInsightType>;

  return (
    typeof insight.summary === "string" &&
    typeof insight.action === "string" &&
    Array.isArray(insight.evidence) &&
    insight.evidence.length >= 2 &&
    insight.evidence.length <= 3 &&
    insight.evidence.every((item) => typeof item === "string")
  );
}

function getPolicyFactorList(district: DongScore): PolicyFactorType[] {
  return [
    { label: "판교 통근", value: district.SCORE_COMMUTE_PANGYO },
    { label: "월세 부담", value: district.SCORE_RENT },
    { label: "생활 편의", value: district.SCORE_INFRA },
    { label: "청년 머무름", value: district.SCORE_YOUTH_STAY },
  ];
}

function getScoreTone(score: number) {
  if (score >= 75) return "높은 구간";
  if (score >= 55) return "중간 이상 구간";
  if (score >= 40) return "검토 구간";
  return "낮은 구간";
}

function getFallbackAction(
  strongest: PolicyFactorType,
  weakest: PolicyFactorType
) {
  if (weakest.label === "판교 통근") {
    return "교통이 좋아지면 낮은 월세의 장점이 더 커집니다.";
  }

  if (weakest.label === "월세 부담") {
    return "월세 부담을 낮추는 지원이나 주변 대안을 함께 봐야 합니다.";
  }

  if (weakest.label === "생활 편의") {
    return "편의시설과 생활 환경을 더 채워야 살기 좋은 동으로 보기 쉽습니다.";
  }

  if (strongest.label === "청년 머무름") {
    return "청년들이 머무는 흐름을 실제 거주로 이어갈 방법을 봐야 합니다.";
  }

  return "좋은 점은 살리고 낮은 점수의 이유를 먼저 살펴봐야 합니다.";
}
