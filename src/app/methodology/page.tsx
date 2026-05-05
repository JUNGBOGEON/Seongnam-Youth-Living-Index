import type { Metadata } from "next";
import { getSyliScores } from "@/lib/data";

export const metadata: Metadata = {
  title: "계산 방식 — SYLI",
  description:
    "SYLI 점수를 어떤 데이터로 어떻게 계산했는지 쉽게 설명합니다.",
};

const variables = [
  {
    key: "SCORE_COMMUTE_PANGYO",
    label: "판교 통근",
    weight: "25.0%",
    source: "통신 이동·머무름 데이터",
    method: "청년들이 판교 쪽으로 얼마나 오가고 머무는지 0-100점으로 바꿨습니다.",
  },
  {
    key: "SCORE_INFRA",
    label: "생활 편의",
    weight: "18.75%",
    source: "카드 가맹점·청년 소비 데이터",
    method: "가게가 얼마나 모여 있고 청년 소비가 얼마나 보이는지 함께 봤습니다.",
  },
  {
    key: "SCORE_YOUTH_STAY",
    label: "청년 머무름",
    weight: "18.75%",
    source: "통신 머무름·이동 목적 데이터",
    method: "20-34세 청년이 어느 동에 얼마나 머무는지 반영했습니다.",
  },
  {
    key: "SCORE_LIFESTYLE",
    label: "동의 특징",
    weight: "18.75%",
    source: "이동 목적 데이터",
    method: "각 동이 거주, 소비·여가, 학생, 직장 중 어디에 가까운지 나눠 점수에 넣었습니다.",
  },
  {
    key: "SCORE_RENT",
    label: "월세 부담",
    weight: "18.75%",
    source: "국토교통부 전월세 실거래가",
    method: "월세 중간값이 낮을수록 높은 점수를 주었습니다.",
  },
];

const dataSources = [
  ["민간 통신", "이동, 머문 시간, 이동 목적", "출퇴근과 청년 머무름"],
  ["민간 카드", "가게 수, 청년 소비, 업종별 매출", "생활 편의와 여가"],
  ["민간 기업", "회사 위치, 새 회사, 이전 흐름", "일자리와 개발 흐름"],
  ["민간 신용", "청년 빚, 신용 부담, 직장과 집의 거리", "빚 부담과 통근"],
  ["전월세 실거래", "오피스텔, 연립다세대 전월세", "월세 부담"],
  ["지도 경계", "행정동 경계와 지도 데이터", "50개 동 지도 표시"],
];

const caveats = [
  "동 단위로 계산했기 때문에 같은 동 안의 역세권, 골목, 건물 상태 차이는 담지 못했습니다.",
  "월세는 오피스텔과 연립다세대 중심입니다. 아파트와 고시원은 별도 데이터가 더 필요합니다.",
  "통신 데이터는 사람이 머무는 흐름을 본 값입니다. 주민등록 인구나 개인 이동 기록이 아닙니다.",
  "일부 거래는 행정동에 바로 연결하기 어려워 구 단위 중간값으로 보정했습니다.",
  "현재 화면은 SYLI v0.2입니다. 집 공급, 안전, 강남 출퇴근은 다음 버전에서 더 자세히 나눌 예정입니다.",
];

export default async function MethodologyPage() {
  const scores = await getSyliScores();
  const top = [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02)[0];
  const rentValues = scores
    .map((d) => d.median_rent)
    .filter((v): v is number => typeof v === "number");
  const minRent = Math.min(...rentValues);
  const maxRent = Math.max(...rentValues);
  const contracts = scores.reduce((sum, d) => sum + (d.n_contracts ?? 0), 0);

  return (
    <div>
      <section className="section-dark">
        <div className="page-shell-narrow page-intro pb-24">
          <p className="eyebrow eyebrow-dark mb-6">계산 방식</p>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <h1 className="type-hero-xl text-white">
                점수는 쉽게
                <br />
                설명되어야 합니다.
              </h1>
              <p className="mt-7 copy-medium text-xl leading-normal text-line">
                SYLI는 성남 50개 동을 비교하기 위한 점수입니다.
                어떤 데이터를 썼고, 어떤 기준으로 계산했는지 함께 공개합니다.
                지도 색은 정답이 아니라 먼저 살펴볼 곳을 알려주는 표시입니다.
              </p>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-card border border-white/15">
              <HeroMetric label="동 수" value={scores.length.toString()} />
              <HeroMetric label="계약" value={contracts.toLocaleString()} />
              <HeroMetric label="최고점" value={top.SYLI_v02.toFixed(1)} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-gray">
        <div className="page-shell-narrow section-pad">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-5">점수 계산</p>
              <h2 className="type-section mb-6">
                다섯 가지 기준을 100점 만점으로 바꿔 더했습니다.
              </h2>
              <p className="type-body text-utility">
                기준마다 단위가 다르기 때문에 모두 0-100점으로 바꿨습니다.
                점수가 높을수록 청년 1인가구에게 유리하다는 뜻입니다.
                월세처럼 낮을수록 좋은 값은 반대로 계산했습니다.
              </p>
            </div>

            <div className="rounded-module border border-line bg-white p-8 md:p-10">
              <div className="mb-8 copy-small leading-loose text-utility">
                <span className="font-semibold text-ink">최종 점수</span>{" "}
                = 기준별 점수에 비중을 곱해 더한 값
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-panel">
                {variables.map((v) => (
                  <span
                    key={v.key}
                    className="inline-block h-full"
                    style={{
                      width: v.weight,
                      background:
                        v.key === "SCORE_COMMUTE_PANGYO"
                          ? "#1d1d1f"
                          : v.key === "SCORE_RENT"
                            ? "#86868b"
                            : "#d2d2d7",
                    }}
                  />
                ))}
              </div>
              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                <Meta label="표시 버전" value="SYLI v0.2" />
                <Meta label="점수 범위" value="0-100" />
                <Meta label="월세 범위" value={`${minRent}-${maxRent}만원`} />
                <Meta label="정렬 기준" value="높을수록 좋음" />
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="page-shell-narrow section-pad">
          <div className="mb-12 max-w-3xl">
            <p className="eyebrow mb-5">기준</p>
            <h2 className="type-section">점수에 들어간 기준.</h2>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {variables.map((v, index) => (
              <article
                key={v.key}
                className="variable-row py-8"
              >
                <div className="copy-tiny font-semibold text-subtle">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="type-util font-semibold leading-tight text-ink">
                    {v.label}
                  </h3>
                  <p className="mt-3 type-body text-utility">{v.method}</p>
                  <p className="mt-4 copy-label text-muted">
                    출처 · {v.source}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="panel-title font-semibold leading-none text-ink tabular-nums">
                    {v.weight}
                  </div>
                  <div className="mt-1 type-micro text-muted">비중</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-gray">
        <div className="page-shell-narrow section-pad">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-5">데이터 출처</p>
              <h2 className="type-section mb-6">
                데이터마다 맡은 역할이 있습니다.
              </h2>
              <p className="type-body text-utility">
                데이터가 많다고 좋은 분석은 아닙니다. 어떤 질문에 쓰였는지가
                더 중요합니다. 그래서 각 데이터는 출퇴근, 생활, 월세, 일자리
                흐름 중 하나의 역할로 나눠 사용했습니다.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2">
              {dataSources.map(([kind, scope, use]) => (
                <div key={kind} className="bg-white p-6">
                  <p className="copy-label font-semibold text-ink">
                    {kind}
                  </p>
                  <p className="mt-3 copy-note leading-normal text-utility">
                    {scope}
                  </p>
                  <p className="mt-5 type-micro leading-snug text-muted">
                    {use}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="page-shell-narrow section-pad">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-5">한계</p>
              <h2 className="type-section mb-6">이 점수로 알 수 없는 것도 있습니다.</h2>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {caveats.map((item, index) => (
                <li key={item} className="flex gap-6 py-5">
                  <span className="w-8 shrink-0 copy-tiny font-semibold text-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="type-body text-utility">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/15 bg-white/5 p-5 last:border-r-0">
      <dt className="copy-tiny uppercase text-subtle">
        {label}
      </dt>
      <dd className="mt-3 text-3xl font-semibold leading-none text-white tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="copy-tiny uppercase text-subtle">
        {label}
      </dt>
      <dd className="mt-2 type-body font-semibold text-ink">{value}</dd>
    </div>
  );
}
