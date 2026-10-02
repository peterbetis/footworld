"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { League } from "@/lib/leagues";
import { useT } from "./I18nProvider";

export default function LeagueSelect({
  leagues,
  selected,
}: {
  leagues: League[];
  selected: string | null;
}) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const current = leagues.find((l) => l.slug === selected) ?? null;

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openList = () => {
    const index = current
      ? leagues.findIndex((l) => l.slug === current.slug)
      : leagues.findIndex((l) => l.available);
    setActive(Math.max(0, index));
    setOpen(true);
  };

  const choose = (league: League) => {
    if (!league.available) return;
    setOpen(false);
    if (league.slug !== current?.slug) router.replace(`/?league=${league.urlSlug}`);
  };

  const move = (dir: 1 | -1) => {
    setActive((i) => {
      for (let n = 1; n <= leagues.length; n++) {
        const next = (i + dir * n + leagues.length) % leagues.length;
        if (leagues[next].available) return next;
      }
      return i;
    });
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(leagues[active]);
        break;
      case "Escape":
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={current ? t.leagueLabel(current.name) : t.selectLeague}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openList();
          }
        }}
        className="flex max-w-full items-center gap-3 sm:min-w-56 rounded-xl border border-white/15 bg-white/5 py-1.5 pr-3 pl-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {current ? (
          <>
            <LeagueLogo league={current} size={35} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{current.name}</span>
              <span className="hidden text-xs text-white/60 sm:block">
                {t.leagueCountry(current.country)}
              </span>
            </span>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="h-[2.2rem] w-[2.2rem] shrink-0 rounded-full border-2 border-dashed border-white/25"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white/80">
                {t.selectLeague}
              </span>
              <span className="hidden text-xs text-white/50 sm:block">
                {t.europeanLeagues(leagues.length)}
              </span>
            </span>
          </>
        )}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`h-[1.1rem] w-[1.1rem] text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={t.selectLeague}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKeyDown}
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-header-2 py-1 shadow-2xl outline-none sm:left-0 sm:right-auto"
        >
          {leagues.map((l, i) => {
            const isSelected = l.slug === current?.slug;
            return (
              <li
                key={l.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={!l.available}
                onPointerEnter={() => l.available && setActive(i)}
                onClick={() => choose(l)}
                className={`flex items-center gap-3 px-3 py-2 text-sm ${
                  l.available
                    ? `cursor-pointer ${i === active ? "bg-white/10" : ""}`
                    : "cursor-not-allowed opacity-45"
                }`}
              >
                <LeagueLogo league={l} size={31} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block text-xs text-white/60">{t.leagueCountry(l.country)}</span>
                </span>
                {isSelected ? (
                  <svg aria-hidden viewBox="0 0 20 20" className="h-[1.1rem] w-[1.1rem] text-accent">
                    <path
                      d="M4.5 10.5l3.5 3.5 7.5-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  !l.available && (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/70">
                      {t.soon}
                    </span>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LeagueLogo({ league, size }: { league: League; size: number }) {
  if (!league.logo) {
    return (
      <span
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold"
        style={{ width: size, height: size }}
      >
        {league.name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={league.logo}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
