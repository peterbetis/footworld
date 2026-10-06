"use client";

import { useSyncExternalStore } from "react";

// Below lg (where the league and club prompts show), the page behind them is inert.
const QUERY = "(max-width: 1023.98px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Makes its content inert while `active`, but only on screens where the prompts show;
 * on desktop the leagues map stays usable instead.
 */
export default function InertOnPhones({
  active,
  className,
  children,
}: {
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const phone = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  return (
    <div inert={active && phone} className={className}>
      {children}
    </div>
  );
}
