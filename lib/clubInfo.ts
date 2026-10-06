import "server-only";
import { countryMap, type CountryMap } from "./countryMap";
import type { Locale } from "./i18n";
import { plainText } from "./playerProfile";
import { claimIds, claimValues, getEntities, label } from "./wikidata";
import { commonsThumb, getClubArticle, wikidataSparql, wikipediaApi } from "./wikipedia";

/** The club panel: identity, stadium, honours and last season, with a map of the country. */
export interface ClubInfo {
  fullName: string | null;
  /** Where the club is based (headquarters, else the stadium's locality). */
  city: string | null;
  founded: number | null;
  stadium: {
    name: string;
    capacity: number | null;
    /** Wikimedia Commons photo, 960px wide. */
    photo: string | null;
  } | null;
  /** From Wikidata's season records; null if the query failed. */
  titles: { league: number; europeanCups: number } | null;
  /** Final position in last season's league table (ESPN); null if not in the league then. */
  lastSeason: { season: string; position: number | null } | null;
  map: CountryMap | null;
}

// Each league's Wikidata item, by ESPN slug: league titles are counted in it and
// the competitions it replaced (the Premier League's First Division, and so on).
const TOP_FLIGHT: Record<string, string> = {
  "esp.1": "Q324867", // La Liga
  "eng.1": "Q9448", // Premier League
  "ita.1": "Q15804", // Serie A
  "ger.1": "Q82595", // Bundesliga
  "fra.1": "Q13394", // Ligue 1
  "por.1": "Q182994", // Primeira Liga
  "ned.1": "Q167541", // Eredivisie
};

/** Top-flight league titles and European Cups, from Wikidata's season records. */
async function getTitles(qid: string, leagueSlug: string) {
  const league = TOP_FLIGHT[leagueSlug];
  if (!league) return null;
  // Winners are sometimes the club's men's-team item, "part of" the club (Bayern 2020–25).
  const rows = await wikidataSparql(`
    SELECT ?kind (COUNT(DISTINCT ?s) AS ?n) WHERE {
      {
        wd:${league} (wdt:P1365|wdt:P155)* ?competition .
        BIND("league" AS ?kind)
      } UNION {
        VALUES ?competition { wd:Q18756 wd:Q1069470 }
        BIND("europe" AS ?kind)
      }
      ?s wdt:P3450 ?competition ; wdt:P1346 ?winner .
      ?winner (wdt:P361|wdt:P749)? wd:${qid} .
    } GROUP BY ?kind`);
  const count = (kind: string) => Number(rows.find((r) => r.kind?.value === kind)?.n.value ?? 0);
  return { league: count("league"), europeanCups: count("europe") };
}

/** Final league position last season, from ESPN's standings (season = its start year). */
async function getLastSeason(leagueSlug: string, teamId: string, currentSeason: string) {
  const startYear = Number.parseInt(currentSeason.slice(0, 4), 10);
  if (!Number.isFinite(startYear)) return null;
  const year = startYear - 1;
  const res = await fetch(
    `https://site.api.espn.com/apis/v2/sports/soccer/${leagueSlug}/standings?season=${year}`,
    { next: { revalidate: 86_400 } }, // a finished season's table doesn't change
  );
  if (!res.ok) return null;
  const data: {
    children?: {
      standings?: {
        entries?: { team: { id: string }; stats: { name: string; value?: number }[] }[];
      };
    }[];
  } = await res.json();
  const entries = data.children?.[0]?.standings?.entries ?? [];
  if (entries.length === 0) return null;
  const entry = entries.find((e) => String(e.team.id) === teamId);
  const rank = entry?.stats.find((s) => s.name === "rank")?.value;
  return { season: `${year}-${String(year + 1).slice(2)}`, position: rank ?? null };
}

export async function getClubInfo({
  teamId,
  leagueSlug,
  leagueCountry,
  season,
  locale,
}: {
  teamId: string;
  leagueSlug: string;
  /** The league's country, whose map is drawn ("England", "Spain", …). */
  leagueCountry: string;
  /** Current season, e.g. "2026-27". */
  season: string;
  locale: Locale;
}): Promise<ClubInfo | null> {
  const lastSeason = getLastSeason(leagueSlug, teamId, season).catch(() => null);
  const club = await getClubArticle(teamId);
  if (!club) {
    return {
      fullName: null,
      city: null,
      founded: null,
      stadium: null,
      titles: null,
      lastSeason: await lastSeason,
      map: countryMap(leagueCountry, null),
    };
  }

  const page = await wikipediaApi({
    action: "query",
    prop: "pageprops",
    ppprop: "wikibase_item",
    redirects: "1",
    titles: club.title,
  });
  const qid: string | undefined = page?.query?.pages?.[0]?.pageprops?.wikibase_item;
  const entity = qid ? (await getEntities([qid], "labels|claims", locale))[qid] : undefined;

  // Full name: the infobox's "fullname" (English), else the official name, else the label.
  const text = club.wikitext.replace(/<!--[\s\S]*?-->/g, "");
  const infoboxName = text.match(/\|\s*full_?name\s*=\s*([^\n]*)/)?.[1];
  const official = (claimValues(entity, "P1448")[0] as { text?: string } | undefined)?.text;
  const fullName = (infoboxName && plainText(infoboxName)) ?? official ?? label(entity, locale);

  const inception = (claimValues(entity, "P571")[0] as { time?: string } | undefined)?.time;
  const founded = inception ? Number.parseInt(inception.slice(1, 5), 10) : null;

  // Home ground (current one) and, for the pin, its coordinates or else the club's base.
  const stadiumId = claimIds(entity, "P115")[0];
  const baseId = claimIds(entity, "P159")[0];
  const places = await getEntities([stadiumId, baseId].filter(Boolean), "labels|claims", locale);
  const stadiumEntity = stadiumId ? places[stadiumId] : undefined;
  const coordsOf = (id: string | undefined) => {
    const c = id ? (claimValues(places[id], "P625")[0] as { latitude?: number; longitude?: number } | undefined) : undefined;
    return c?.latitude !== undefined && c.longitude !== undefined
      ? { lat: c.latitude, lon: c.longitude }
      : null;
  };
  const capacity = Number(
    (claimValues(stadiumEntity, "P1083")[0] as { amount?: string } | undefined)?.amount,
  );
  const photoFile = claimValues(stadiumEntity, "P18").find((v): v is string => typeof v === "string");
  const stadiumName = label(stadiumEntity, locale);
  const stadiumCityId = claimIds(stadiumEntity, "P131")[0];
  // Administrative names read as plain city names: "Commune of Monaco" → "Monaco".
  const plainCity = (name: string | null) =>
    name?.replace(/^(Commune|Municipality|City|Comuna|Municipio|Ciudad) (of|de) /i, "") ?? null;
  const city = plainCity(
    label(baseId ? places[baseId] : undefined, locale) ??
    (stadiumCityId
      ? label((await getEntities([stadiumCityId], "labels", locale))[stadiumCityId], locale)
      : null),
  );

  const [titles, last] = await Promise.all([
    qid ? getTitles(qid, leagueSlug).catch(() => null) : null,
    lastSeason,
  ]);

  return {
    fullName,
    city,
    founded: Number.isFinite(founded) ? founded : null,
    stadium: stadiumName
      ? {
          name: stadiumName,
          capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
          photo: photoFile ? commonsThumb(photoFile, 960) : null,
        }
      : null,
    titles,
    lastSeason: last,
    map: countryMap(leagueCountry, coordsOf(stadiumId) ?? coordsOf(baseId)),
  };
}
