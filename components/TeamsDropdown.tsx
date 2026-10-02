"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Team } from "@/lib/teams";
import { useSelectedTeam } from "@/lib/useSelectedTeam";
import { useT } from "./I18nProvider";
import TeamLogo from "./TeamLogo";

/** Compact team picker for small screens; the sidebar table replaces it on desktop. */
export default function TeamsDropdown({
  leagueName,
  teams,
}: {
  leagueName: string;
  teams: Team[];
}) {
  const [open, setOpen] = useState(false);
  const { selectedSlug, toggle } = useSelectedTeam();
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelId = useId();

  const selected = teams.find((t) => t.urlSlug === selectedSlug) ?? null;

  useEffect(() => {
    if (!open) return;
    // Bring the selected team into view when the list opens.
    listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest" });

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={selected ? t.teamLabel(selected.name) : t.selectLeagueTeam(leagueName)}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-3 rounded-xl border bg-bg py-1.5 pr-3 pl-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          selected ? "border-accent/60" : "border-border hover:border-muted/40"
        }`}
      >
        {selected ? (
          <span className="flex h-[2.2rem] w-[2.2rem] items-center justify-center" aria-hidden>
            <TeamLogo team={selected} size={31} />
          </span>
        ) : (
          <span className="flex -space-x-2" aria-hidden>
            {teams.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-full bg-surface ring-2 ring-bg"
              >
                <TeamLogo team={t} size={24} />
              </span>
            ))}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {selected ? selected.name : t.leagueTeams(leagueName)}
          </span>
          <span className="block text-xs text-muted">
            {selected
              ? `${leagueName} · ${t.clubs(teams.length)}`
              : `${t.selectATeam} · ${t.clubs(teams.length)}`}
          </span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`h-[1.1rem] w-[1.1rem] text-muted transition-transform ${open ? "rotate-180" : ""}`}
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
          id={panelId}
          aria-label={t.leagueTeams(leagueName)}
          className="absolute inset-x-0 z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-xl"
        >
          {teams.map((t) => {
            const isSelected = t.urlSlug === selectedSlug;
            return (
              <li key={t.id} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    toggle(t.urlSlug);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:bg-bg focus-visible:outline-none ${
                    isSelected ? "bg-accent/10 shadow-[inset_3px_0_0_var(--accent)]" : "hover:bg-bg"
                  }`}
                >
                  <TeamLogo team={t} />
                  <span
                    className={`min-w-0 flex-1 truncate ${isSelected ? "font-bold" : "font-medium"}`}
                  >
                    {t.name}
                  </span>
                  <span
                    className={`text-xs font-semibold tracking-wide ${
                      isSelected ? "text-text" : "text-muted"
                    }`}
                  >
                    {t.abbreviation}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
