import type { DongScore } from "@/lib/data";

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

function hasFinalConsonant(value: string) {
  const lastChar = value.trim().charCodeAt(value.trim().length - 1);

  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    return false;
  }

  return (lastChar - 0xac00) % 28 !== 0;
}
