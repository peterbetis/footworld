import "server-only";

export type Position = "G" | "D" | "M" | "F";

export interface Player {
  id: string;
  name: string;
  /** Name as printed on the back of the shirt. */
  shirtName: string;
  number: number | null;
  position: Position;
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
    position?: { abbreviation?: string };
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
export async function getSquad(leagueSlug: string, teamId: string): Promise<Squad> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams/${encodeURIComponent(teamId)}/roster`,
    { next: { revalidate: 3_600 } }, // squads change with transfers and new signings
  );
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
