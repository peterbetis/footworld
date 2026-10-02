import "server-only";

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  /** Logo variant for dark backgrounds. */
  logoDark: string;
}

interface EspnTeamsResponse {
  sports?: {
    leagues?: {
      teams?: {
        team: {
          id: string;
          displayName: string;
          abbreviation: string;
          logos?: { href: string; rel?: string[] }[];
        };
      }[];
    }[];
  }[];
}

// ESPN's public (unofficial, keyless) sports API.
export async function getTeams(leagueSlug: string): Promise<Team[]> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams`,
    { next: { revalidate: 21_600 } }, // squads per league change only between seasons
  );
  if (!res.ok) throw new Error(`ESPN teams ${res.status} for ${leagueSlug}`);
  const data: EspnTeamsResponse = await res.json();
  const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];

  return teams
    .map(({ team }) => {
      const logos = team.logos ?? [];
      const logo = logos.find((l) => l.rel?.includes("default"))?.href ?? logos[0]?.href ?? "";
      return {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        logo,
        logoDark: logos.find((l) => l.rel?.includes("dark"))?.href ?? logo,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
