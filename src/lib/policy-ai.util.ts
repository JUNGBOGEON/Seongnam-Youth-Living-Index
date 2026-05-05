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
    summary: `${district.동명}은 ${strongest.label} 점수가 높고 ${weakest.label} 점수는 보완이 필요한 편입니다.`,
    evidence: [
      `${activeMetric.label} 점수는 ${activeScore.toFixed(0)}점으로 ${getScoreTone(activeScore)}입니다.`,
      `${strongest.label} ${strongest.value.toFixed(0)}점, ${weakest.label} ${weakest.value.toFixed(0)}점입니다.`,
      `월세 중위값은 ${
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
    { label: "월세 접근성", value: district.SCORE_RENT },
    { label: "생활 인프라", value: district.SCORE_INFRA },
    { label: "청년 체류", value: district.SCORE_YOUTH_STAY },
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
    return "교통 연결을 먼저 보완하면 낮은 주거비의 장점이 더 분명해집니다.";
  }

  if (weakest.label === "월세 접근성") {
    return "임대료 완충이나 주변 대체지를 함께 묶어 검토하는 편이 좋습니다.";
  }

  if (weakest.label === "생활 인프라") {
    return "생활권 편의 요소를 보강해야 실제 거주 후보지로 설명력이 생깁니다.";
  }

  if (strongest.label === "청년 체류") {
    return "이미 관측되는 청년 활동을 실거주 수요로 연결할 방법을 확인해야 합니다.";
  }

  return "강점은 유지하되 낮은 축을 보완하는 방식으로 정책 우선순위를 잡는 편이 좋습니다.";
}
