export function HomePressure() {
  return (
    <section className="section-gray">
      <div className="page-shell section-pad">
        <div className="mb-14 copy-wide">
          <p className="eyebrow mb-5">핵심 숫자</p>
          <h2 className="type-section">월세만 보면 놓치는 게 있습니다.</h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-field bg-line md:grid-cols-3">
          <PressurePanel
            label="통근"
            value="36%"
            title="판교에 오래 머무는 직장인"
            body="판교는 일자리가 많지만, 모두가 매일 오래 머무는 것은 아닙니다. 실제 출퇴근 흐름을 따로 봐야 합니다."
          />
          <PressurePanel
            label="월세"
            value="5배"
            title="판교동과 하대원동의 월세 차이"
            body="회사와 가까워도 월세가 높으면 살기 어렵습니다. 거리와 비용을 함께 봐야 합니다."
          />
          <PressurePanel
            label="금융"
            value="6배"
            title="30대로 갈 때 커지는 빚"
            body="집을 고를 때는 지금 월급만 볼 수 없습니다. 몇 년 뒤 감당해야 할 빚도 함께 봐야 합니다."
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
