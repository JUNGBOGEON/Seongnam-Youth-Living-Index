import type { DongScore } from "@/lib/data";

export function getPolicyRead(district: DongScore) {
  if (district.SCORE_COMMUTE_PANGYO >= 80 && district.SCORE_RENT < 50) {
    return "판교 접근성은 좋지만 월세 장벽이 큽니다. 고가화 완충이나 주변 대체지를 함께 검토해야 합니다.";
  }

  if (district.SCORE_COMMUTE_PANGYO >= 75 && district.SCORE_RENT >= 65) {
    return "통근과 비용의 균형이 좋아 청년 실거주 후보지로 우선 검토할 만합니다.";
  }

  if (district.SCORE_RENT >= 85 && district.SCORE_COMMUTE_PANGYO < 35) {
    return "월세 접근성은 좋지만 판교 통근 보완 없이는 주거 선택지로 확장되기 어렵습니다.";
  }

  if (district.SCORE_INFRA >= 70 && district.SCORE_YOUTH_STAY >= 55) {
    return "생활 기반과 청년 체류가 함께 관측되어, 방문 수요를 거주 수요로 연결하기 좋은 동입니다.";
  }

  if (district.SCORE_INFRA < 35) {
    return "생활 인프라가 약해 주거비만으로는 선택지를 만들기 어렵습니다.";
  }

  return "한 축의 점수보다 통근, 비용, 생활 조건의 균형을 함께 봐야 하는 동입니다.";
}

export function getPolicyVerdict(district: DongScore) {
  if (district.SCORE_COMMUTE_PANGYO >= 80 && district.SCORE_RENT < 50) {
    return {
      label: "통근 우수·가격 완충 필요",
      nextStep: "월세 완충",
    };
  }

  if (
    district.SCORE_COMMUTE_PANGYO >= 75 &&
    district.SCORE_RENT >= 65 &&
    district.SCORE_INFRA >= 60
  ) {
    return {
      label: "우선 검토 후보",
      nextStep: "실거주 검토",
    };
  }

  if (district.SCORE_RENT >= 85 && district.SCORE_COMMUTE_PANGYO < 35) {
    return {
      label: "저비용·통근 보완형",
      nextStep: "교통 연결",
    };
  }

  if (district.SCORE_INFRA >= 70 && district.SCORE_YOUTH_STAY >= 55) {
    return {
      label: "생활 중심 강화형",
      nextStep: "거주 전환",
    };
  }

  if (district.SCORE_INFRA < 35) {
    return {
      label: "생활 인프라 보강형",
      nextStep: "생활권 보강",
    };
  }

  return {
    label: "균형 검토형",
    nextStep: "복합 검토",
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

function hasFinalConsonant(value: string) {
  const lastChar = value.trim().charCodeAt(value.trim().length - 1);

  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    return false;
  }

  return (lastChar - 0xac00) % 28 !== 0;
}
