import Link from "next/link";

const nextSteps = [
  {
    href: "/map",
    label: "지도",
    title: "색으로 먼저 보고, 동을 눌러 확인합니다.",
  },
  {
    href: "/insights",
    label: "인사이트",
    title: "20개 발견을 정책 압력별로 다시 읽습니다.",
  },
  {
    href: "/methodology",
    label: "방법론",
    title: "공식, 데이터 출처, 한계를 공개합니다.",
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
