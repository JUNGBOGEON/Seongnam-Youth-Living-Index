"use client";

import { usePathname } from "next/navigation";
import { SiteHeader, type NavKey } from "@/components/SiteHeader";

function getActiveKey(pathname: string): NavKey {
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/methodology")) return "methodology";
  return "home";
}

function getVariant(pathname: string) {
  return pathname === "/" || pathname.startsWith("/methodology")
    ? "dark"
    : "light";
}

export function GlobalHeader() {
  const pathname = usePathname();
  const active = getActiveKey(pathname);
  const variant = getVariant(pathname);

  return (
    <div className="absolute left-0 right-0 top-0 z-50 px-6">
      <div className="page-shell">
        <SiteHeader
          active={active}
          className="pointer-events-auto"
          variant={variant}
        />
      </div>
    </div>
  );
}
