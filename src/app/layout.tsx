import type { Metadata } from "next";
import Link from "next/link";
import { GlobalHeader } from "@/components/GlobalHeader";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYLI — 성남 청년 1인가구 주거 적합도",
  description:
    "성남 청년 1인가구가 살 곳을 비교할 때 참고할 수 있는 지도와 데이터.",
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
              SYLI — 성남 청년 1인가구가 살 곳을 비교해보는 데이터 지도
            </p>
            <p>
              데이터 출처: 국토교통부 실거래가 · 경찰청 범죄통계 · 경기도
              민간데이터 · 성남데이터넷. 계산 방식과 한계는{" "}
              <Link href="/methodology" className="link-primary underline">
                계산 방식 페이지
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
