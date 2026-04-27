"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export type NavKey = "home" | "map" | "insights" | "methodology";

type SiteHeaderProps = {
  active: NavKey;
  className?: string;
  variant?: "dark" | "light";
};

const navItems: Array<{ href: string; key: NavKey; label: string }> = [
  { href: "/", key: "home", label: "홈" },
  { href: "/map", key: "map", label: "지도" },
  { href: "/insights", key: "insights", label: "인사이트" },
  { href: "/methodology", key: "methodology", label: "방법론" },
];

const NAV_DELAY_MS = 150;
const PENDING_VISUAL_MS = 620;

export function SiteHeader({
  active,
  className = "",
  variant = "light",
}: SiteHeaderProps) {
  const dark = variant === "dark";
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const navigationTimer = useRef<number | null>(null);
  const pendingTimer = useRef<number | null>(null);
  const pendingItem = pendingHref
    ? navItems.find((item) => item.href === pendingHref)
    : null;
  const visualActive = pendingItem?.key ?? active;
  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => item.key === visualActive)
  );
  const indicatorStyle = {
    transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
    width: "calc((100% - 1.25rem) / 4)",
  } satisfies CSSProperties;

  useEffect(() => {
    return () => {
      if (navigationTimer.current) {
        window.clearTimeout(navigationTimer.current);
      }
      if (pendingTimer.current) {
        window.clearTimeout(pendingTimer.current);
      }
    };
  }, []);

  function handleNavigate(
    event: MouseEvent<HTMLAnchorElement>,
    item: (typeof navItems)[number]
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (item.href === pathname) {
      event.preventDefault();
      setPendingHref(null);
      return;
    }

    event.preventDefault();
    setPendingHref(item.href);
    window.dispatchEvent(new Event("syli:route-leave"));

    if (navigationTimer.current) {
      window.clearTimeout(navigationTimer.current);
    }
    if (pendingTimer.current) {
      window.clearTimeout(pendingTimer.current);
    }

    navigationTimer.current = window.setTimeout(() => {
      router.push(item.href);
    }, NAV_DELAY_MS);
    pendingTimer.current = window.setTimeout(() => {
      setPendingHref(null);
    }, PENDING_VISUAL_MS);
  }

  return (
    <header
      className={`flex flex-col gap-4 border-b py-4 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between ${
        dark ? "border-white/18" : "border-[#d2d2d7]"
      } ${className}`}
    >
      <Link
        href="/"
        className={`shrink-0 text-[15px] font-semibold tracking-[0] transition-[color,opacity] duration-300 hover:opacity-72 ${
          dark ? "text-white" : "text-[#1d1d1f]"
        }`}
      >
        SYLI
      </Link>

      <nav
        aria-label="주요 메뉴"
        className={`relative grid w-full max-w-[330px] grid-cols-4 gap-1 overflow-hidden rounded-full p-1 text-[12px] transition-colors duration-300 sm:w-[368px] sm:max-w-none sm:text-[14px] ${
          dark ? "bg-white/10 text-white/72" : "bg-[#ececf0] text-[#6e6e73]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute bottom-1 left-1 top-1 rounded-full transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            dark ? "bg-white" : "bg-[#1d1d1f]"
          }`}
          style={indicatorStyle}
        />
        {navItems.map((item) => {
          const selected = item.key === visualActive;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.key === active ? "page" : undefined}
              onClick={(event) => handleNavigate(event, item)}
              className={`relative z-10 min-w-0 overflow-hidden rounded-full px-1 py-2 text-center font-semibold transition-colors duration-200 sm:px-3 ${
                selected
                  ? dark
                    ? "text-[#1d1d1f]"
                    : "text-white"
                  : dark
                    ? "hover:text-white"
                    : "hover:text-[#1d1d1f]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
