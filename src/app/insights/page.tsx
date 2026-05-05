import type { Metadata } from "next";
import { getInsights, getSyliScores, type Insight } from "@/lib/data";

export const metadata: Metadata = {
  title: "주요 내용 — SYLI",
  description:
    "성남 청년 1인가구가 집을 고를 때 봐야 할 통근, 월세, 생활 편의 숫자.",
};

const supplementalInsights: Insight[] = [
  {
    id: 14,
    title: "성남 50개 동은 직장형이 가장 많습니다.",
    value: "4가지",
  },
  {
    id: 15,
    title: "청년이 많이 머무는 시간은 동마다 다릅니다.",
    value: "3가지",
  },
  {
    id: 16,
    title: "하대원동은 대중교통 이용 비중이 높습니다.",
    value: "31.4%",
  },
  {
    id: 17,
    title: "야탑1동은 잠만 자는 동에 가까운 흐름이 보입니다.",
    value: "58.3%",
  },
];

const groups = [
  {
    label: "출퇴근",
    title: "출퇴근은 판교만 보면 부족합니다.",
    ids: [1, 2, 3, 4, 5, 11],
  },
  {
    label: "월세",
    title: "월세를 넣으면 순위가 달라집니다.",
    ids: [18, 19, 20],
  },
  {
    label: "생활 환경",
    title: "일하기 좋은 동과 살기 좋은 동은 다릅니다.",
    ids: [6, 7, 14, 15, 16, 17],
  },
  {
    label: "주의할 점",
    title: "이사, 빚, 공급 문제를 함께 봐야 합니다.",
    ids: [8, 9, 10, 12, 13],
  },
];

export default async function InsightsPage() {
  const [insightsData, scores] = await Promise.all([
    getInsights(),
    getSyliScores(),
  ]);

  const insights = [...insightsData.insights, ...supplementalInsights].sort(
    (a, b) => a.id - b.id
  );
  const byId = new Map(insights.map((item) => [item.id, item]));
  const top3 = [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02).slice(0, 3);
  const bottom3 = [...scores].sort((a, b) => a.SYLI_v02 - b.SYLI_v02).slice(0, 3);

  return (
    <div>
      <section className="section-white">
        <div className="page-shell page-intro-roomy">
          <p className="eyebrow mb-6">주요 내용</p>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <h1 className="type-hero-xl">
                숫자는 쉽게,
                <br />
                이유는 분명하게.
              </h1>
              <p className="mt-7 copy-narrow text-xl leading-normal text-utility">
                성남에서 청년이 집을 고를 때는 출퇴근, 월세, 생활 편의,
                빚 부담을 함께 봐야 합니다. 아래 숫자는 그중 꼭 봐야 할
                내용을 골라 정리한 것입니다.
              </p>
            </div>

            <div className="rounded-module border border-line bg-panel p-8">
              <p className="eyebrow mb-7">점수 차이</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <RankingBlock title="상위 동" items={top3} mode="top" />
                <RankingBlock title="하위 동" items={bottom3} mode="bottom" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-dark">
        <div className="page-shell section-pad">
          <div className="grid gap-8 md:grid-cols-3">
            <Statement
              label="핵심 02"
              value="36%"
              body="판교에 4시간 이상 머무는 직장인 비중입니다."
            />
            <Statement
              label="핵심 18"
              value="5x"
              body="판교동과 하대원동의 월세 중간값 차이입니다."
            />
            <Statement
              label="핵심 12"
              value="6x"
              body="20대 후반에서 30대로 넘어갈 때 늘어나는 빚의 차이입니다."
            />
          </div>
        </div>
      </section>

      <section className="section-gray">
        <div className="page-shell section-pad">
          <div className="space-y-16">
            {groups.map((group) => (
              <section key={group.label}>
                <div className="mb-8 insight-group-heading">
                  <p className="eyebrow">{group.label}</p>
                  <h2 className="type-section">{group.title}</h2>
                </div>

                <ol className="overflow-hidden rounded-card border border-line bg-white">
                  {group.ids.map((id) => {
                    const insight = byId.get(id);
                    if (!insight) return null;

                    return (
                      <li
                        key={insight.id}
                        className="insight-row border-b border-line p-6 last:border-b-0"
                      >
                        <span className="copy-tiny font-semibold text-subtle">
                          {String(insight.id).padStart(2, "0")}
                        </span>
                        <p className="text-lg font-medium leading-snug text-ink">
                          {insight.title}
                        </p>
                        <span className="text-left text-3xl font-semibold leading-none text-ink tabular-nums md:text-right">
                          {insight.value}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="page-shell section-pad">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-5">다음에 볼 점</p>
              <h2 className="type-section">
                그래서 무엇을 먼저 봐야 할까.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-card bg-line md:grid-cols-3">
              <PolicyCard
                title="월세가 낮은 동 지키기"
                body="하대원, 은행, 복정 일대는 전체 점수는 낮아도 월세 부담이 작습니다. 이런 동이 사라지면 선택지가 줄어듭니다."
              />
              <PolicyCard
                title="판교 주변 월세 부담 줄이기"
                body="시흥동과 판교동은 출퇴근은 좋지만 월세가 부담입니다. 공급이나 지원을 먼저 살펴볼 필요가 있습니다."
              />
              <PolicyCard
                title="강남 출퇴근도 함께 보기"
                body="성남 청년의 직장은 판교에만 있지 않습니다. 강남으로 오가는 사람도 함께 봐야 실제 수요를 놓치지 않습니다."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RankingBlock({
  title,
  items,
  mode,
}: {
  title: string;
  items: { 동명: string; 구: string; SYLI_v02: number }[];
  mode: "top" | "bottom";
}) {
  return (
    <div>
      <h2 className="mb-5 copy-label font-semibold text-ink">
        {title}
      </h2>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={`${mode}-${item.동명}`} className="flex items-baseline gap-3">
            <span className="w-5 copy-tiny font-semibold text-subtle">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 copy-small font-medium text-ink">
              {item.동명}
              <span className="ml-2 font-normal text-muted">{item.구}</span>
            </span>
            <span className="copy-small font-semibold tabular-nums text-ink">
              {item.SYLI_v02.toFixed(1)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Statement({
  label,
  value,
  body,
}: {
  label: string;
  value: string;
  body: string;
}) {
  return (
    <article className="border-t border-white/18 pt-6">
      <p className="eyebrow eyebrow-dark mb-7">{label}</p>
      <div className="numeric-xl text-white">{value}</div>
      <p className="mt-5 max-w-xs copy-small leading-normal text-dim-copy">
        {body}
      </p>
    </article>
  );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="bg-white p-7">
      <h3 className="text-2xl font-semibold leading-tight text-ink">
        {title}
      </h3>
      <p className="mt-5 copy-small leading-relaxed text-utility">{body}</p>
    </article>
  );
}
