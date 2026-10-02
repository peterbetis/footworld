"use client";

import Image from "next/image";
import { use } from "react";
import type { Manager } from "@/lib/manager";
import FlagCircle from "./FlagCircle";
import { useT } from "./I18nProvider";

/** The club's current manager: portrait, name and nationality (from Wikipedia/Wikidata). */
export default function ManagerCard({
  manager: managerPromise,
}: {
  manager: Promise<Manager | null>;
}) {
  const t = useT();
  const manager = use(managerPromise);
  if (!manager) return null;

  return (
    <section
      aria-label={t.manager}
      className="flex items-center gap-3 rounded-xl border border-border bg-bg p-2.5 pr-4 sm:max-w-sm"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-border">
        {manager.portrait ? (
          <Image
            src={manager.portrait}
            alt={t.managerPortrait(manager.name)}
            fill
            unoptimized
            sizes="64px"
            className="object-cover object-top"
          />
        ) : (
          // No photo on Wikipedia: a neutral silhouette.
          <svg viewBox="0 0 64 64" className="h-full w-full text-muted" aria-hidden>
            <circle cx="32" cy="24" r="12" fill="currentColor" opacity="0.5" />
            <path d="M10 64c2-14 11-21 22-21s20 7 22 21Z" fill="currentColor" opacity="0.5" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">{t.manager}</p>
        <a
          href={manager.article}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-base font-bold hover:text-accent hover:underline"
        >
          {manager.name}
        </a>
        {manager.nationality && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm">
            {manager.flag && <FlagCircle src={manager.flag} country="" size={18} padded={false} />}
            <span className="truncate text-muted">{manager.nationality}</span>
          </p>
        )}
      </div>
    </section>
  );
}

export function ManagerCardSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy
      aria-label={label}
      className="flex items-center gap-3 rounded-xl border border-border bg-bg p-2.5 sm:max-w-sm"
    >
      <div className="h-16 w-16 animate-pulse rounded-lg bg-border" />
      <div className="space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-border" />
        <div className="h-4 w-32 animate-pulse rounded bg-border" />
        <div className="h-3 w-20 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}
