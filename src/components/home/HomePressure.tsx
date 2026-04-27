export function HomePressure() {
  return (
    <section className="section-gray">
      <div className="page-shell section-pad">
        <div className="mb-14 copy-wide">
          <p className="eyebrow mb-5">Pressure Points</p>
          <h2 className="type-section">가격만으로는 설명되지 않습니다.</h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-field bg-line md:grid-cols-3">
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
    <article className="bg-white p-7 md:min-h-72">
      <p className="copy-label font-semibold text-muted">{label}</p>
      <div className="mt-8 numeric-xl font-semibold leading-none text-ink">
        {value}
      </div>
      <h3 className="mt-8 text-2xl font-semibold leading-tight text-ink">
        {title}
      </h3>
      <p className="mt-4 copy-small leading-relaxed text-utility">{body}</p>
    </article>
  );
}
