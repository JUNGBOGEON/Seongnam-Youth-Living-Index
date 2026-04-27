import Image from "next/image";
import Link from "next/link";
import { getInsights, getSyliScores, type DongScore } from "@/lib/data";

const findingIds = [2, 8, 11, 12, 18, 20];

export default async function Home() {
  const [scores, insightsData] = await Promise.all([
    getSyliScores(),
    getInsights(),
  ]);

  const ranked = [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02);
  const top5 = ranked.slice(0, 5);
  const focusFindings = insightsData.insights.filter((item) =>
    findingIds.includes(item.id)
  );
  const rentGap =
    insightsData.summary.rent_max.월세 / insightsData.summary.rent_min.월세;
  const guAverage = Object.entries(insightsData.summary.gu_avg_syli).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <>
      <section className="relative min-h-[88svh] overflow-hidden bg-black text-white">
        <Image
          src="/images/seongnam-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ filter: "brightness(0.52) saturate(0.9)" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.54)_43%,rgba(0,0,0,0.16)_100%)]"
        />

        <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-[1180px] flex-col px-6">
          <div className="grid flex-1 items-end gap-10 pb-12 pt-24 lg:grid-cols-[1fr_360px] lg:pb-16">
            <div className="max-w-[760px]">
              <p className="mb-5 text-[14px] font-medium text-white/72">
                Seongnam Youth Living Index
              </p>
              <h1 className="text-[40px] font-semibold leading-[1.08] text-white sm:text-[52px] md:text-[76px]">
                성남 청년
                <br />
                1인가구 주거 적합도.
              </h1>
              <p className="mt-7 max-w-[650px] text-[19px] leading-[1.55] text-[#e5e5ea] md:text-[21px]">
                민간데이터와 공공데이터를 성남시 50개 행정동 단위로 연결해
                통근, 월세, 생활 인프라, 청년 체류를 하나의 지표로 읽습니다.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/map"
                  className="rounded-[8px] bg-white px-5 py-3 text-[15px] font-semibold text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
                >
                  지도에서 보기
                </Link>
                <Link
                  href="/methodology"
                  className="rounded-[8px] border border-white/40 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:border-white"
                >
                  산식 확인
                </Link>
              </div>
            </div>

            <aside className="border-y border-white/24 py-5 lg:border-y-0 lg:border-l lg:pl-8">
              <p className="mb-5 text-[13px] text-white/62">Current index</p>
              <dl className="grid grid-cols-3 gap-5 lg:grid-cols-1">
                <HeroMetric label="행정동" value={scores.length.toString()} />
                <HeroMetric label="1위" value={ranked[0].동명} />
                <HeroMetric
                  label="월세 격차"
                  value={`${rentGap.toFixed(1)}배`}
                />
              </dl>
            </aside>
          </div>
        </div>

        <p className="absolute bottom-3 right-4 z-10 text-[10px] text-white/48">
          Image: Hikaru arai · Wikimedia Commons · CC BY-SA 4.0
        </p>
      </section>

      <section className="section-white border-b border-[#d2d2d7]">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-24 lg:grid-cols-[360px_1fr]">
          <div>
            <p className="eyebrow mb-5">Ranking</p>
            <h2 className="type-section mb-6">
              상위권의 이유는 서로 다릅니다.
            </h2>
            <p className="type-body text-[#424245]">
              단순히 판교와 가까운 곳이 아니라 통근, 월세, 인프라, 체류 패턴이
              함께 버티는 동이 상위권에 남습니다.
            </p>
            <Link
              href="/map"
              className="mt-8 inline-flex text-[16px] font-semibold text-[#0066cc] transition-opacity hover:opacity-70"
            >
              전체 50개 동 보기 <span aria-hidden>›</span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-[#d2d2d7]">
            <div className="grid grid-cols-[42px_minmax(0,1fr)_62px_64px] border-b border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-[12px] font-semibold text-[#6e6e73] sm:grid-cols-[64px_minmax(0,1fr)_92px_92px] sm:px-5">
              <span>순위</span>
              <span>행정동</span>
              <span className="text-right">SYLI</span>
              <span className="text-right">월세</span>
            </div>
            <ol>
              {top5.map((dong, index) => (
                <li
                  key={dong.dong_cd}
                  className="grid grid-cols-[42px_minmax(0,1fr)_62px_64px] items-center border-b border-[#d2d2d7] px-4 py-5 last:border-b-0 sm:grid-cols-[64px_minmax(0,1fr)_92px_92px] sm:px-5"
                >
                  <span className="text-[13px] font-semibold text-[#86868b]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[18px] font-semibold leading-[1.2] text-[#1d1d1f] sm:text-[22px]">
                      {dong.동명}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#6e6e73]">
                      {dong.구} · {dong.lifestyle}
                    </p>
                  </div>
                  <span className="text-right text-[18px] font-semibold tabular-nums text-[#1d1d1f] sm:text-[24px]">
                    {dong.SYLI_v02.toFixed(1)}
                  </span>
                  <span className="text-right text-[13px] font-medium tabular-nums text-[#424245] sm:text-[15px]">
                    {formatRent(dong)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section-gray">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <div className="mb-14 max-w-[760px]">
            <p className="eyebrow mb-5">Pressure Points</p>
            <h2 className="type-section">
              가격만으로는 설명되지 않습니다.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[8px] bg-[#d2d2d7] md:grid-cols-3">
            <PressurePanel
              label="통근"
              value="36%"
              title="판교 체류자 중 실제 직장인"
              body="판교는 일자리의 중심이지만, 매일 오래 머무는 사람보다 지나가는 방문자가 더 많습니다."
            />
            <PressurePanel
              label="월세"
              value="5배"
              title="판교동과 하대원동의 격차"
              body="가까운 동이 곧 접근 가능한 동은 아닙니다. 가격은 통근 이점을 순식간에 지웁니다."
            />
            <PressurePanel
              label="금융"
              value="6배"
              title="30대 진입 시 부채 증가"
              body="청년 주거 정책은 첫 취업 이후의 소득만이 아니라 다음 생애 단계의 부채까지 봐야 합니다."
            />
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="mx-auto grid max-w-[1180px] gap-14 px-6 py-24 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="eyebrow mb-5">Index Design</p>
            <h2 className="type-section mb-8">
              다섯 개 축으로 계산합니다.
            </h2>
            <div className="h-4 overflow-hidden rounded-[4px] bg-[#f5f5f7]">
              <Segment width="25%" color="#1d1d1f" />
              <Segment width="18.75%" color="#535356" />
              <Segment width="18.75%" color="#86868b" />
              <Segment width="18.75%" color="#b9b9bf" />
              <Segment width="18.75%" color="#d2d2d7" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <WeightRow label="판교 통근" value="25.0%" />
              <WeightRow label="생활 인프라" value="18.75%" />
              <WeightRow label="청년 체류" value="18.75%" />
              <WeightRow label="동 유형" value="18.75%" />
              <WeightRow label="월세 접근성" value="18.75%" />
            </div>
          </div>

          <aside className="rounded-[8px] border border-[#d2d2d7] p-7">
            <p className="eyebrow mb-6">District Average</p>
            <dl className="space-y-5">
              {guAverage.map(([gu, value]) => (
                <div key={gu}>
                  <div className="mb-2 flex items-center justify-between">
                    <dt className="text-[15px] font-semibold text-[#1d1d1f]">
                      {gu}
                    </dt>
                    <dd className="text-[15px] font-semibold tabular-nums text-[#424245]">
                      {value.toFixed(1)}
                    </dd>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#f5f5f7]">
                    <div
                      className="h-full rounded-full bg-[#1d1d1f]"
                      style={{ width: `${Math.min(100, value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="section-dark">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="eyebrow eyebrow-dark mb-5">Findings</p>
              <h2 className="type-section text-white">
                발견은 정책으로 이어집니다.
              </h2>
              <Link
                href="/insights"
                className="mt-8 inline-flex text-[16px] font-semibold text-[#2997ff] transition-opacity hover:opacity-70"
              >
                전체 인사이트 보기 <span aria-hidden>›</span>
              </Link>
            </div>

            <ol className="divide-y divide-white/16 border-y border-white/16">
              {focusFindings.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-5 py-5 md:grid-cols-[60px_1fr_120px] md:items-center"
                >
                  <span className="text-[12px] font-semibold text-white/45">
                    {String(item.id).padStart(2, "0")}
                  </span>
                  <p className="text-[17px] leading-[1.45] text-[#f5f5f7]">
                    {item.title}
                  </p>
                  <span className="text-left text-[28px] font-semibold tabular-nums text-white md:text-right">
                    {item.value}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="mx-auto max-w-[1180px] px-6 py-24">
          <div className="grid gap-px overflow-hidden rounded-[8px] bg-[#d2d2d7] md:grid-cols-3">
            <NextStep
              href="/map"
              label="지도"
              title="색으로 먼저 보고, 동을 눌러 확인합니다."
            />
            <NextStep
              href="/insights"
              label="인사이트"
              title="20개 발견을 정책 압력별로 다시 읽습니다."
            />
            <NextStep
              href="/methodology"
              label="방법론"
              title="공식, 데이터 출처, 한계를 공개합니다."
            />
          </div>
        </div>
      </section>
    </>
  );
}

function formatRent(dong: DongScore) {
  return dong.median_rent ? `${dong.median_rent.toFixed(0)}만` : "데이터 없음";
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-white/52">{label}</dt>
      <dd className="mt-2 text-[24px] font-semibold leading-[1.1] text-white">
        {value}
      </dd>
    </div>
  );
}

function PressurePanel({
  label,
  value,
  title,
  body,
}: {
  label: string;
  value: string;
  title: string;
  body: string;
}) {
  return (
    <article className="bg-white p-7 md:min-h-[300px]">
      <p className="text-[13px] font-semibold text-[#6e6e73]">{label}</p>
      <div className="mt-8 text-[56px] font-semibold leading-none text-[#1d1d1f]">
        {value}
      </div>
      <h3 className="mt-8 text-[22px] font-semibold leading-[1.25] text-[#1d1d1f]">
        {title}
      </h3>
      <p className="mt-4 text-[15px] leading-[1.6] text-[#424245]">{body}</p>
    </article>
  );
}

function Segment({ width, color }: { width: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-full"
      style={{ width, background: color }}
    />
  );
}

function WeightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[#d2d2d7] pt-4">
      <span className="text-[15px] text-[#424245]">{label}</span>
      <span className="text-[15px] font-semibold tabular-nums text-[#1d1d1f]">
        {value}
      </span>
    </div>
  );
}

function NextStep({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-7 transition-colors hover:bg-[#fafafc]"
    >
      <p className="text-[13px] font-semibold text-[#6e6e73]">{label}</p>
      <h2 className="mt-8 text-[24px] font-semibold leading-[1.25] text-[#1d1d1f]">
        {title}
      </h2>
      <span className="mt-8 inline-flex text-[15px] font-semibold text-[#0066cc]">
        열기 <span aria-hidden>›</span>
      </span>
    </Link>
  );
}
