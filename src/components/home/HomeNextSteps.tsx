import Link from "next/link";

const nextSteps = [
  {
    href: "/map",
    label: "지도",
    title: "동별 점수를 지도에서 바로 확인합니다.",
  },
  {
    href: "/insights",
    label: "주요 내용",
    title: "중요한 숫자 20개를 쉽게 풀어봅니다.",
  },
  {
    href: "/methodology",
    label: "계산 방식",
    title: "점수를 어떻게 만들었는지 보여줍니다.",
  },
];

export function HomeNextSteps() {
  return (
    <section className="section-white">
      <div className="page-shell section-pad">
        <div className="grid gap-px overflow-hidden rounded-field bg-line md:grid-cols-3">
          {nextSteps.map((item) => (
            <NextStep key={item.href} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NextStep({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-7 transition-colors hover:bg-surface"
    >
      <p className="copy-label font-semibold text-muted">{label}</p>
      <h2 className="mt-8 type-util font-semibold leading-tight text-ink">
        {title}
      </h2>
      <span className="mt-8 inline-flex copy-small font-semibold text-link">
        열기 <span aria-hidden>›</span>
      </span>
    </Link>
  );
}
