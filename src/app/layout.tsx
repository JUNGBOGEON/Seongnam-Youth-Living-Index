import type { Metadata } from "next";
import Link from "next/link";
import { GlobalHeader } from "@/components/GlobalHeader";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYLI — 성남 청년 1인가구 주거 적합도",
  description:
    "Seongnam Youth Living Index — 판교 통근 청년 1인가구를 위한 데이터 기반 주거 정책 시뮬레이터. 2026 성남시 공공데이터 활용 시각화 경진대회 출품작.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col bg-white text-ink">
        <div className="scroll-progress-rail" aria-hidden="true">
          <div className="scroll-progress-bar" />
        </div>
        <GlobalHeader />
        <PageTransition>{children}</PageTransition>
        <footer className="border-t border-line bg-panel">
          <div className="footer-shell py-10 type-micro text-muted">
            <p className="mb-2">
              SYLI (Seongnam Youth Living Index) — 2026 성남시 공공데이터 활용
              시각화 경진대회 출품작
            </p>
            <p>
              데이터 출처: 국토교통부 실거래가 · 경찰청 범죄통계 · 경기도
              민간데이터 · 성남데이터넷. 모든 집계·공식·한계는{" "}
              <Link href="/methodology" className="link-primary underline">
                방법론 페이지
              </Link>
              에서 공개.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
