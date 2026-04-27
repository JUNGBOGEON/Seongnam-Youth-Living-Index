import type { Metadata } from "next";
import { getSyliScores } from "@/lib/data";

export const metadata: Metadata = {
  title: "방법론 — SYLI",
  description:
    "Seongnam Youth Living Index의 산식, 가중치, 정규화 방식, 결측 처리, 한계를 공개합니다.",
};

const variables = [
  {
    key: "SCORE_COMMUTE_PANGYO",
    label: "판교 통근",
    weight: "25.0%",
    source: "통신 T13 OD, T27 체류",
    method: "판교 4개 행정동으로 향하는 청년 이동과 체류 강도를 0-100으로 정규화",
  },
  {
    key: "SCORE_INFRA",
    label: "생활 인프라",
    weight: "18.75%",
    source: "카드3 가맹점, 카드10 청년소비",
    method: "동별 상업 밀도와 청년 소비 비중을 결합하고 이상치를 완화",
  },
  {
    key: "SCORE_YOUTH_STAY",
    label: "청년 체류",
    weight: "18.75%",
    source: "통신 T22, T24",
    method: "20-34세 체류 강도와 목적별 라이프스타일 패턴을 반영",
  },
  {
    key: "SCORE_LIFESTYLE",
    label: "동 유형",
    weight: "18.75%",
    source: "T24 목적 분류",
    method: "거주형 100, 소비여가형 85, 학생형 70, 직장형 40으로 변환",
  },
  {
    key: "SCORE_RENT",
    label: "월세 접근성",
    weight: "18.75%",
    source: "국토교통부 전월세 실거래가",
    method: "동별 중위 월세를 역방향 min-max로 변환. 낮을수록 높은 점수",
  },
];

const dataSources = [
  ["민간 통신", "생활이동, 체류시간, 목적, 이동수단", "판교 통근과 청년 체류"],
  ["민간 카드", "가맹점, 청년 소비, 업종별 매출", "생활 인프라와 여가 밀도"],
  ["민간 기업", "법인 분포, 신규 법인, 이전", "판교 확장축과 고용 압력"],
  ["민간 신용", "청년 부채, 저신용, 직주 흐름", "금융 취약성과 강남권 통근"],
  ["공공 실거래", "오피스텔, 연립다세대 전월세", "월세 접근성"],
  ["공간 경계", "행정동 폴리곤, 블록 매핑", "50개 동 지도 시각화"],
];

const caveats = [
  "행정동 단위 지표이므로 같은 동 안의 역세권, 골목, 건물 상태 차이는 반영하지 않는다.",
  "월세는 오피스텔·연립다세대 중심이며 아파트와 고시원 내부 품질은 별도 데이터가 필요하다.",
  "통신 데이터는 체류 인구 지수이므로 실제 주민등록 인구나 개인 이동 궤적이 아니다.",
  "일부 법정동 실거래는 행정동에 직접 매핑되지 않아 구별 중위값으로 보정했다.",
  "현재 웹앱 표시 기준은 SYLI v0.2이며, 공급·안전·강남 통근 축은 v1에서 분리 반영한다.",
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
        <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-[150px] sm:pt-[118px]">
          <p className="eyebrow eyebrow-dark mb-6">Methodology</p>
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1 className="type-hero-xl text-white">
                점수는 설명
                <br />
                가능해야 합니다.
              </h1>
              <p className="mt-7 max-w-[650px] text-[20px] leading-[1.45] text-[#d2d2d7]">
                SYLI는 50개 행정동을 하나의 순위로 압축하지만, 산식과
                가중치, 결측 처리, 한계를 함께 공개합니다. 지도 위의 색은
                결론이 아니라 검토 가능한 정책 가설입니다.
              </p>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-[18px] border border-white/15">
              <HeroMetric label="동 수" value={scores.length.toString()} />
              <HeroMetric label="계약" value={contracts.toLocaleString()} />
              <HeroMetric label="최고점" value={top.SYLI_v02.toFixed(1)} />
            </div>
          </div>
        </div>
      </section>

      <section className="section-gray">
        <div className="mx-auto max-w-[1120px] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="eyebrow mb-5">Formula</p>
              <h2 className="type-section mb-6">
                다섯 개 축을 같은 단위로 맞춘 뒤 가중평균합니다.
              </h2>
              <p className="type-body text-[#424245]">
                모든 입력 변수는 0-100점으로 변환합니다. 높을수록 청년
                1인가구에게 유리한 값이며, 월세처럼 낮을수록 좋은 변수는
                역방향으로 정규화합니다.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-8 md:p-10">
              <div className="mb-8 text-[15px] leading-[1.8] text-[#424245]">
                <span className="font-semibold text-[#1d1d1f]">SYLI(동)</span>{" "}
                = Σ wᵢ × normalized(variableᵢ, 동)
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#f5f5f7]">
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
                <Meta label="최종 정렬" value="높을수록 적합" />
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="mx-auto max-w-[1120px] px-6 py-24">
          <div className="mb-12 max-w-[720px]">
            <p className="eyebrow mb-5">Variables</p>
            <h2 className="type-section">활성 변수와 산출 방식.</h2>
          </div>

          <div className="divide-y divide-[#d2d2d7] border-y border-[#d2d2d7]">
            {variables.map((v, index) => (
              <article
                key={v.key}
                className="grid gap-6 py-8 md:grid-cols-[110px_1fr_120px] md:items-start"
              >
                <div className="text-[11px] font-semibold text-[#86868b]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-[24px] font-semibold leading-[1.15] text-[#1d1d1f]">
                    {v.label}
                  </h3>
                  <p className="mt-3 type-body text-[#424245]">{v.method}</p>
                  <p className="mt-4 text-[13px] text-[#6e6e73]">
                    Source · {v.source}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="numeric-l !text-[34px] text-[#1d1d1f]">
                    {v.weight}
                  </div>
                  <div className="mt-1 text-[12px] text-[#6e6e73]">weight</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-gray">
        <div className="mx-auto max-w-[1120px] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="eyebrow mb-5">Data Lineage</p>
              <h2 className="type-section mb-6">
                원천 데이터는 정책 질문별로만 사용합니다.
              </h2>
              <p className="type-body text-[#424245]">
                데이터가 많다는 사실보다 어떤 판단에 쓰였는지가 중요합니다.
                각 데이터는 통근, 생활, 가격, 공급 압력 중 하나의 역할로
                제한해 해석했습니다.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[18px] bg-[#d2d2d7] sm:grid-cols-2">
              {dataSources.map(([kind, scope, use]) => (
                <div key={kind} className="bg-white p-6">
                  <p className="text-[13px] font-semibold text-[#1d1d1f]">
                    {kind}
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.45] text-[#424245]">
                    {scope}
                  </p>
                  <p className="mt-5 text-[12px] leading-[1.35] text-[#6e6e73]">
                    {use}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="mx-auto max-w-[1120px] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow mb-5">Limits</p>
              <h2 className="type-section mb-6">좋은 지표는 모르는 것을 숨기지 않습니다.</h2>
            </div>
            <ol className="divide-y divide-[#d2d2d7] border-y border-[#d2d2d7]">
              {caveats.map((item, index) => (
                <li key={item} className="flex gap-6 py-5">
                  <span className="w-8 shrink-0 text-[11px] font-semibold text-[#86868b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="type-body text-[#424245]">{item}</p>
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
    <div className="border-r border-white/15 bg-white/[0.04] p-5 last:border-r-0">
      <dt className="text-[11px] uppercase text-[#86868b]">
        {label}
      </dt>
      <dd className="mt-3 text-[30px] font-semibold leading-none text-white tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase text-[#86868b]">
        {label}
      </dt>
      <dd className="mt-2 text-[17px] font-semibold text-[#1d1d1f]">{value}</dd>
    </div>
  );
}
