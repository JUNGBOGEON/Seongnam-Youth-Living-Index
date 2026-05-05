import Image from "next/image";
import Link from "next/link";

type HomeHeroProps = {
  dongCount: number;
  rentGap: number;
  topDistrict: string;
};

export function HomeHero({ dongCount, rentGap, topDistrict }: HomeHeroProps) {
  return (
    <section className="home-hero">
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
        className="home-hero-shade"
      />

      <div className="home-hero-frame page-shell">
        <div className="home-hero-layout">
          <div className="copy-wide">
            <p className="mb-5 copy-note font-medium text-white/72">
              성남 청년 주거 지도
            </p>
            <h1 className="home-hero-title">
              성남 청년
              <br />
              혼자 살기 좋은 동 찾기.
            </h1>
            <p className="home-hero-copy">
              성남 50개 동을 통근, 월세, 생활 편의, 청년들이 머무는 정도로
              비교했습니다. 청년 1인가구가 어디를 먼저 살펴보면 좋을지 보여줍니다.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="rounded-field bg-white px-5 py-3 copy-small font-semibold text-ink transition-colors hover:bg-panel"
              >
                지도에서 보기
              </Link>
              <Link
                href="/methodology"
                className="rounded-field border border-white/40 px-5 py-3 copy-small font-semibold text-white transition-colors hover:border-white"
              >
                계산 방식 보기
              </Link>
            </div>
          </div>

          <aside className="border-y border-white/24 py-5 lg:border-y-0 lg:border-l lg:pl-8">
            <p className="mb-5 copy-label text-white/62">한눈에 보기</p>
            <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-5">
              <HeroMetric label="행정동" value={dongCount.toString()} />
              <HeroMetric label="1위" value={topDistrict} />
              <HeroMetric label="월세 차이" value={`${rentGap.toFixed(1)}배`} />
            </dl>
          </aside>
        </div>
      </div>

      <p className="home-hero-credit">
        Image: Hikaru arai · Wikimedia Commons · CC BY-SA 4.0
      </p>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-micro text-white/52">{label}</dt>
      <dd className="mt-2 type-util text-white">
        {value}
      </dd>
    </div>
  );
}
