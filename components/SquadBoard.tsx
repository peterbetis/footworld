"use client";

import { Suspense, useEffect, useId, useState } from "react";
import type { TeamFormation } from "@/lib/formation";
import type { KitSet } from "@/lib/kits";
import type { Team } from "@/lib/teams";
import type { Manager } from "@/lib/manager";
import type { WikiKits } from "@/lib/wikiKits";
import type { Player, Position } from "@/lib/players";
import { clubPalette, clubThemeStyle } from "@/lib/clubColors";
import { profileKey, requestProfile, useProfiles } from "@/lib/profileStore";
import FlagCircle from "./FlagCircle";
import KitsGallery, { KitsGallerySkeleton } from "./KitsGallery";
import ManagerCard, { ManagerCardSkeleton } from "./ManagerCard";
import FormationPitch, { FormationPitchSkeleton } from "./FormationPitch";
import NationalityMap, { type CountryMarker, type MapData, type MapPin } from "./NationalityMap";
import NationalityShares from "./NationalityShares";
import PlayerModal from "./PlayerModal";
import SectionBar, { CollapsiblePanel } from "./SectionBar";
import Shirt from "./Shirt";
import { useT } from "./I18nProvider";

const GROUPS: {
  position: Position;
  key: "goalkeepers" | "defenders" | "midfielders" | "forwards";
}[] = [
  { position: "G", key: "goalkeepers" },
  { position: "D", key: "defenders" },
  { position: "M", key: "midfielders" },
  { position: "F", key: "forwards" },
];

/** A country picked on the map, or a player (which brings their country with it). */
type Selection = { country: string | null; playerId: string | null } | null;

export default function SquadBoard({
  crest,
  heading,
  players,
  kits,
  team,
  league,
  teamName,
  map,
  markers,
  formation,
  wikiKits,
  manager,
  season,
}: {
  /** Team crest, at the start of the header row; clicking it clears the selection. */
  crest?: React.ReactNode;
  /** Team name and season, after the crest. */
  heading: React.ReactNode;
  players: Player[];
  kits: KitSet;
  /** For the crest on the kit illustrations. */
  team: Team | undefined;
  /** For the league badge on the player modal. */
  league?: { name: string; logo: string };
  teamName: string;
  map: MapData;
  markers: CountryMarker[];
  /** Most-used formation; resolves after the squad has rendered. */
  formation: Promise<TeamFormation | null>;
  /** Current-season kit images; resolves after the squad has rendered. */
  wikiKits: Promise<WikiKits | null>;
  /** Current manager; resolves after the squad has rendered. */
  manager: Promise<Manager | null>;
  season: string;
}) {
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredShare, setHoveredShare] = useState<string | null>(null);
  // The profile modal; its player stays set while it fades out.
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const t = useT();
  const [natOpen, setNatOpen] = useState(true);
  const [squadOpen, setSquadOpen] = useState(true);
  const [kitsOpen, setKitsOpen] = useState(true);
  const kit = kits.home;
  const natPanelId = useId();
  const squadPanelId = useId();
  const kitsPanelId = useId();

  const selectedPlayer = players.find((p) => p.id === selection?.playerId) ?? null;
  const focusCountry = selection?.country ?? null;
  const hoveredPlayer = players.find((p) => p.id === hoveredId) ?? null;
  const hoverCountry = hoveredPlayer?.nationality?.country ?? hoveredShare;

  // Every nationality in the squad (not only those placeable on the map).
  const shares = [
    ...players
      .reduce((acc, p) => {
        if (!p.nationality) return acc;
        const cur = acc.get(p.nationality.country);
        if (cur) cur.count++;
        else acc.set(p.nationality.country, { ...p.nationality, count: 1 });
        return acc;
      }, new Map<string, { country: string; name: string; flag: string; count: number }>())
      .values(),
  ];

  // Clicking the selected country's flag again (including via a selected player) clears it.
  // Selecting one opens the squad panel (if collapsed), so its players show highlighted.
  const selectCountry = (c: string) => {
    if (selection?.country === c) {
      setSelection(null);
      return;
    }
    setSelection({ country: c, playerId: null });
    setSquadOpen(true);
  };
  // Selects a player and opens their profile; closing it keeps them selected.
  const openProfile = (p: Player) => {
    setSelection({ country: p.nationality?.country ?? null, playerId: p.id });
    setProfilePlayer(p);
    setProfileOpen(true);
  };
  // Tiles and the pitch: clicking the selected player again clears the selection.
  const selectPlayer = (p: Player) => {
    if (selection?.playerId === p.id) setSelection(null);
    else openProfile(p);
  };

  // Players grouped by nationality (English name), ordered by shirt number, for the
  // map's players popover.
  const playersByCountry: Record<string, { id: string; name: string; number: number | null }[]> =
    {};
  for (const p of [...players].sort((a, b) => (a.number ?? 999) - (b.number ?? 999))) {
    if (!p.nationality) continue;
    (playersByCountry[p.nationality.country] ??= []).push({
      id: p.id,
      name: p.name,
      number: p.number,
    });
  }

  // Countries are keyed by their English name; show them in the page's language.
  const nameOf = (country: string) => shares.find((c) => c.country === country)?.name ?? country;

  // Birthplace pins for the selected country's players, as their profiles arrive.
  const profiles = useProfiles();
  const countryPlayers = focusCountry
    ? players.filter((p) => p.nationality?.country === focusCountry)
    : [];
  useEffect(() => {
    if (!focusCountry) return;
    for (const p of players) {
      if (p.nationality?.country === focusCountry) requestProfile(p, t.locale);
    }
  }, [focusCountry, players, t.locale]);
  const pins: MapPin[] = countryPlayers.flatMap((p) => {
    const entry = profiles.get(profileKey(p.id, t.locale));
    if (!entry || entry === "error" || !entry.birthCoords || !entry.birthPlace) return [];
    return [
      {
        playerId: p.id,
        name: p.name,
        number: p.number,
        place: entry.birthPlace,
        ...entry.birthCoords,
      },
    ];
  });

  const matches = focusCountry
    ? players.filter((p) => p.nationality?.country === focusCountry).length
    : 0;

  return (
    // Club colours for the panel headers (inherited through display: contents).
    <div className="club-theme contents" style={clubThemeStyle(clubPalette(kits))}>
      {/* Hidden on phones: the teams bar under the page header already shows the team. */}
      <header className="team-heading hidden items-center gap-3 border-b border-border px-4 py-2 sm:flex sm:px-6">
        {crest && (
          <button
            type="button"
            onClick={() => setSelection(null)}
            aria-label={t.clearSelection}
            title={t.clearSelection}
            className="shrink-0 cursor-pointer rounded-lg drop-shadow-[0_1px_3px_rgb(0_0_0/0.35)] transition-transform outline-none hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
          >
            {crest}
          </button>
        )}
        {heading}
      </header>

      {/* Collapsible nationalities panel: share charts, then the world map. */}
      <section aria-label="Squad nationalities" className="border-b border-border bg-bg">
        <SectionBar
          open={natOpen}
          onToggle={() => setNatOpen((o) => !o)}
          controls={natPanelId}
          title={t.nationalities}
          badge={t.countries(shares.length)}
          icon={
            <svg
              viewBox="0 0 20 20"
              className="h-[0.95rem] w-[0.95rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="10" cy="10" r="7.25" />
              <path d="M2.75 10h14.5M10 2.75c2 2.1 3 4.5 3 7.25s-1 5.15-3 7.25M10 2.75c-2 2.1-3 4.5-3 7.25s1 5.15 3 7.25" />
            </svg>
          }
          status={
            <p aria-live="polite">
              {selection ? (
                <>
                  {selectedPlayer && (
                    <span className="font-semibold text-text">{selectedPlayer.name}</span>
                  )}
                  {selectedPlayer && focusCountry && " · "}
                  {focusCountry && t.playersFrom(matches, nameOf(focusCountry))}
                  {" · "}
                  <button
                    type="button"
                    onClick={() => setSelection(null)}
                    className="pointer-events-auto relative z-10 cursor-pointer font-semibold text-text underline-offset-2 hover:underline"
                  >
                    {t.showAll}
                  </button>
                </>
              ) : natOpen ? (
                t.hintFlagOrPlayer
              ) : (
                t.hintPlayer
              )}
            </p>
          }
        />

        {/* Content stays mounted while collapsed, so the map keeps its zoom. */}
        <CollapsiblePanel id={natPanelId} open={natOpen}>
          {/* Below lg: share rings in a row above the map. lg and up: a column on the
              left, as tall as the map (the rings list fills it and scrolls). */}
          <div className="border-t border-border lg:flex lg:gap-3 lg:px-4 lg:py-3">
            <div className="px-4 pt-3 pb-2 sm:px-6 lg:relative lg:w-44 lg:shrink-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:p-0 lg:shadow-sm">
              <NationalityShares
                countries={shares}
                total={players.length}
                selected={focusCountry}
                previewed={hoverCountry}
                onSelect={selectCountry}
                onPreview={setHoveredShare}
              />
            </div>
            <div className="px-2 pt-1 pb-3 sm:px-4 lg:min-w-0 lg:flex-1 lg:p-0">
              <NationalityMap
                map={map}
                markers={markers}
                playersByCountry={playersByCountry}
                selected={focusCountry}
                previewed={hoverCountry}
                onSelect={selectCountry}
                onPreview={setHoveredShare}
                pins={pins}
                selectedPlayerId={selection?.playerId ?? null}
                onPlayer={(id) => {
                  const p = players.find((x) => x.id === id);
                  if (p) openProfile(p);
                }}
              />
            </div>
          </div>
        </CollapsiblePanel>
      </section>

      {/* Collapsible squad panel: player tiles and the most-used formation. */}
      <section aria-label={t.squad}>
        <SectionBar
          open={squadOpen}
          onToggle={() => setSquadOpen((o) => !o)}
          controls={squadPanelId}
          title={t.squad}
          badge={t.players(players.length)}
          icon={
            <svg
              viewBox="0 0 20 20"
              className="h-[0.95rem] w-[0.95rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            >
              <path d="M7 3.5 3 5.5l1.5 3.5L6 8.5V16.5h8V8.5l1.5.5L17 5.5l-4-2c-.4 1.2-1.6 2-3 2s-2.6-.8-3-2Z" />
            </svg>
          }
          status={<p>{t.squadHint}</p>}
        />

        <CollapsiblePanel id={squadPanelId} open={squadOpen}>
          {/* Squad and formation: side by side on wide screens, stacked otherwise. */}
          <div className="border-t border-border lg:flex lg:items-start">
            {/* Clicking anywhere in the squad area other than a tile clears the selection. */}
            <div
              className="min-w-0 space-y-6 px-4 py-5 sm:px-6 lg:flex-1"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest("[data-tile]")) setSelection(null);
              }}
            >
              {GROUPS.map(({ position, key }) => {
                const title = t[key];
                const group = players.filter((p) => p.position === position);
                if (group.length === 0) return null;
                return (
                  <section key={position} aria-label={title}>
                    <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                      {title} <span className="font-normal">· {group.length}</span>
                    </h3>
                    <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-8 2xl:grid-cols-10">
                      {group.map((p) => {
                        const country = p.nationality?.country ?? null;
                        const isSelected = selection?.playerId === p.id;
                        const sameCountry = focusCountry !== null && country === focusCountry;
                        const isHovered = hoveredId === p.id;
                        const hoverMate =
                          !isHovered && hoverCountry !== null && country === hoverCountry;
                        const blurred =
                          selection !== null && !isSelected && !sameCountry && !isHovered;

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
                              data-tile
                              aria-pressed={isSelected}
                              aria-label={`${p.name}${p.number != null ? `, ${t.numberLabel(p.number)}` : ""}${p.nationality ? `, ${p.nationality.name}` : ""}`}
                              onClick={() => selectPlayer(p)}
                              onPointerEnter={(e) =>
                                e.pointerType === "mouse" && setHoveredId(p.id)
                              }
                              onPointerLeave={() => setHoveredId((id) => (id === p.id ? null : id))}
                              onFocus={() => setHoveredId(p.id)}
                              onBlur={() => setHoveredId((id) => (id === p.id ? null : id))}
                              className={`relative flex h-full w-full cursor-pointer flex-col items-center rounded-lg bg-bg px-1 pt-1.5 pb-1 text-center transition-[filter,opacity,box-shadow,translate,background-color] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tone} ${
                                blurred ? "opacity-40 blur-[2px]" : ""
                              }`}
                            >
                              <div className="w-full max-w-15" aria-hidden>
                                <Shirt
                                  kit={kit}
                                  name={p.shirtName}
                                  number={p.number}
                                  uid={`shirt-${p.id}`}
                                  label=""
                                />
                              </div>
                              <p
                                className="mt-0.5 line-clamp-2 w-full text-[11px] leading-tight font-semibold"
                                title={p.name}
                              >
                                {p.name}
                              </p>
                              {isSelected && (
                                <span
                                  aria-hidden
                                  className="absolute top-1 left-1 flex h-[1.1rem] w-[1.1rem] items-center justify-center rounded-full bg-accent text-white"
                                >
                                  <svg viewBox="0 0 20 20" className="h-[0.825rem] w-[0.825rem]">
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
                                <span title={p.nationality.name} className="absolute top-1 right-1">
                                  <FlagCircle src={p.nationality.flag} country="" size={13} />
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

            {/* Stays in view while scrolling the squad on wide screens. */}
            <section
              aria-label={t.mostUsedFormation}
              className="border-t border-border px-4 py-5 sm:px-6 lg:sticky lg:top-4 lg:w-88 lg:shrink-0 lg:border-t-0 lg:border-l lg:px-4"
            >
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {t.mostUsedFormation}
              </h3>
              <Suspense fallback={<FormationPitchSkeleton label={t.loadingFormation} />}>
                <FormationPitch
                  formation={formation}
                  kit={kit}
                  players={players}
                  selectedId={selection?.playerId ?? null}
                  focusCountry={focusCountry}
                  hoverCountry={hoverCountry}
                  onSelect={selectPlayer}
                  onHover={setHoveredId}
                  onClear={() => setSelection(null)}
                />
              </Suspense>
              {/* Current manager, under the pitch. */}
              <div className="mt-5">
                <Suspense fallback={<ManagerCardSkeleton label={t.loadingManager} />}>
                  <ManagerCard manager={manager} team={team} league={league} />
                </Suspense>
              </div>
            </section>
          </div>
        </CollapsiblePanel>
      </section>

      {/* Collapsible kits panel: illustrated home, away and third kits. */}
      <section aria-label={t.kits} className="border-t border-border">
        <SectionBar
          open={kitsOpen}
          onToggle={() => setKitsOpen((o) => !o)}
          controls={kitsPanelId}
          title={t.kits}
          badge={season || undefined}
          icon={
            <svg
              viewBox="0 0 20 20"
              className="h-[0.95rem] w-[0.95rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            >
              <path d="M5.5 4 2.5 5.5l1 2.5 1.2-.4V13h5V7.6l1 .4 1-2.5-3-1.5c-.3.8-1 1.3-1.9 1.3S5.8 4.8 5.5 4Z" />
              <path d="M12.5 7.2 14.5 6.5c.3.8 1 1.3 1.9 1.3l1.1 2.4-1.2.6V16h-5v-3" />
            </svg>
          }
          status={<p>{t.kitsHint}</p>}
        />
        <CollapsiblePanel id={kitsPanelId} open={kitsOpen}>
          <div className="border-t border-border px-4 py-5 sm:px-6">
            <Suspense fallback={<KitsGallerySkeleton label={t.kitsLoading} />}>
              <KitsGallery
                wiki={wikiKits}
                fallback={kits}
                team={team}
                teamName={teamName}
                currentSeason={season}
              />
            </Suspense>
          </div>
        </CollapsiblePanel>
      </section>

      <PlayerModal
        player={profilePlayer}
        team={team}
        league={league}
        formation={formation}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
