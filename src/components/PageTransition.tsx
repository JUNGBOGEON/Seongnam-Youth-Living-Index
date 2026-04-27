"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ROUTE_LEAVE_EVENT = "syli:route-leave";
const LEAVE_MS = 260;

function isPlainPrimaryClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function getInternalNavigationTarget(event: MouseEvent) {
  if (!isPlainPrimaryClick(event)) return null;
  if (event.defaultPrevented) return null;
  if (!(event.target instanceof Element)) return null;

  const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return null;

  const url = new URL(anchor.href);
  if (url.origin !== window.location.origin) return null;
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  ) {
    return null;
  }

  return url;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const routeTone =
    pathname === "/" || pathname.startsWith("/methodology") ? "dark" : "light";

  const startLeave = useCallback(() => {
    setIsLeaving(true);

    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
    }

    leaveTimer.current = window.setTimeout(() => {
      setIsLeaving(false);
      leaveTimer.current = null;
    }, LEAVE_MS);
  }, []);

  useEffect(() => {
    function handleRouteLeave() {
      startLeave();
    }

    function handleDocumentClick(event: MouseEvent) {
      if (getInternalNavigationTarget(event)) {
        startLeave();
      }
    }

    window.addEventListener(ROUTE_LEAVE_EVENT, handleRouteLeave);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener(ROUTE_LEAVE_EVENT, handleRouteLeave);
      document.removeEventListener("click", handleDocumentClick, true);

      if (leaveTimer.current) {
        window.clearTimeout(leaveTimer.current);
      }
    };
  }, [startLeave]);

  return (
    <main
      className={`route-transition-shell route-transition-shell--${routeTone} flex-1 ${
        isLeaving ? "route-is-leaving" : ""
      }`}
    >
      <div key={pathname} className="page-transition-content">
        {children}
      </div>
    </main>
  );
}
