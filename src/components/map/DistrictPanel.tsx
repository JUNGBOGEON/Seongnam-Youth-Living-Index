import type { DongScore } from "@/lib/data";
import {
  formatRent,
  getPolicyRead,
  getPolicyVerdict,
  withSubjectParticle,
} from "@/components/map/copy";
import type { MetricDefinition } from "@/components/map/model";

type DistrictPanelProps = {
  activeMetric: MetricDefinition;
  district: DongScore;
};

export function DistrictPanel({
  activeMetric,
  district,
}: DistrictPanelProps) {
  const scoreRows = [
    { key: "syli", label: "종합", value: district.SYLI_v02 },
    { key: "commute", label: "판교 통근", value: district.SCORE_COMMUTE_PANGYO },
    { key: "rent", label: "월세 접근성", value: district.SCORE_RENT },
    { key: "infra", label: "생활 인프라", value: district.SCORE_INFRA },
    { key: "youth", label: "청년 체류", value: district.SCORE_YOUTH_STAY },
    { key: "lifestyle", label: "동 유형", value: district.SCORE_LIFESTYLE },
  ];
  const explanatoryRows = scoreRows.filter(
    (row) => row.key !== "syli" && row.key !== "lifestyle"
  );
  const strongest = [...explanatoryRows].sort((a, b) => b.value - a.value)[0];
  const weakest = [...explanatoryRows].sort((a, b) => a.value - b.value)[0];
  const policyRead = getPolicyRead(district);
  const verdict = getPolicyVerdict(district);

  return (
    <div>
      <div className="border-b border-line p-6">
        <p className="copy-label font-semibold text-subtle">
          {district.구} · {district.lifestyle}
        </p>
        <h2 className="mt-2 panel-title font-semibold leading-none text-ink">
          {district.동명}
        </h2>
        <div className="mt-7">
          <div className="numeric-xl font-semibold leading-none tabular-nums text-ink">
            {activeMetric.value(district).toFixed(1)}
          </div>
          <p className="mt-2 copy-label text-muted">
            {activeMetric.label} 기준
          </p>
        </div>
        <div className="mt-6 grid gap-2">
          <div className="rounded-field border border-line bg-surface p-4">
            <p className="copy-tiny font-semibold uppercase text-subtle">
              정책 판정
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug text-ink">
              {verdict.label}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-field bg-deep px-4 py-3 text-white">
            <span className="type-micro font-semibold text-white/62">
              다음 검토
            </span>
            <span className="text-right copy-note font-semibold">
              {verdict.nextStep}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-line">
        <MetaCell label="월세 중위" value={formatRent(district)} />
        <MetaCell
          label="계약 수"
          value={`${(district.n_contracts ?? 0).toLocaleString()}건`}
        />
      </div>

      <div className="border-b border-line p-6">
        <p className="eyebrow mb-4">Read</p>
        <p className="text-base leading-normal text-ink">
          {district.동명}은{" "}
          <span className="font-semibold">
            {withSubjectParticle(strongest.label)}
          </span>{" "}
          강하고,{" "}
          <span className="font-semibold">
            {withSubjectParticle(weakest.label)}
          </span>{" "}
          상대적으로 약합니다.
        </p>
        <p className="mt-3 copy-note leading-normal text-muted">
          {policyRead}
        </p>
        <p className="mt-4 border-t border-line pt-4 copy-label leading-normal text-subtle">
          현재 지도는 {activeMetric.description} 기준의 분포를 보여줍니다.
        </p>
      </div>

      <dl className="space-y-4 p-6">
        {scoreRows.map((row) => (
          <ScoreBar
            key={row.key}
            active={row.key === activeMetric.key}
            label={row.label}
            value={row.value}
          />
        ))}
      </dl>
    </div>
  );
}

function ScoreBar({
  active,
  label,
  value,
}: {
  active: boolean;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-4 copy-label">
        <dt
          className={active ? "font-semibold text-ink" : "text-muted"}
        >
          {label}
        </dt>
        <dd className="font-semibold tabular-nums text-utility">
          {value.toFixed(0)}
        </dd>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-track">
        <div
          className={`h-full rounded-full ${
            active ? "bg-ink" : "bg-subtle"
          }`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-5">
      <dt className="type-micro font-semibold text-subtle">{label}</dt>
      <dd className="mt-2 text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}
