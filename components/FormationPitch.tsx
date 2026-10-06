"use client";

import { use } from "react";
import type { TeamFormation } from "@/lib/formation";
import type { Kit } from "@/lib/kits";
import type { Player } from "@/lib/players";
import FlagCircle from "./FlagCircle";
import { useT } from "./I18nProvider";
import Shirt from "./Shirt";

/** "VINÍCIUS JÚNIOR" → "Vinícius Júnior", "LEWIS-SKELLY" → "Lewis-Skelly". */
function titleCase(name: string) {
  return name
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Pitch markings in metres on a 105 × 68 pitch, own goal on the left. */
/** Pitch markings in a 105 × 68 landscape frame (rotate to stand it upright). */
export function Markings() {
  const stripes = Array.from({ length: 10 }, (_, i) => i);
  return (
    <>
      <rect width="105" height="68" fill="var(--pitch)" />
      {stripes.map((i) =>
        i % 2 ? (
          <rect key={i} x={i * 10.5} width="10.5" height="68" fill="var(--pitch-stripe)" />
        ) : null,
      )}
      <g fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.35">
        <rect x="0.5" y="0.5" width="104" height="67" />
        <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" />
        <circle cx="52.5" cy="34" r="9.15" />
        {/* Penalty and goal areas, both ends */}
        <rect x="0.5" y="13.84" width="16.5" height="40.32" />
        <rect x="0.5" y="24.84" width="5.5" height="18.32" />
        <rect x="88" y="13.84" width="16.5" height="40.32" />
        <rect x="99" y="24.84" width="5.5" height="18.32" />
        <path d="M17 26.69 A9.15 9.15 0 0 1 17 41.31" />
        <path d="M88 26.69 A9.15 9.15 0 0 0 88 41.31" />
      </g>
      <g fill="rgba(255,255,255,0.75)">
        <circle cx="52.5" cy="34" r="0.4" />
        <circle cx="11.5" cy="34" r="0.4" />
        <circle cx="93.5" cy="34" r="0.4" />
      </g>
    </>
  );
}

export default function FormationPitch({
  formation: formationPromise,
  kit,
  players,
  selectedId,
  focusCountry,
  hoverCountry,
  onSelect,
  onHover,
  onClear,
  hoverDisabled = false,
}: {
  formation: Promise<TeamFormation | null>;
  kit: Kit;
  players: Player[];
  selectedId: string | null;
  focusCountry: string | null;
  hoverCountry: string | null;
  onSelect: (player: Player) => void;
  onHover: (playerId: string | null) => void;
  /** A click on the pitch itself (not on a player): clears the selection. */
  onClear?: () => void;
  /** No hover highlight (a country is selected). */
  hoverDisabled?: boolean;
}) {
  const data = use(formationPromise);
  const t = useT();

  if (!data) {
    return <p className="py-10 text-center text-sm text-muted">{t.noLineups}</p>;
  }

  const byId = new Map(players.map((p) => [p.id, p]));
  const anySelection = selectedId !== null || focusCountry !== null;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-lg font-extrabold tabular-nums">
          <span className="mr-1.5 text-sm font-semibold text-muted">{t.usualFormation}</span>
          {data.formation}
        </span>
        <span className="text-[11px] leading-snug text-muted">
          {t.formationUsage(data.matchesUsed, data.matchesAnalysed)}
        </span>
      </div>

      <div
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) onClear?.();
        }}
        className="relative mx-auto aspect-[68/105] w-full max-w-sm overflow-hidden rounded-xl shadow-inner [--pitch-stripe:#2b7a37] [--pitch:#2f8a3e] lg:max-w-none dark:[--pitch-stripe:#1d5427] dark:[--pitch:#215f2c]">
        {/* Vertical pitch: own goal (and keeper) at the top, attacking downwards. */}
        <svg viewBox="0 0 68 105" className="absolute inset-0 h-full w-full" aria-hidden>
          <g transform="matrix(0 1 -1 0 68 0)">
            <Markings />
          </g>
        </svg>

        <ul aria-label={t.lineupLabel(data.formation)}>
          {data.slots.map((s) => {
            const player = byId.get(s.playerId);
            const country = player?.nationality?.country ?? null;
            const isSelected = selectedId === s.playerId;
            const related =
              !isSelected &&
              country !== null &&
              (country === focusCountry || country === hoverCountry);
            // A hovered country (chart, map, tile or pitch) previews like a selection.
            const dimmed = hoverCountry
              ? country !== hoverCountry
              : anySelection && !isSelected && !(focusCountry && country === focusCountry);
            const label = `${s.name}${s.number != null ? `, ${t.numberLabel(s.number)}` : ""}${player?.nationality ? `, ${player.nationality.name}` : ""} — ${s.position}, ${t.startedOf(s.starts, data.matchesUsed)}${player ? "" : ` (${t.leftSquad})`}`;

            return (
              <li
                key={s.place}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                // Facing down the pitch, the team's right is the viewer's left.
                style={{ top: `${s.depth}%`, left: `${100 - s.lateral}%` }}
              >
                <button
                  type="button"
                  disabled={!player}
                  aria-pressed={isSelected}
                  aria-label={label}
                  title={label}
                  onClick={() => player && onSelect(player)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && onHover(s.playerId)}
                  onPointerLeave={() => onHover(null)}
                  className={`group flex w-16 cursor-pointer flex-col items-center transition-opacity duration-200 outline-none disabled:cursor-default ${
                    dimmed ? `opacity-45 ${hoverDisabled ? "" : "hover:opacity-100"}` : ""
                  }`}
                >
                  <span
                    className={`relative block w-8.5 drop-shadow-md transition-transform duration-200 ${
                      isSelected ? "scale-115" : hoverDisabled ? "" : "group-enabled:group-hover:scale-110"
                    }`}
                    aria-hidden
                  >
                    <Shirt
                      kit={kit}
                      name={s.shirtName}
                      number={s.number}
                      uid={`pitch-${s.place}`}
                      label=""
                    />
                    {player?.nationality && (
                      <FlagCircle
                        src={player.nationality.flag}
                        country=""
                        size={15}
                        className="absolute -right-1.5 bottom-0 ring-1 ring-white/80"
                      />
                    )}
                  </span>
                  <span
                    className={`mt-0.5 max-w-full truncate rounded px-1 text-[11px] leading-4 font-semibold text-white ${
                      isSelected
                        ? "bg-accent"
                        : related
                          ? "bg-black/55 ring-1 ring-accent"
                          : "bg-black/45"
                    } group-focus-visible:outline-2 group-focus-visible:outline-white`}
                  >
                    {titleCase(s.shirtName)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export function FormationPitchSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label}>
      <div className="mb-3 h-6 w-20 animate-pulse rounded bg-border" />
      <div className="mx-auto aspect-[68/105] w-full max-w-sm animate-pulse rounded-xl bg-border lg:max-w-none" />
    </div>
  );
}
