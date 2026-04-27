import Link from "next/link";
import type { Insight } from "@/lib/data";

type HomeFindingsProps = {
  items: Insight[];
};

export function HomeFindings({ items }: HomeFindingsProps) {
  return (
    <section className="section-dark">
      <div className="page-shell section-pad">
        <div className="findings-layout">
          <div>
            <p className="eyebrow eyebrow-dark mb-5">Findings</p>
            <h2 className="type-section text-white">
              발견은 정책으로 이어집니다.
            </h2>
            <Link
              href="/insights"
              className="mt-8 inline-flex text-base font-semibold text-bright-link transition-opacity hover:opacity-70"
            >
              전체 인사이트 보기 <span aria-hidden>›</span>
            </Link>
          </div>

          <ol className="divide-y divide-white/16 border-y border-white/16">
            {items.map((item) => (
              <li
                key={item.id}
                className="finding-row"
              >
                <span className="type-micro font-semibold text-white/45">
                  {String(item.id).padStart(2, "0")}
                </span>
                <p className="type-body leading-normal text-panel">
                  {item.title}
                </p>
                <span className="text-left type-card font-semibold tabular-nums text-white md:text-right">
                  {item.value}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
