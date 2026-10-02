"use client";

import { useState } from "react";
import type { Kit } from "@/lib/kits";
import type { Player, Position } from "@/lib/players";
import FlagCircle from "./FlagCircle";
import NationalityMap, { type CountryMarker, type MapData } from "./NationalityMap";
import Shirt from "./Shirt";

const GROUPS: { position: Position; title: string }[] = [
  { position: "G", title: "Goalkeepers" },
  { position: "D", title: "Defenders" },
  { position: "M", title: "Midfielders" },
  { position: "F", title: "Forwards" },
];

/** A country picked on the map, or a player (which brings their country with it). */
type Selection = { country: string | null; playerId: string | null } | null;

export default function SquadBoard({
  players,
  kit,
  map,
  markers,
}: {
  players: Player[];
  kit: Kit;
  map: MapData;
  markers: CountryMarker[];
}) {
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedPlayer = players.find((p) => p.id === selection?.playerId) ?? null;
  const focusCountry = selection?.country ?? null;
  const hoveredPlayer = players.find((p) => p.id === hoveredId) ?? null;
  const hoverCountry = hoveredPlayer?.nationality?.country ?? null;

  // Clicking the selected country's flag again (including via a selected player) clears it.
  const selectCountry = (c: string) =>
    setSelection((cur) => (cur?.country === c ? null : { country: c, playerId: null }));
  const selectPlayer = (p: Player) =>
    setSelection((cur) =>
      cur?.playerId === p.id ? null : { country: p.nationality?.country ?? null, playerId: p.id },
    );

  const matches = focusCountry
    ? players.filter((p) => p.nationality?.country === focusCountry).length
    : 0;

  return (
    <>
      <section aria-label="Squad nationalities" className="border-b border-border bg-bg">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-3 sm:px-6">
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            Nationalities <span className="font-normal">· {markers.length}</span>
          </h3>
          <p className="text-xs text-muted" aria-live="polite">
            {selection ? (
              <>
                {selectedPlayer && (
                  <span className="font-semibold text-text">{selectedPlayer.name}</span>
                )}
                {selectedPlayer && focusCountry && " · "}
                {focusCountry && `${matches} player${matches === 1 ? "" : "s"} from ${focusCountry}`}
                {" · "}
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="font-semibold text-text underline-offset-2 hover:underline"
                >
                  Show all
                </button>
              </>
            ) : (
              "Click a flag or a player to highlight"
            )}
          </p>
        </div>
        <div className="px-2 pt-2 pb-3 sm:px-4">
          <NationalityMap
            map={map}
            markers={markers}
            selected={focusCountry}
            previewed={hoverCountry}
            onSelect={selectCountry}
          />
        </div>
      </section>

      <div className="space-y-8 px-4 py-5 sm:px-6">
        {GROUPS.map(({ position, title }) => {
          const group = players.filter((p) => p.position === position);
          if (group.length === 0) return null;
          return (
            <section key={position} aria-label={title}>
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
                {title} <span className="font-normal">· {group.length}</span>
              </h3>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                {group.map((p) => {
                  const country = p.nationality?.country ?? null;
                  const isSelected = selection?.playerId === p.id;
                  const sameCountry = focusCountry !== null && country === focusCountry;
                  const isHovered = hoveredId === p.id;
                  const hoverMate = !isHovered && hoverCountry !== null && country === hoverCountry;
                  const blurred = selection !== null && !isSelected && !sameCountry && !isHovered;

                  // Strongest first: selected player, hovered tile, selected country, hover teammates.
                  const tone = isSelected
                    ? "bg-accent/20 shadow-md ring-[3px] ring-accent"
                    : isHovered
                      ? "-translate-y-0.5 bg-accent/10 shadow-md ring-2 ring-accent"
                      : sameCountry
                        ? "ring-1 ring-accent/70"
                        : hoverMate
                          ? "ring-1 ring-accent/50"
                          : "";

                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${p.name}${p.number != null ? `, number ${p.number}` : ""}${country ? `, ${country}` : ""}`}
                        onClick={() => selectPlayer(p)}
                        onPointerEnter={(e) => e.pointerType === "mouse" && setHoveredId(p.id)}
                        onPointerLeave={() => setHoveredId((id) => (id === p.id ? null : id))}
                        onFocus={() => setHoveredId(p.id)}
                        onBlur={() => setHoveredId((id) => (id === p.id ? null : id))}
                        className={`relative flex h-full w-full flex-col items-center rounded-lg bg-bg px-2 pt-3 pb-2 text-center transition-[filter,opacity,box-shadow,translate,background-color] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tone} ${
                          blurred ? "opacity-40 blur-[2px]" : ""
                        }`}
                      >
                        <div className="w-full max-w-[72px]" aria-hidden>
                          <Shirt
                            kit={kit}
                            name={p.shirtName}
                            number={p.number}
                            uid={`shirt-${p.id}`}
                            label=""
                          />
                        </div>
                        <p
                          className="mt-1.5 line-clamp-2 w-full text-xs leading-tight font-semibold"
                          title={p.name}
                        >
                          {p.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          {p.number != null ? `#${p.number}` : "No number"}
                        </p>
                        {isSelected && (
                          <span
                            aria-hidden
                            className="absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white"
                          >
                            <svg viewBox="0 0 20 20" className="h-3 w-3">
                              <path
                                d="M5 10.5l3.5 3.5L15 7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                        {p.nationality && (
                          <span title={p.nationality.country} className="absolute right-2 bottom-2">
                            <FlagCircle src={p.nationality.flag} country="" size={18} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
