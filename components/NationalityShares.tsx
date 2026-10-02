"use client";

import FlagCircle from "./FlagCircle";
import type { CountryMarker } from "./NationalityMap";

const R = 16;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * One ring per nationality showing its share of the squad, largest first.
 * Identity comes from the flag and label, so every ring uses the same colour.
 */
export default function NationalityShares({
  countries,
  total,
  selected,
  previewed,
  onSelect,
  onPreview,
}: {
  countries: Pick<CountryMarker, "country" | "flag" | "count">[];
  total: number;
  selected: string | null;
  previewed: string | null;
  onSelect: (country: string) => void;
  onPreview: (country: string | null) => void;
}) {
  const sorted = [...countries].sort(
    (a, b) => b.count - a.count || a.country.localeCompare(b.country),
  );

  return (
    <ul
      aria-label="Nationalities by share of the squad"
      // Right-aligned via auto margin rather than justify-end, so an overflowing
      // row still scrolls from its first item.
      className="flex w-fit max-w-full min-w-0 gap-1 overflow-x-auto pb-1 [scrollbar-width:thin] md:ml-auto"
    >
      {sorted.map((c) => {
        const share = total ? c.count / total : 0;
        const pct = Math.round(share * 100);
        const isSelected = c.country === selected;
        const isPreviewed = !isSelected && c.country === previewed;
        const dimmed = selected !== null && !isSelected && !isPreviewed;
        const label = `${c.country}: ${c.count} of ${total} players (${pct}%)`;
        return (
          <li key={c.country} className="shrink-0">
            <button
              type="button"
              aria-pressed={isSelected}
              aria-label={label}
              title={label}
              onClick={() => onSelect(c.country)}
              onPointerEnter={(e) => e.pointerType === "mouse" && onPreview(c.country)}
              onPointerLeave={() => onPreview(null)}
              onFocus={() => onPreview(c.country)}
              onBlur={() => onPreview(null)}
              className={`flex w-14 flex-col items-center rounded-lg px-1 pt-1 pb-0.5 transition-[background-color,opacity] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-accent ${
                isSelected
                  ? "bg-accent/15"
                  : isPreviewed
                    ? "bg-accent/10"
                    : "hover:bg-bg"
              } ${dimmed ? "opacity-45 hover:opacity-100" : ""}`}
            >
              <span className="relative block h-10 w-10">
                <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden>
                  <circle cx="20" cy="20" r={R} fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle
                    cx="20"
                    cy="20"
                    r={R}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    // Keep a visible sliver for small shares despite the round caps.
                    strokeDasharray={`${Math.max(share * CIRCUMFERENCE, 1)} ${CIRCUMFERENCE}`}
                    className="transition-[stroke-dasharray] duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center">
                  <FlagCircle src={c.flag} country="" size={20} />
                </span>
              </span>
              <span className="mt-0.5 text-xs font-bold tabular-nums">{pct}%</span>
              <span className="w-full truncate text-center text-[10px] leading-tight text-muted">
                {c.country}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
