import "server-only";
import { getTeams } from "./teams";
import type { Locale } from "./i18n";
import { claimIds, claimValues, getEntities, label } from "./wikidata";
import { clubArticleTitle, wikipediaApi } from "./wikipedia";

/** A club placed on the leagues map at its stadium (or, failing that, its base). */
export interface ClubSpot {
  id: string;
  urlSlug: string;
  name: string;
  logo: string;
  /** Where the club is based (headquarters, else the stadium's town), in the page's language. */
  city: string | null;
  lat: number;
  lon: number;
}

const coords = (v: unknown) => {
  const c = v as { latitude?: number; longitude?: number } | undefined;
  return c?.latitude !== undefined && c.longitude !== undefined
    ? { lat: c.latitude, lon: c.longitude }
    : null;
};

// Finished lookups, kept in memory for a day: stadiums don't move, and this saves
// four upstream round trips (and Wikimedia's rate limits) on every map click.
const DAY_MS = 86_400_000;
const memo = new Map<string, { at: number; clubs: Promise<ClubSpot[]> }>();

/**
 * Every club in a league with its stadium's coordinates, from Wikidata (via each
 * club's Wikipedia article): three batched requests per league, cached for a day.
 */
export function getLeagueClubs(leagueSlug: string, locale: Locale): Promise<ClubSpot[]> {
  const key = `${leagueSlug}:${locale}`;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < DAY_MS) return hit.clubs;
  const clubs = lookUpLeagueClubs(leagueSlug, locale);
  memo.set(key, { at: Date.now(), clubs });
  // A failed lookup isn't kept, so the next request tries again.
  clubs.catch(() => memo.delete(key));
  return clubs;
}

// Administrative names read as plain city names: "Commune of Monaco" → "Monaco".
// London's boroughs read as London: "London Borough of Haringey" → "London".
const plainCity = (name: string | null) =>
  name
    ?.replace(/^(Royal )?London Borough of .*/i, "London")
    .replace(/^(Commune|Municipality|City|Comuna|Municipio|Ciudad) (of|de) /i, "") ?? null;

async function lookUpLeagueClubs(leagueSlug: string, locale: Locale): Promise<ClubSpot[]> {
  const teams = await getTeams(leagueSlug);
  const titled = teams.flatMap((t) => {
    const title = clubArticleTitle(t.id);
    return title ? [{ team: t, title }] : [];
  });
  if (titled.length === 0) return [];

  // Article titles → Wikidata ids, following normalisation and redirects.
  const page = await wikipediaApi({
    action: "query",
    prop: "pageprops",
    ppprop: "wikibase_item",
    redirects: "1",
    titles: titled.map((x) => x.title).join("|"),
  });
  const renamed = new Map<string, string>();
  for (const r of [...(page?.query?.normalized ?? []), ...(page?.query?.redirects ?? [])])
    renamed.set(r.from, r.to);
  const resolve = (t: string) => {
    let cur = t;
    for (let i = 0; i < 3 && renamed.has(cur); i++) cur = renamed.get(cur)!;
    return cur;
  };
  const qidByTitle = new Map<string, string>(
    (page?.query?.pages ?? []).flatMap((p: { title: string; pageprops?: { wikibase_item?: string } }) =>
      p.pageprops?.wikibase_item ? [[p.title, p.pageprops.wikibase_item]] : [],
    ),
  );

  const qids = titled.flatMap((x) => qidByTitle.get(resolve(x.title)) ?? []);
  const clubs = await getEntities(qids, "claims", "en");
  // Current home ground (P115), and headquarters (P159) as a fallback.
  const venueOf = new Map(qids.map((q) => [q, claimIds(clubs[q], "P115")[0]]));
  const baseOf = new Map(qids.map((q) => [q, claimIds(clubs[q], "P159")[0]]));
  const placeIds = [...new Set([...venueOf.values(), ...baseOf.values()].filter(Boolean))];
  const places = await getEntities(placeIds, "claims|labels", locale);
  const at = (id: string | undefined) => (id ? coords(claimValues(places[id], "P625")[0]) : null);
  // City: the headquarters if it's a settlement (it has a population), else the town it
  // or the stadium is in, which is one more batch ("Palacio de Ibaigane" → Bilbao).
  const isSettlement = (id: string) => Boolean(places[id]?.claims?.P1082);
  const townOf = (id: string | undefined) => (id ? claimIds(places[id], "P131")[0] : undefined);
  const cityIdOf = (q: string) => {
    const base = baseOf.get(q);
    if (base && isSettlement(base)) return { id: base, inPlaces: true };
    const town = townOf(base) ?? townOf(venueOf.get(q));
    return town ? { id: town, inPlaces: false } : null;
  };
  const townIds = [
    ...new Set(qids.flatMap((q) => {
      const c = cityIdOf(q);
      return c && !c.inPlaces ? [c.id] : [];
    })),
  ];
  const towns = await getEntities(townIds, "labels", locale);
  const cityOf = (q: string) => {
    const c = cityIdOf(q);
    return c ? plainCity(label(c.inPlaces ? places[c.id] : towns[c.id], locale)) : null;
  };

  return titled.flatMap(({ team, title }) => {
    const q = qidByTitle.get(resolve(title));
    const spot = q ? (at(venueOf.get(q)) ?? at(baseOf.get(q))) : null;
    return spot
      ? [
          {
            id: team.id,
            urlSlug: team.urlSlug,
            name: team.name,
            logo: team.logo,
            city: q ? cityOf(q) : null,
            ...spot,
          },
        ]
      : [];
  });
}
