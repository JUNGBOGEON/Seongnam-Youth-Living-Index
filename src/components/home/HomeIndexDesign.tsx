type HomeIndexDesignProps = {
  guAverage: Array<[string, number]>;
};

const weights = [
  { color: "#1d1d1f", label: "판교 통근", value: "25.0%" },
  { color: "#535356", label: "생활 편의", value: "18.75%" },
  { color: "#86868b", label: "청년 머무름", value: "18.75%" },
  { color: "#b9b9bf", label: "동의 특징", value: "18.75%" },
  { color: "#d2d2d7", label: "월세 부담", value: "18.75%" },
];

export function HomeIndexDesign({ guAverage }: HomeIndexDesignProps) {
  return (
    <section className="section-white">
      <div className="page-shell section-pad index-layout">
        <div>
          <p className="eyebrow mb-5">점수 구성</p>
          <h2 className="type-section mb-8">다섯 가지를 함께 보고 점수를 냅니다.</h2>
          <div className="h-4 overflow-hidden rounded-sm bg-panel">
            {weights.map((weight) => (
              <span
                key={weight.label}
                aria-hidden="true"
                className="inline-block h-full"
                style={{ width: weight.value, background: weight.color }}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {weights.map((weight) => (
              <WeightRow
                key={weight.label}
                label={weight.label}
                value={weight.value}
              />
            ))}
          </div>
        </div>

        <aside className="rounded-field border border-line p-7">
          <p className="eyebrow mb-6">구별 평균</p>
          <dl className="space-y-5">
            {guAverage.map(([gu, value]) => (
              <div key={gu}>
                <div className="mb-2 flex items-center justify-between">
                  <dt className="copy-small font-semibold text-ink">
                    {gu}
                  </dt>
                  <dd className="copy-small font-semibold tabular-nums text-utility">
                    {value.toFixed(1)}
                  </dd>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-ink"
                    style={{ width: `${Math.min(100, value)}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

function WeightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-line pt-4">
      <span className="copy-small text-utility">{label}</span>
      <span className="copy-small font-semibold tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}
