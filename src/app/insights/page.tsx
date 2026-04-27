import type { Metadata } from "next";
import { getInsights, getSyliScores, type Insight } from "@/lib/data";

export const metadata: Metadata = {
  title: "인사이트 — SYLI",
  description:
    "성남 청년 1인가구 주거 정책을 위한 통근, 월세, 생활 인프라, 금융·이주 인사이트.",
};

const supplementalInsights: Insight[] = [
  {
    id: 14,
    title: "동별 라이프스타일은 직장형 43, 거주형 5, 소비여가형 1, 학생형 1",
    value: "4유형",
  },
  {
    id: 15,
    title: "청년 체류 피크는 삼평 12시, 서현1동 19시, 백현동 18시",
    value: "3패턴",
  },
  {
    id: 16,
    title: "대중교통 의존도는 하대원동 31.4%, 상대원2동 29.1%",
    value: "31.4%",
  },
  {
    id: 17,
    title: "베드타운 지수는 야탑1동 58.3%, 삼평동 57.2%",
    value: "58.3%",
  },
];

const groups = [
  {
    label: "Commute",
    title: "통근은 판교 하나로 설명되지 않습니다.",
    ids: [1, 2, 3, 4, 5, 11],
  },
  {
    label: "Living Cost",
    title: "가격은 순위를 다시 씁니다.",
    ids: [18, 19, 20],
  },
  {
    label: "Urban Fabric",
    title: "살기 좋은 동과 일하기 좋은 동은 다릅니다.",
    ids: [6, 7, 14, 15, 16, 17],
  },
  {
    label: "Policy Pressure",
    title: "유입, 부채, 공급 압력이 같은 방향을 가리킵니다.",
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
          <p className="eyebrow mb-6">Insights</p>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <h1 className="type-hero-xl">
                숫자는 작게,
                <br />
                판단은 선명하게.
              </h1>
              <p className="mt-7 copy-narrow text-xl leading-normal text-utility">
                성남의 청년 주거 문제는 한 줄의 순위가 아니라 통근, 월세,
                생활 인프라, 금융 부담이 겹치는 구조입니다. 아래 20개 발견은
                정책 시뮬레이터가 다뤄야 할 압력 지점을 정리한 것입니다.
              </p>
            </div>

            <div className="rounded-module border border-line bg-panel p-8">
              <p className="eyebrow mb-7">SYLI Spread</p>
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
              label="Finding 02"
              value="36%"
              body="판교 체류자 중 4시간 이상 머무는 직장인 비중입니다."
            />
            <Statement
              label="Finding 18"
              value="5x"
              body="판교동과 하대원동의 월세 중위값 격차입니다."
            />
            <Statement
              label="Finding 12"
              value="6x"
              body="20대 후반에서 30대로 넘어갈 때 관측되는 부채 증가폭입니다."
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
              <p className="eyebrow mb-5">Policy Read</p>
              <h2 className="type-section">
                그래서 어디에 개입해야 하나.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-card bg-line md:grid-cols-3">
              <PolicyCard
                title="저가 저장소 보존"
                body="하대원, 은행, 복정 일대는 점수는 낮아도 월세 접근성이 높다. 정비와 공급 정책에서 밀려나면 대체지가 사라진다."
              />
              <PolicyCard
                title="판교 주변 고가화 완충"
                body="시흥동과 판교동은 통근 이점이 크지만 월세가 빠르게 장벽이 된다. 공급 시나리오는 이 축을 먼저 검토해야 한다."
              />
              <PolicyCard
                title="강남권 통근 포함"
                body="성남 청년의 직장은 판교에만 있지 않다. 강남권 통근을 제외하면 실제 청년 수요의 일부가 정책 밖으로 빠진다."
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
