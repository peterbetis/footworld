import { getKit } from "@/lib/kits";
import { getSquad, type Squad as SquadData } from "@/lib/players";
import { getTeams } from "@/lib/teams";
import { getWorldMap, locateCountry } from "@/lib/worldMap";
import type { CountryMarker } from "./NationalityMap";
import SquadBoard from "./SquadBoard";
import TeamLogo from "./TeamLogo";

export default async function Squad({
  leagueSlug,
  teamId,
}: {
  leagueSlug: string;
  teamId: string;
}) {
  let squad: SquadData;
  try {
    squad = await getSquad(leagueSlug, teamId);
  } catch (err) {
    console.error(err);
    return (
      <p className="px-6 py-16 text-center text-sm text-muted">
        Couldn&apos;t load this squad right now. Try again shortly.
      </p>
    );
  }

  // Cached alongside the teams list, so this doesn't refetch.
  const team = (await getTeams(leagueSlug).catch(() => [])).find((t) => t.id === teamId);
  const kit = getKit(teamId, squad.teamColor);

  // One map marker per nationality, pinned on that country.
  const byCountry = new Map<string, CountryMarker>();
  for (const p of squad.players) {
    if (!p.nationality) continue;
    const existing = byCountry.get(p.nationality.country);
    if (existing) {
      existing.count++;
      continue;
    }
    const point = locateCountry(p.nationality.country);
    if (!point) continue;
    byCountry.set(p.nationality.country, {
      country: p.nationality.country,
      flag: p.nationality.flag,
      count: 1,
      ...point,
    });
  }
  const markers = [...byCountry.values()].sort((a, b) => b.count - a.count);

  return (
    <section aria-label={`${squad.teamName} squad`}>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        {team && <TeamLogo team={team} size={40} />}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{squad.teamName}</h2>
          <p className="text-xs text-muted">
            {squad.season && `${squad.season} squad · `}
            {squad.players.length} players
          </p>
        </div>
      </header>

      <SquadBoard players={squad.players} kit={kit} map={getWorldMap()} markers={markers} />
    </section>
  );
}

export function SquadSkeleton() {
  return (
    <div aria-busy aria-label="Loading squad">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="h-10 w-10 animate-pulse rounded-full bg-border" />
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-border" />
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 py-5 sm:grid-cols-4 sm:px-6 md:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-bg" />
        ))}
      </div>
    </div>
  );
}
