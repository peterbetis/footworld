"use client";

import { interpolateZoom } from "d3-interpolate";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useId, useRef, useState, useTransition } from "react";
import type { ClubSpot } from "@/lib/leagueClubs";
import { useHoveredTeam } from "@/lib/hoveredTeam";
import type { LeagueSpot, MapBox } from "@/lib/leaguesMap";
import { onSelectedNationalityChange, useSelectedNationality } from "@/lib/selectedNationality";
import { useT } from "./I18nProvider";
import { placeMarkers } from "./NationalityMap";
import SectionBar, { CollapsiblePanel } from "./SectionBar";

/** Zoom and offset in map units, as on the nationalities map: screen = (point·k + t)·scale. */
type View = { k: number; tx: number; ty: number };

type Clubs = Record<string, ClubSpot[] | "loading" | "error">;

/** Ease in and out, as on the nationalities map. */
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The leagues map: the seven league countries with their league logos. Clicking a
 * country (or its logo) flies in until it fills the map and places every club's crest
 * at its stadium; clicking a crest selects that club and scrolls to its heading.
 * Same colours, hover tints and zoom transitions as the nationalities map, but the
 * view is driven by clicks only (no wheel or drag zooming).
 */
export default function LeaguesMap({
  width: mapWidth,
  height: mapHeight,
  projection,
  countries,
  overview,
  area,
  leagues,
  selectedLeague,
}: {
  /** The world map's size and projection (map units), shared with the nationalities map. */
  width: number;
  height: number;
  projection: { scale: number; tx: number; ty: number };
  countries: { key: string; name: string; d: string }[];
  /** Starting area: all seven league countries. */
  overview: MapBox;
  /** Where countries are drawn (a selected nationality beyond it can't be shown). */
  area: MapBox;
  leagues: LeagueSpot[];
  /** ESPN slug of the league in the URL, whose country is tinted more strongly. */
  selectedLeague: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const selectedTeam = params.get("team");
  const panelId = useId();
  const [open, setOpen] = useState(true);
  // Starts on the selected league, zoomed in with its clubs, and follows the league in
  // the URL from then on (the overview when there's none).
  const [focus, setFocus] = useState<string | null>(selectedLeague);
  const [hover, setHover] = useState<string | null>(null);
  // Crest under the pointer (or focused): its name and city show above it.
  const [hoverClub, setHoverClub] = useState<string | null>(null);
  // A club hovered in the teams sidebar shows hovered here too.
  const sidebarHover = useHoveredTeam();
  const shownHover = hoverClub ?? sidebarHover;
  const [clubs, setClubs] = useState<Clubs>(() =>
    selectedLeague ? { [selectedLeague]: "loading" } : {},
  );
  const [, startNavigation] = useTransition();

  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  // The view mid-flight; otherwise the view is the opened country's (or the overview's) fit.
  const [anim, setAnim] = useState<View | null>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // Phones get a square map (countries need the height); wider screens the world map's
  // proportions. Views are fitted to whichever shape is showing.
  const aspect = boxWidth && boxWidth < 640 ? 1 : mapHeight / mapWidth;
  const viewH = mapWidth * aspect;
  const fit = (b: MapBox, margin: number): View => {
    const k = Math.min(mapWidth / (b.x1 - b.x0), viewH / (b.y1 - b.y0)) * (1 - margin);
    return { k, tx: mapWidth / 2 - ((b.x0 + b.x1) / 2) * k, ty: viewH / 2 - ((b.y0 + b.y1) / 2) * k };
  };
  // The overview, widened to take in the nationality selected in the squad panel when it
  // lies outside (Norway, Greece…) but within the drawn area. Applied once the flight
  // there lands, so the view doesn't jump.
  const [extra, setExtra] = useState<MapBox | null>(null);
  const nationality = useSelectedNationality();
  const extraFor = (n: typeof nationality): MapBox | null => {
    if (!n) return null;
    const pad = 14; // map units around the flag
    const inside = (b: MapBox) => n.x > b.x0 && n.x < b.x1 && n.y > b.y0 && n.y < b.y1;
    return !inside(overview) && inside(area)
      ? { x0: n.x - pad, y0: n.y - pad, x1: n.x + pad, y1: n.y + pad }
      : null;
  };
  const overviewBox = (e: MapBox | null): MapBox =>
    e
      ? {
          x0: Math.min(overview.x0, e.x0),
          y0: Math.min(overview.y0, e.y0),
          x1: Math.max(overview.x1, e.x1),
          y1: Math.max(overview.y1, e.y1),
        }
      : overview;
  const viewOf = (slug: string | null, e = extra) => {
    const league = leagues.find((l) => l.slug === slug);
    return league ? fit(league.box, 0.08) : fit(overviewBox(e), 0.03);
  };
  const view = anim ?? viewOf(focus);

  /** Flies from the current view to another along a smooth zoom path, like the nationalities map. */
  const flyTo = (to: View, onLand?: () => void) => {
    cancelAnimationFrame(animRef.current);
    const from = view;
    const windowOf = (v: View): [number, number, number] => [
      (mapWidth / 2 - v.tx) / v.k,
      (viewH / 2 - v.ty) / v.k,
      mapWidth / v.k,
    ];
    const path = interpolateZoom(windowOf(from), windowOf(to));
    const duration = Math.min(1100, Math.max(500, path.duration * 0.7));
    // Timed from the first frame's timestamp.
    let t0: number | null = null;
    const step = (now: number) => {
      t0 ??= now;
      const p = Math.min(1, (now - t0) / duration);
      const [cx, cy, w] = path(ease(p));
      const k = mapWidth / w;
      if (p < 1) {
        setAnim({ k, tx: mapWidth / 2 - cx * k, ty: viewH / 2 - cy * k });
        animRef.current = requestAnimationFrame(step);
      } else {
        onLand?.();
        setAnim(null);
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  // Clubs load for the selected team's league straight away, and for others on hover
  // (so they're usually in by the time the zoom lands) or on click.
  const requested = useRef(new Set<string>());
  const fetchClubs = (slug: string) => {
    fetch(`/api/league-clubs?league=${encodeURIComponent(slug)}&lang=${t.locale}&v=2`)
      .then((res) => (res.ok ? (res.json() as Promise<ClubSpot[]>) : Promise.reject()))
      .then((list) => setClubs((cur) => ({ ...cur, [slug]: list })))
      .catch(() => {
        requested.current.delete(slug); // try again next time
        setClubs((cur) => ({ ...cur, [slug]: "error" }));
      });
  };
  const loadClubs = (slug: string) => {
    if (requested.current.has(slug)) return;
    requested.current.add(slug);
    setClubs((cur) => ({ ...cur, [slug]: "loading" }));
    fetchClubs(slug);
  };
  // The selected league's clubs: loaded on arrival, and whenever the league in the URL changes.
  const loadSelectedClubs = useEffectEvent((slug: string) => {
    if (requested.current.has(slug)) return;
    requested.current.add(slug);
    fetchClubs(slug); // its "loading" state is set as the league is shown, below
  });
  useEffect(() => {
    if (selectedLeague) loadSelectedClubs(selectedLeague);
  }, [selectedLeague]);
  // Picking a club (a crest here, the teams column, the dropdown) collapses the map, so
  // the club's content comes up the page.
  const [shownTeam, setShownTeam] = useState(selectedTeam);
  if (selectedTeam !== shownTeam) {
    setShownTeam(selectedTeam);
    if (selectedTeam) setOpen(false);
  }

  // A new league in the URL (a crest picked elsewhere, or the header's picker) opens it;
  // no league (the logo, "All leagues") shows every league country.
  const [shownLeague, setShownLeague] = useState(selectedLeague);
  if (selectedLeague !== shownLeague) {
    setShownLeague(selectedLeague);
    setFocus(selectedLeague);
    if (selectedLeague && !clubs[selectedLeague]) {
      setClubs((cur) => ({ ...cur, [selectedLeague]: "loading" }));
    }
  }
  const hoverLeague = (slug: string | null) => {
    setHover(slug);
    if (slug) loadClubs(slug);
  };

  // Set when the view changed because a nationality was selected in the squad panel, so
  // clearing that selection goes back to the team's league (views chosen by hand stay).
  const changedForNationality = useRef(false);
  const openLeague = (slug: string, byHand = true) => {
    const league = leagues.find((l) => l.slug === slug);
    if (!league) return;
    if (byHand) {
      changedForNationality.current = false;
      // Picking a league here selects it, as the header's picker does (its team, if
      // any, belonged to the previous league).
      if (slug !== selectedLeague) {
        startNavigation(() => router.replace(`/?league=${league.urlSlug}`, { scroll: false }));
      }
    }
    setFocus(slug);
    setHover(null);
    flyTo(viewOf(slug));
    loadClubs(slug);
  };
  // "All leagues": fly out and clear the selected league and team.
  const showAll = () => {
    changedForNationality.current = false;
    setFocus(null);
    flyTo(viewOf(null));
    if (selectedLeague) startNavigation(() => router.replace("/", { scroll: false }));
  };

  // A newly selected nationality: a league country opens (zoomed in, with its clubs and
  // the current club's crest marked); another country shows in the overview, widened to
  // take it in. Clearing it goes back to the team's league. All smoothly.
  const followNationality = useEffectEvent((n: typeof nationality) => {
    if (n) {
      changedForNationality.current = true;
      const league = leagues.find((l) => l.countryKey === n.key);
      if (league) {
        setExtra(null);
        openLeague(league.slug, false);
        return;
      }
      const next = extraFor(n);
      setFocus(null);
      flyTo(viewOf(null, next), () => setExtra(next));
      return;
    }
    if (!changedForNationality.current) return;
    changedForNationality.current = false;
    if (selectedLeague) {
      setExtra(null);
      openLeague(selectedLeague, false);
    } else {
      setFocus(null);
      flyTo(viewOf(null, null), () => setExtra(null));
    }
  });
  useEffect(() => onSelectedNationalityChange((n) => followNationality(n)), []);

  // After a club is picked (anywhere) and the map has collapsed (CollapsiblePanel's
  // 300ms): on phones, scroll down to the clubs dropdown; on desktop, to the top.
  const scrollToClub = () =>
    setTimeout(() => {
      if (window.matchMedia("(max-width: 1023.98px)").matches) {
        document.getElementById("teams-bar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 320);
  const firstTeam = useRef(true);
  useEffect(() => {
    if (firstTeam.current) {
      firstTeam.current = false; // not on arrival, only when a club is picked
      return;
    }
    if (selectedTeam) scrollToClub();
  }, [selectedTeam]);

  const goToClub = (league: LeagueSpot, club: ClubSpot) => {
    setOpen(false);
    if (club.urlSlug === selectedTeam && league.slug === selectedLeague) {
      scrollToClub(); // already selected: nothing changes in the URL, so scroll here
      return;
    }
    startNavigation(() =>
      router.replace(`/?league=${league.urlSlug}&team=${club.urlSlug}`, { scroll: false }),
    );
  };

  const scale = boxWidth ? boxWidth / mapWidth : 0;
  const boxHeight = boxWidth ? boxWidth * aspect : 0;
  const toScreen = (x: number, y: number) => ({
    x: (x * view.k + view.tx) * scale,
    y: (y * view.k + view.ty) * scale,
  });
  const project = (lat: number, lon: number) => {
    const lambda = (lon * Math.PI) / 180;
    const phi = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
    return toScreen(
      projection.tx + projection.scale * lambda,
      projection.ty - projection.scale * Math.log(Math.tan(Math.PI / 4 + phi / 2)),
    );
  };

  const leagueByKey = new Map(leagues.flatMap((l) => (l.countryKey ? [[l.countryKey, l]] : [])));
  const focused = leagues.find((l) => l.slug === focus) ?? null;
  const hovered = leagues.find((l) => l.slug === hover) ?? null;
  // Hovered or opened countries get the strong tint, like a selection on the nationalities
  // map, and so does the nationality selected in the squad panel.
  const strongKeys = new Set(
    [focused?.countryKey, hovered?.countryKey, nationality?.key].filter(Boolean),
  );
  const selectedKey = leagues.find((l) => l.slug === selectedLeague)?.countryKey ?? null;

  // Club crests, nudged apart where clubs share a city (seven in London, two at San Siro).
  const clubList = focus && Array.isArray(clubs[focus]) ? (clubs[focus] as ClubSpot[]) : [];
  const crestR = boxWidth && boxWidth < 640 ? 11 : 15;
  const placed =
    boxWidth && focused
      ? placeMarkers(
          clubList.map((c) => {
            const p = project(c.lat, c.lon);
            return { marker: c, ax: p.x, ay: p.y };
          }),
          boxWidth,
          boxHeight,
          crestR,
        )
      : [];

  return (
    // Header in the brand blues, matching "World" in the page title.
    <section aria-label={t.leaguesMap} className="brand-theme border-b border-border">
      <SectionBar
        open={open}
        onToggle={() => setOpen((o) => !o)}
        controls={panelId}
        title={t.leaguesMap}
        badge={t.leaguesCount(leagues.length)}
        icon={
          <svg
            viewBox="0 0 20 20"
            className="h-[0.95rem] w-[0.95rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          >
            <path d="M2.5 5.5 7.5 3l5 2.5 5-2.5v11.5l-5 2.5-5-2.5-5 2.5V5.5Z" />
            <path d="M7.5 3v11.5M12.5 5.5V17" />
          </svg>
        }
        status={<p>{focused ? t.leaguesMapClubsHint : t.leaguesMapHint}</p>}
      />
      <CollapsiblePanel id={panelId} open={open}>
        <div className="border-t border-border px-4 py-3 sm:px-6">
          {/* Above the map (not over it), so it never covers crests: back to all leagues
              and the league in view, or a hint in the overview. */}
          <div className="mb-2 flex min-h-8 items-center gap-2">
            {focused ? (
              <>
                <button
                  type="button"
                  onClick={showAll}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                    <path
                      d="M12.5 5 7.5 10l5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t.allLeagues}
                </button>
                <span className="flex items-center gap-1.5 rounded-lg bg-header px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm">
                  {focused.logo && (
                    <Image src={focused.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                  )}
                  {focused.name}
                </span>
                {clubs[focused.slug] === "loading" && (
                  <span
                    aria-label={t.loadingClubs}
                    className="h-4 w-4 animate-spin rounded-full border-2 border-text/20 border-t-text"
                  />
                )}
              </>
            ) : (
              <span className="text-xs text-muted">{t.leaguesMapHint}</span>
            )}
          </div>
          <div
            ref={boxRef}
            // `isolate`: the badges and crests stack within the map, so the teams
            // column, widening over the page on hover, stays on top of them.
            className="relative isolate w-full overflow-hidden rounded-lg bg-map-sea select-none"
            style={{ aspectRatio: `${mapWidth} / ${viewH}` }}
          >
            <svg
              viewBox={`0 0 ${mapWidth} ${viewH}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
                {countries.map((c) => {
                  // League countries respond to hover (highlighted like a selection) and click.
                  const league = leagueByKey.get(c.key);
                  const strong = strongKeys.has(c.key);
                  return (
                    <path
                      key={c.key}
                      d={c.d}
                      stroke="var(--map-border)"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                      className={`transition-[fill] duration-150 ${league ? "cursor-pointer" : ""}`}
                      onPointerEnter={
                        league
                          ? (e) => e.pointerType === "mouse" && hoverLeague(league.slug)
                          : undefined
                      }
                      onPointerLeave={league ? () => setHover(null) : undefined}
                      onClick={league ? () => openLeague(league.slug) : undefined}
                      style={{
                        fill: strong
                          ? "color-mix(in oklab, var(--accent) 75%, var(--map-land))"
                          : league
                            ? `color-mix(in oklab, var(--accent) ${c.key === selectedKey ? 45 : 30}%, var(--map-land))`
                            : "var(--map-land)",
                      }}
                    />
                  );
                })}
              </g>
            </svg>

            {/* League logos over their countries (the overview). */}
            {boxWidth &&
              !focused &&
              leagues.map((l) => {
                const p = toScreen(l.x, l.y);
                const isHover = hover === l.slug;
                return (
                  <button
                    key={l.slug}
                    type="button"
                    aria-label={t.openLeagueOnMap(l.name)}
                    title={l.name}
                    onClick={() => openLeague(l.slug)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && hoverLeague(l.slug)}
                    onPointerLeave={() => setHover(null)}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-header p-1.5 shadow-lg ring-2 transition-[scale,box-shadow] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      isHover || l.slug === selectedLeague
                        ? "z-20 scale-115 ring-accent"
                        : "z-10 ring-white/70 hover:scale-115"
                    }`}
                    style={{ left: p.x, top: p.y }}
                  >
                    {l.logo ? (
                      <Image
                        src={l.logo}
                        alt=""
                        width={32}
                        height={32}
                        className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                      />
                    ) : (
                      <span className="px-1 text-[11px] font-bold text-white">{l.name}</span>
                    )}
                    {/* The country's flag, a small rectangle under the logo. */}
                    {l.flag && (
                      <Image
                        src={l.flag}
                        alt=""
                        width={24}
                        height={16}
                        unoptimized
                        className="h-3 w-[1.125rem] rounded-[2px] object-cover ring-1 ring-white/30 sm:h-4 sm:w-6"
                      />
                    )}
                  </button>
                );
              })}

            {/* The hovered league's name above its logo. */}
            {boxWidth &&
              !focused &&
              (() => {
                const l = leagues.find((x) => x.slug === hover);
                if (!l) return null;
                const p = toScreen(l.x, l.y);
                const half = boxWidth < 640 ? 25 : 34; // logo-and-flag badge half-height, enlarged
                return (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-md bg-text px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-surface shadow-md"
                    style={{ left: p.x, top: p.y - half - 4 }}
                  >
                    {l.name}
                  </span>
                );
              })()}

            {/* The open league's logo and country flag, top left over the map. */}
            {focused && (
              <div className="pointer-events-none absolute top-2 left-2 z-40 flex items-center gap-2 rounded-xl bg-header/90 p-1.5 pr-2.5 shadow-lg ring-1 ring-white/20 backdrop-blur-sm sm:top-3 sm:left-3 sm:gap-2.5 sm:p-2 sm:pr-3">
                {focused.logo && (
                  <Image
                    src={focused.logo}
                    alt={focused.name}
                    width={40}
                    height={40}
                    className="h-7 w-7 object-contain sm:h-10 sm:w-10"
                  />
                )}
                {focused.flag && (
                  <Image
                    src={focused.flag}
                    alt=""
                    width={36}
                    height={24}
                    unoptimized
                    className="h-4 w-6 rounded-[3px] object-cover ring-1 ring-white/30 sm:h-6 sm:w-9"
                  />
                )}
              </div>
            )}

            {/* Leader lines from nudged crests back to their stadiums. */}
            {boxWidth && placed.length > 0 && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                {placed.map((p) =>
                  Math.hypot(p.x - p.ax, p.y - p.ay) > crestR * 0.6 ? (
                    <g key={p.marker.id} className="text-text">
                      <line
                        x1={p.ax}
                        y1={p.ay}
                        x2={p.x}
                        y2={p.y}
                        stroke="currentColor"
                        strokeOpacity="0.45"
                        strokeWidth="1"
                      />
                      <circle cx={p.ax} cy={p.ay} r="2" fill="currentColor" fillOpacity="0.6" />
                    </g>
                  ) : null,
                )}
              </svg>
            )}

            {/* Club crests at their stadiums; clicking one selects the club. */}
            {focused &&
              placed.map((p) => {
                const club = p.marker;
                const isSelected = club.urlSlug === selectedTeam && focused.slug === selectedLeague;
                return (
                  <button
                    key={club.id}
                    type="button"
                    aria-label={t.goToClub(club.name)}
                    title={club.name}
                    onClick={() => goToClub(focused, club)}
                    onPointerEnter={() => setHoverClub(club.id)}
                    onPointerLeave={() => setHoverClub((id) => (id === club.id ? null : id))}
                    onFocus={() => setHoverClub(club.id)}
                    onBlur={() => setHoverClub((id) => (id === club.id ? null : id))}
                    className={`crest-in absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white shadow-md transition-[scale,box-shadow] duration-150 outline-none hover:z-30 hover:scale-150 focus-visible:z-30 focus-visible:scale-150 focus-visible:outline-2 focus-visible:outline-accent ${
                      club.id === sidebarHover ? "z-30 scale-150" : ""
                    } ${
                      isSelected
                        ? `ring-[3px] ring-accent ${club.id === sidebarHover ? "" : "z-20 scale-125"}`
                        : `ring-1 ring-black/15 ${club.id === sidebarHover ? "" : "z-10"}`
                    }`}
                    style={{ left: p.x, top: p.y, width: crestR * 2, height: crestR * 2 }}
                  >
                    {club.logo && (
                      <Image
                        src={club.logo}
                        alt=""
                        width={crestR * 2}
                        height={crestR * 2}
                        className="h-[78%] w-[78%] object-contain"
                      />
                    )}
                  </button>
                );
              })}

            {/* Name and city above the hovered crest (drawn apart so it isn't scaled up). */}
            {(() => {
              const p = placed.find((x) => x.marker.id === shownHover);
              if (!p) return null;
              return (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full rounded-md bg-text px-2 py-1 text-center whitespace-nowrap text-surface shadow-md"
                  style={{ left: p.x, top: p.y - crestR * 1.5 - 6 }}
                >
                  <span className="block text-xs leading-tight font-semibold">{p.marker.name}</span>
                  {p.marker.city && (
                    <span className="block text-[11px] leading-tight opacity-75">{p.marker.city}</span>
                  )}
                </span>
              );
            })()}
          </div>
        </div>
      </CollapsiblePanel>
    </section>
  );
}
