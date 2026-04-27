import { HomeFindings } from "@/components/home/HomeFindings";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeIndexDesign } from "@/components/home/HomeIndexDesign";
import { HomeNextSteps } from "@/components/home/HomeNextSteps";
import { HomePressure } from "@/components/home/HomePressure";
import { HomeRanking } from "@/components/home/HomeRanking";
import { getInsights, getSyliScores } from "@/lib/data";

const highlightInsightIds = [2, 8, 11, 12, 18, 20];

export default async function Home() {
  const [scores, insightsData] = await Promise.all([
    getSyliScores(),
    getInsights(),
  ]);

  const ranked = [...scores].sort((a, b) => b.SYLI_v02 - a.SYLI_v02);
  const top5 = ranked.slice(0, 5);
  const focusFindings = insightsData.insights.filter((item) =>
    highlightInsightIds.includes(item.id)
  );
  const rentGap =
    insightsData.summary.rent_max.월세 / insightsData.summary.rent_min.월세;
  const guAverage = Object.entries(insightsData.summary.gu_avg_syli).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <>
      <HomeHero
        dongCount={scores.length}
        rentGap={rentGap}
        topDistrict={ranked[0].동명}
      />
      <HomeRanking districts={top5} />
      <HomePressure />
      <HomeIndexDesign guAverage={guAverage} />
      <HomeFindings items={focusFindings} />
      <HomeNextSteps />
    </>
  );
}
