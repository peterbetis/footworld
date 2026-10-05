import "server-only";
import type { Locale } from "./i18n";

export type Position = "G" | "D" | "M" | "F";

export interface Player {
  id: string;
  name: string;
  /** Name as printed on the back of the shirt. */
  shirtName: string;
  number: number | null;
  position: Position;
  /** YYYY-MM-DD; tells the player apart from namesakes when looking up their profile. */
  birthDate: string | null;
  /** From ESPN's whole inches, so it can be a centimetre or two out. */
  heightCm: number | null;
  /**
   * `country` is ESPN's English name, used as the key (and to place it on the map);
   * `name` is the same country in the page's language, for display.
   */
  nationality: { country: string; name: string; flag: string } | null;
}

export interface Squad {
  teamId: string;
  teamName: string;
  /** ESPN's team colour (hex, no #), used when there's no kit definition. */
  teamColor: string;
  season: string;
  players: Player[];
}

interface EspnRoster {
  season?: { displayName?: string };
  team?: { id: string; displayName: string; color?: string };
  athletes?: {
    id: string;
    displayName: string;
    lastName?: string;
    jersey?: string;
    dateOfBirth?: string;
    height?: number;
    position?: { abbreviation?: string };
    citizenship?: string;
    flag?: { href?: string; alt?: string };
  }[];
}

const POSITIONS: Position[] = ["G", "D", "M", "F"];

function toPosition(abbr: string | undefined): Position {
  return POSITIONS.includes(abbr as Position) ? (abbr as Position) : "M";
}

// Single-name players (Pedri, Gavi) have no last name; everyone else wears their surname.
function toShirtName(displayName: string, lastName: string | undefined) {
  return (lastName?.trim() || displayName).toUpperCase();
}

// ESPN's public (unofficial, keyless) sports API — current-season roster with squad numbers.
function rosterUrl(leagueSlug: string, teamId: string, locale: Locale) {
  const base = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams/${encodeURIComponent(teamId)}/roster`;
  return locale === "en" ? base : `${base}?lang=${locale}&region=${locale}`;
}

// Country names in the page's language, by player id. ESPN localises them when
// asked; the English roster stays the source of truth for everything else.
async function localizedCountries(leagueSlug: string, teamId: string, locale: Locale) {
  if (locale === "en") return new Map<string, string>();
  try {
    const res = await fetch(rosterUrl(leagueSlug, teamId, locale), { next: { revalidate: 3_600 } });
    if (!res.ok) return new Map<string, string>();
    const data: EspnRoster = await res.json();
    return new Map(
      (data.athletes ?? []).flatMap((a) => (a.flag?.alt ? [[a.id, a.flag.alt] as const] : [])),
    );
  } catch {
    return new Map<string, string>();
  }
}

export async function getSquad(
  leagueSlug: string,
  teamId: string,
  locale: Locale = "en",
): Promise<Squad> {
  const [res, names] = await Promise.all([
    fetch(rosterUrl(leagueSlug, teamId, "en"), {
      next: { revalidate: 3_600 }, // squads change with transfers and new signings
    }),
    localizedCountries(leagueSlug, teamId, locale),
  ]);
  if (!res.ok) throw new Error(`ESPN roster ${res.status} for ${leagueSlug}/${teamId}`);
  const data: EspnRoster = await res.json();

  const players = (data.athletes ?? [])
    .map((a) => {
      const n = Number.parseInt(a.jersey ?? "", 10);
      return {
        id: a.id,
        name: a.displayName,
        shirtName: toShirtName(a.displayName, a.lastName),
        number: Number.isFinite(n) ? n : null,
        position: toPosition(a.position?.abbreviation),
        birthDate: a.dateOfBirth?.slice(0, 10) ?? null,
        heightCm: a.height ? Math.round(a.height * 2.54) : null,
        nationality: a.flag?.href
          ? (() => {
              const country = a.flag.alt ?? a.citizenship ?? "";
              return { country, name: names.get(a.id) ?? country, flag: a.flag.href };
            })()
          : null,
      };
    })
    // By squad number; players without one go last.
    .sort((a, b) => (a.number ?? 999) - (b.number ?? 999));

  return {
    teamId,
    teamName: data.team?.displayName ?? "",
    teamColor: data.team?.color ?? "1f2937",
    season: data.season?.displayName?.match(/\d{4}-\d{2}/)?.[0] ?? "",
    players,
  };
}
