import type { Metadata } from "next";
import { getSyliScores } from "@/lib/data";
import { MapView } from "@/components/MapView";

export const metadata: Metadata = {
  title: "지도 — SYLI",
  description:
    "성남시 50개 행정동의 청년 1인가구 주거 적합도를 입체 데이터 지형도로 탐색합니다.",
};

export default async function MapPage() {
  const scores = await getSyliScores();
  const ranked = [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  return (
    <div className="section-white">
      <section className="border-b border-line bg-surface">
        <div className="page-shell-wide page-intro-tight">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow mb-3">Interactive Map</p>
              <h1 className="panel-title font-semibold leading-tight text-ink sm:text-4xl">
                성남 50개 행정동을 지표별로 비교합니다.
              </h1>
            </div>

            <dl className="grid grid-cols-3 overflow-hidden rounded-field border border-line bg-white lg:min-w-96">
              <SummaryCell label="동 수" value={scores.length.toString()} />
              <SummaryCell label="최고점" value={top.SYLI_v02.toFixed(1)} />
              <SummaryCell label="최저점" value={bottom.SYLI_v02.toFixed(1)} />
            </dl>
          </div>
        </div>
      </section>

      <section className="page-shell-wide py-4 sm:py-6">
        <MapView scores={scores} />
      </section>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-line p-4 last:border-r-0">
      <dt className="type-micro font-semibold text-subtle">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </dd>
    </div>
  );
}
