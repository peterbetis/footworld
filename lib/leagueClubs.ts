import "server-only";
import { getTeams } from "./teams";
import type { Locale } from "./i18n";
import { claimIds, claimValues, getEntities, label } from "./wikidata";
import type { WikidataEntity } from "./wikidata";
import { clubArticleTitle, wikidataSparql, wikipediaApi } from "./wikipedia";

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

/**
 * Each club's current home ground and headquarters: preferred statements first, then
 * ones without an end date (clubs' full entries run past 2 MB for a league's worth).
 */
async function getGrounds(qids: string[]) {
  const rows =
    qids.length === 0
      ? []
      : await wikidataSparql(`
          SELECT ?club ?prop ?place ?rank ?ended WHERE {
            VALUES ?club { ${qids.map((q) => `wd:${q}`).join(" ")} }
            VALUES (?p ?ps ?prop) { (p:P115 ps:P115 "venue") (p:P159 ps:P159 "base") }
            ?club ?p ?st . ?st ?ps ?place ; wikibase:rank ?rank .
            OPTIONAL { ?st pq:P582 ?ended }
          }`);
  const score = (r: Record<string, { value: string }>) =>
    (r.rank.value.endsWith("PreferredRank") ? 2 : 0) + (r.ended ? 0 : 1) -
    (r.rank.value.endsWith("DeprecatedRank") ? 10 : 0);
  const best = new Map<string, { place: string; score: number }>();
  for (const r of rows) {
    const key = `${r.club.value.split("/").pop()}:${r.prop.value}`;
    const place = r.place.value.split("/").pop()!;
    const sc = score(r);
    if (!place.startsWith("Q") || (best.get(key)?.score ?? -Infinity) >= sc) continue;
    best.set(key, { place, score: sc });
  }
  const pick = (q: string, prop: string) => best.get(`${q}:${prop}`)?.place;
  return {
    venueOf: new Map(qids.map((q) => [q, pick(q, "venue")])),
    baseOf: new Map(qids.map((q) => [q, pick(q, "base")])),
  };
}

/**
 * Stadiums and club bases with just what's needed (coordinates, whether it has a
 * population, the area it's in) and their names, shaped like Wikidata entities. Their
 * full entries are megabytes for cities like London: one SPARQL query instead.
 */
async function getPlaces(ids: string[], locale: Locale) {
  if (ids.length === 0) return {} as Record<string, WikidataEntity>;
  const [rows, named] = await Promise.all([
    wikidataSparql(`
      SELECT ?item ?coord ?pop ?area WHERE {
        VALUES ?item { ${ids.map((id) => `wd:${id}`).join(" ")} }
        OPTIONAL { ?item wdt:P625 ?coord }
        OPTIONAL { ?item wdt:P1082 ?pop }
        OPTIONAL { ?item wdt:P131 ?area }
      }`),
    getEntities(ids, "labels", locale),
  ]);
  const places: Record<string, WikidataEntity> = {};
  for (const id of ids) places[id] = { id, labels: named[id]?.labels, claims: {} };
  const statement = (value: unknown) => ({ mainsnak: { datavalue: { value } } });
  for (const row of rows) {
    const id = row.item.value.split("/").pop()!;
    const claims = places[id]?.claims;
    if (!claims) continue;
    // "Point(lon lat)"
    const point = row.coord?.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (point && !claims.P625)
      claims.P625 = [statement({ latitude: Number(point[2]), longitude: Number(point[1]) })];
    if (row.pop && !claims.P1082) claims.P1082 = [statement(row.pop.value)];
    if (row.area && !claims.P131) claims.P131 = [statement({ id: row.area.value.split("/").pop() })];
  }
  return places;
}

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
  // Current home ground (P115), and headquarters (P159) as a fallback.
  const { venueOf, baseOf } = await getGrounds(qids);
  const placeIds = [
    ...new Set([...venueOf.values(), ...baseOf.values()].filter((id): id is string => !!id)),
  ];
  const places = await getPlaces(placeIds, locale);
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
