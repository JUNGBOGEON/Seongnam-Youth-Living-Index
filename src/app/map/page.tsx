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
      <section className="border-b border-[#d2d2d7] bg-[#fbfbfd]">
        <div className="mx-auto max-w-[1440px] px-4 pb-5 pt-[150px] sm:px-6 sm:pt-[118px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow mb-3">Interactive Map</p>
              <h1 className="text-[34px] font-semibold leading-[1.1] text-[#1d1d1f] sm:text-[42px]">
                성남 50개 행정동을 지표별로 비교합니다.
              </h1>
            </div>

            <dl className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#d2d2d7] bg-white lg:min-w-[420px]">
              <SummaryCell label="동 수" value={scores.length.toString()} />
              <SummaryCell label="최고점" value={top.SYLI_v02.toFixed(1)} />
              <SummaryCell label="최저점" value={bottom.SYLI_v02.toFixed(1)} />
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6">
        <MapView scores={scores} />
      </section>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-[#d2d2d7] p-4 last:border-r-0">
      <dt className="text-[12px] font-semibold text-[#86868b]">{label}</dt>
      <dd className="mt-1 text-[22px] font-semibold tabular-nums text-[#1d1d1f]">
        {value}
      </dd>
    </div>
  );
}
