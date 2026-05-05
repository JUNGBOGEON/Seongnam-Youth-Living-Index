import type { DongScore } from "@/lib/data";
import type { MetricKey } from "@/components/map/model";

export function getPolicyRead(district: DongScore) {
  if (district.SCORE_COMMUTE_PANGYO >= 80 && district.SCORE_RENT < 50) {
    return "판교로 가기는 좋지만 월세가 부담됩니다. 지원이나 주변 대안을 함께 봐야 합니다.";
  }

  if (district.SCORE_COMMUTE_PANGYO >= 75 && district.SCORE_RENT >= 65) {
    return "출퇴근과 월세가 비교적 균형 잡혀 있어 먼저 살펴볼 만합니다.";
  }

  if (district.SCORE_RENT >= 85 && district.SCORE_COMMUTE_PANGYO < 35) {
    return "월세는 낮은 편이지만 판교로 오가기가 불편할 수 있습니다.";
  }

  if (district.SCORE_INFRA >= 70 && district.SCORE_YOUTH_STAY >= 55) {
    return "생활 편의가 좋고 청년들도 어느 정도 머무는 동입니다.";
  }

  if (district.SCORE_INFRA < 35) {
    return "생활 편의가 부족해 월세가 낮아도 살기 좋은 곳으로 보기 어렵습니다.";
  }

  return "한 가지 점수만 보기보다 출퇴근, 월세, 생활 편의를 함께 봐야 합니다.";
}

export function getPolicyVerdict(district: DongScore) {
  if (district.SCORE_COMMUTE_PANGYO >= 80 && district.SCORE_RENT < 50) {
    return {
      label: "출퇴근은 좋고 월세는 부담",
      nextStep: "월세 부담",
    };
  }

  if (
    district.SCORE_COMMUTE_PANGYO >= 75 &&
    district.SCORE_RENT >= 65 &&
    district.SCORE_INFRA >= 60
  ) {
    return {
      label: "먼저 살펴볼 만한 동",
      nextStep: "실제 생활",
    };
  }

  if (district.SCORE_RENT >= 85 && district.SCORE_COMMUTE_PANGYO < 35) {
    return {
      label: "월세는 낮고 통근은 아쉬움",
      nextStep: "교통",
    };
  }

  if (district.SCORE_INFRA >= 70 && district.SCORE_YOUTH_STAY >= 55) {
    return {
      label: "생활하기 편한 동",
      nextStep: "실제 거주",
    };
  }

  if (district.SCORE_INFRA < 35) {
    return {
      label: "생활 편의가 부족한 동",
      nextStep: "편의시설",
    };
  }

  return {
    label: "여러 조건을 함께 볼 동",
    nextStep: "균형",
  };
}

export function withSubjectParticle(label: string) {
  return `${label}${hasFinalConsonant(label) ? "이" : "가"}`;
}

export function formatRent(district: DongScore) {
  return district.median_rent
    ? `${district.median_rent.toFixed(0)}만원`
    : "데이터 없음";
}

export function getScoreReason(district: DongScore, metricKey: MetricKey) {
  if (metricKey === "commute") {
    return `${district.동명}의 판교 통근 점수는 판교 쪽으로 오가고 머무는 흐름을 본 값입니다. 숫자가 높을수록 판교 생활권과 더 가깝게 움직인다는 뜻입니다.`;
  }

  if (metricKey === "rent") {
    return `${district.동명}의 월세 점수는 월세 중간값을 반대로 계산한 값입니다. 월세가 낮을수록 청년 1인가구 부담이 작다고 보고 점수를 높였습니다.`;
  }

  if (metricKey === "infra") {
    return `${district.동명}의 생활 점수는 가게 수와 청년 소비 흐름을 함께 본 값입니다. 편의시설이 많고 실제 이용 흐름이 보일수록 점수가 높아집니다.`;
  }

  return `${district.동명}의 종합 점수는 통근, 월세, 생활 편의, 청년 머무름, 동의 특징을 더한 값입니다. 한 가지가 높아도 다른 조건이 약하면 최종 점수는 함께 낮아질 수 있습니다.`;
}

function hasFinalConsonant(value: string) {
  const lastChar = value.trim().charCodeAt(value.trim().length - 1);

  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    return false;
  }

  return (lastChar - 0xac00) % 28 !== 0;
}
