import { getClubInfo } from "@/lib/clubInfo";
import { getFormation } from "@/lib/formation";
import { getMessages, type Locale } from "@/lib/i18n";
import { getKitSet } from "@/lib/kits";
import { getLeagues } from "@/lib/leagues";
import { getManager } from "@/lib/manager";
import { getSquad, type Squad as SquadData } from "@/lib/players";
import { getTeams } from "@/lib/teams";
import { getWikiKits } from "@/lib/wikiKits";
import { getWorldMap, locateCountry } from "@/lib/worldMap";
import type { CountryMarker } from "./NationalityMap";
import SquadBoard from "./SquadBoard";
import TeamLogo from "./TeamLogo";

export default async function Squad({
  leagueSlug,
  teamId,
  locale,
}: {
  leagueSlug: string;
  teamId: string;
  locale: Locale;
}) {
  const t = getMessages(locale);
  let squad: SquadData;
  try {
    squad = await getSquad(leagueSlug, teamId, locale);
  } catch (err) {
    console.error(err);
    return <p className="px-6 py-16 text-center text-sm text-muted">{t.squadLoadError}</p>;
  }

  // Cached alongside the teams list, so this doesn't refetch.
  const team = (await getTeams(leagueSlug).catch(() => [])).find((x) => x.id === teamId);
  // Cached too; for the league badge on the player modal.
  const league = (await getLeagues().catch(() => [])).find((l) => l.slug === leagueSlug);
  // Also streamed: the club panel (Wikidata, ESPN's last-season table, the country map).
  const clubInfo = getClubInfo({
    teamId,
    leagueSlug,
    leagueCountry: league?.country ?? "",
    season: squad.season,
    locale,
  }).catch((err) => {
    console.error(err);
    return null;
  });
  const kits = getKitSet(teamId, squad.teamColor);
  // Also streamed: the current manager (Wikipedia/Wikidata).
  const manager = getManager(teamId, locale).catch((err) => {
    console.error(err);
    return null;
  });
  // Also streamed: current-season kit images from Wikipedia (drawn kits if unavailable).
  const wikiKits = getWikiKits(teamId).catch((err) => {
    console.error(err);
    return null;
  });
  // Not awaited: the pitch streams in after the squad, as its analysis reads
  // several match summaries.
  const formation = getFormation(leagueSlug, teamId, squad.players).catch((err) => {
    console.error(err);
    return null;
  });

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
      name: p.nationality.name,
      flag: p.nationality.flag,
      count: 1,
      ...point,
    });
  }
  const markers = [...byCountry.values()].sort((a, b) => b.count - a.count);

  return (
    <section aria-label={`${squad.teamName} — ${t.squad}`}>
      <SquadBoard
        crest={team && <TeamLogo team={team} size={60} eager />}
        heading={
          <>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{squad.teamName}</h2>
              <p className="text-xs opacity-80">
                {squad.season && `${t.seasonSquad(squad.season)} · `}
                {t.players(squad.players.length)}
              </p>
            </div>
          </>
        }
        players={squad.players}
        kits={kits}
        team={team}
        league={league && { name: league.name, logo: league.logo }}
        teamName={squad.teamName}
        map={getWorldMap()}
        markers={markers}
        formation={formation}
        wikiKits={wikiKits}
        manager={manager}
        clubInfo={clubInfo}
        season={squad.season}
      />
    </section>
  );
}

export function SquadSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label}>
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
