import Link from "next/link";
import type { DongScore } from "@/lib/data";

type HomeRankingProps = {
  districts: DongScore[];
};

export function HomeRanking({ districts }: HomeRankingProps) {
  return (
    <section className="section-white border-b border-line">
      <div className="page-shell section-pad ranking-layout">
        <div>
          <p className="eyebrow mb-5">Ranking</p>
          <h2 className="type-section mb-6">
            상위권의 이유는 서로 다릅니다.
          </h2>
          <p className="type-body text-utility">
            단순히 판교와 가까운 곳이 아니라 통근, 월세, 인프라, 체류 패턴이
            함께 버티는 동이 상위권에 남습니다.
          </p>
          <Link
            href="/map"
            className="mt-8 inline-flex text-base font-semibold text-link transition-opacity hover:opacity-70"
          >
            전체 50개 동 보기 <span aria-hidden>›</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-field border border-line">
          <div className="ranking-row border-b border-line bg-panel px-4 py-3 type-micro font-semibold text-muted sm:px-5">
            <span>순위</span>
            <span>행정동</span>
            <span className="text-right">SYLI</span>
            <span className="text-right">월세</span>
          </div>
          <ol>
            {districts.map((dong, index) => (
              <li
                key={dong.dong_cd}
                className="ranking-row items-center border-b border-line px-4 py-5 last:border-b-0 sm:px-5"
              >
                <span className="copy-label font-semibold text-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold leading-snug text-ink sm:text-2xl">
                    {dong.동명}
                  </h3>
                  <p className="mt-1 copy-label text-muted">
                    {dong.구} · {dong.lifestyle}
                  </p>
                </div>
                <span className="text-right text-lg font-semibold tabular-nums text-ink sm:type-util">
                  {dong.SYLI_v02.toFixed(1)}
                </span>
                <span className="text-right copy-label font-medium tabular-nums text-utility sm:text-base">
                  {formatRent(dong)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function formatRent(dong: DongScore) {
  return dong.median_rent ? `${dong.median_rent.toFixed(0)}만` : "데이터 없음";
}
