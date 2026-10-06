import "server-only";
import type { Locale } from "./i18n";
import {
  claimIds,
  claimString,
  claimValues,
  getEntities,
  label,
  type WikidataEntity,
} from "./wikidata";
import { commonsThumb, wikidataApi, wikipediaApi } from "./wikipedia";

/**
 * A player's biography details (from Wikidata, with a photo from Wikimedia
 * Commons; Transfermarkt has no free API).
 */
export interface PlayerProfile {
  fullName: string | null;
  /** "London, England", in the page's language. */
  birthPlace: string | null;
  /** The birthplace country's flag, when Wikidata has it. */
  birthFlag: string | null;
  /** Where the birthplace is, for its pin on the map (Wikidata places only). */
  birthCoords: { lat: number; lon: number } | null;
  portrait: string | null;
  /** Wikidata's height, more precise than ESPN's. */
  heightCm: number | null;
}

/**
 * The footballer called `name`, told apart from namesakes by date of birth
 * (YYYY-MM-DD, from ESPN) when there's more than one.
 */
async function findPlayer(name: string, born: string | null, locale: Locale) {
  const search = await wikidataApi({
    action: "query",
    list: "search",
    // P106 (occupation) = Q937857 (association football player)
    srsearch: `${name} haswbstatement:P106=Q937857`,
    srlimit: "5",
  });
  const ids: string[] = (search?.query?.search ?? []).map((r: { title: string }) => r.title);
  const entities = await getEntities(ids, "labels|claims|sitelinks", locale);
  const candidates = ids.flatMap((id) => (entities[id] ? [entities[id]] : []));
  if (!born) return candidates[0] ?? null;

  const birthDate = (e: WikidataEntity) =>
    (claimValues(e, "P569")[0] as { time?: string } | undefined)?.time?.slice(1, 11);
  // ESPN's dates are timestamps, so allow a day either way.
  const sameDay = (d: string) => Math.abs(Date.parse(d) - Date.parse(born)) <= 86_400_000;
  return (
    candidates.find((e) => {
      const d = birthDate(e);
      return d !== undefined && sameDay(d);
    }) ??
    // A namesake born on another day is someone else; one with no date may be them.
    candidates.find((e) => !birthDate(e)) ??
    null
  );
}

/** A field from the infobox of the player's English Wikipedia article, as wikitext. */
async function infoboxRaw(title: string, field: RegExp) {
  const page = await wikipediaApi({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    rvsection: "0",
    titles: title,
  });
  const text: string = page?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content ?? "";
  return text.match(new RegExp(`\\|\\s*${field.source}\\s*=\\s*([^\\n]*)`))?.[1] ?? null;
}

/** Wikitext as plain text: references, comments and templates dropped, links unwrapped. */
export function plainText(value: string) {
  const clean = value
    .replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>|<!--[\s\S]*?-->|<br\s*\/?>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/\s*,\s*$/, "")
    .trim();
  return clean || null;
}

/**
 * The infobox's birth_place, for players whose Wikidata birthplace is missing or
 * unusable; located by the coordinates of the first place it links to.
 */
async function infoboxBirthPlace(title: string): Promise<BirthPlace | null> {
  const raw = await infoboxRaw(title, /birth_place/);
  const name = raw ? plainText(raw) : null;
  if (!raw || !name) return null;
  const link = raw.match(/\[\[([^\]|#]+)/)?.[1];
  let coords: BirthPlace["coords"] = null;
  if (link) {
    const page = await wikipediaApi({
      action: "query",
      prop: "coordinates",
      redirects: "1",
      titles: link,
    });
    const c = page?.query?.pages?.[0]?.coordinates?.[0];
    if (c) coords = { lat: c.lat, lon: c.lon };
  }
  return { name, coords, flag: null };
}

export interface BirthPlace {
  name: string;
  coords: { lat: number; lon: number } | null;
  /** The birthplace country's flag (Wikimedia Commons). */
  flag: string | null;
}

// England, Scotland, Wales and Northern Ireland: what football calls a UK birthplace's country.
const UK = "Q145";
const HOME_NATIONS = new Set(["Q21", "Q22", "Q25", "Q26"]);

/** The home nation (entity) a UK place is in, following "located in" (P131) a few levels up. */
async function homeNation(place: WikidataEntity, locale: Locale) {
  let current: WikidataEntity | undefined = place;
  for (let level = 0; current && level < 6; level++) {
    const parentId: string | undefined = claimIds(current, "P131")[0];
    if (!parentId) return null;
    const parent: WikidataEntity | undefined = (
      await getEntities([parentId], "labels|claims", locale)
    )[parentId];
    if (HOME_NATIONS.has(parentId)) return parent ?? null;
    current = parent;
  }
  return null;
}

/** Birthplace with its country appended: "London" → "London, England". */
async function birthPlace(player: WikidataEntity, locale: Locale): Promise<BirthPlace | null> {
  // Some players list several places (a city and its district or parish): show the
  // best known, judged by how much Wikidata says about it.
  // Every value counts here, not only the preferred one (often the district).
  const ids = (player.claims?.P19 ?? []).flatMap((c) => {
    const id = (c.mainsnak.datavalue?.value as { id?: string } | undefined)?.id;
    return id && c.rank !== "deprecated" ? [id] : [];
  });
  const places = await getEntities(ids, "labels|claims", locale);
  const size = (e: WikidataEntity | undefined) =>
    Object.values(e?.claims ?? {}).reduce((n, c) => n + c.length, 0);
  // Only real places (with coordinates or a country), which keeps out vandalised
  // statements pointing at unrelated items.
  const isPlace = (e: WikidataEntity | undefined) => !!(e?.claims?.P625 || e?.claims?.P17);
  const placeId = ids
    .filter((id) => isPlace(places[id]))
    .reduce<string | undefined>(
      (best, id) => (best === undefined || size(places[id]) > size(places[best]) ? id : best),
      undefined,
    );
  if (!placeId) return null;
  const place = places[placeId];
  const name = label(place, locale);
  if (!name) return null;
  const at = claimValues(place, "P625")[0] as { latitude?: number; longitude?: number } | undefined;
  const coords =
    at?.latitude !== undefined && at.longitude !== undefined
      ? { lat: at.latitude, lon: at.longitude }
      : null;

  const countryId = claimIds(place, "P17")[0];
  if (!countryId) return { name, coords, flag: null };
  const country =
    countryId === placeId
      ? place
      : ((countryId === UK && (await homeNation(place, locale))) ||
        (await getEntities([countryId], "labels|claims", locale))[countryId]);
  const countryName = label(country, locale);
  const flagFile = claimString(country, "P41");
  return {
    name: countryName && countryName !== name ? `${name}, ${countryName}` : name,
    coords,
    flag: flagFile ? commonsThumb(flagFile, 120) : null,
  };
}

/**
 * Biography details shared by players and managers: full name, date of birth,
 * birthplace (with country flag and coordinates) and photo, from a person's
 * Wikidata entry, falling back to their Wikipedia infobox.
 */
export interface PersonDetails {
  fullName: string | null;
  /** YYYY-MM-DD. */
  birthDate: string | null;
  birthPlace: BirthPlace | null;
  /** Wikimedia Commons photo, 500px wide. */
  photo: string | null;
}

async function personDetails(person: WikidataEntity, locale: Locale): Promise<PersonDetails> {
  const enTitle = person.sitelinks?.enwiki?.title;
  const birthName = (claimValues(person, "P1477")[0] as { text?: string } | undefined)?.text;
  const [fullName, place] = await Promise.all([
    birthName ??
      (enTitle ? infoboxRaw(enTitle, /full_?name/).then((v) => v && plainText(v)) : null),
    birthPlace(person, locale).then((p) => p ?? (enTitle ? infoboxBirthPlace(enTitle) : null)),
  ]);
  const born = (claimValues(person, "P569")[0] as { time?: string } | undefined)?.time;
  const photo = claimString(person, "P18");
  return {
    fullName: fullName ?? label(person, locale),
    birthDate: born && /^\+\d{4}-\d{2}-\d{2}/.test(born) ? born.slice(1, 11) : null,
    birthPlace: place,
    // 500px: Wikimedia only serves its standard thumbnail widths.
    photo: photo ? commonsThumb(photo, 500) : null,
  };
}

/** Details for a person by Wikidata id (e.g. a manager found through their article). */
export async function getPersonDetails(qid: string, locale: Locale) {
  const person = (await getEntities([qid], "labels|claims|sitelinks", locale))[qid];
  return person ? personDetails(person, locale) : null;
}

export async function getPlayerProfile(
  name: string,
  born: string | null,
  locale: Locale,
): Promise<PlayerProfile | null> {
  const player = await findPlayer(name, born, locale);
  if (!player) return null;

  const { fullName, birthPlace: place, photo } = await personDetails(player, locale);
  // Height (P2048) in centimetres (Q174728) or metres (Q11573).
  const h = claimValues(player, "P2048")[0] as { amount?: string; unit?: string } | undefined;
  const amount = Number(h?.amount);
  const heightCm = !Number.isFinite(amount)
    ? null
    : h?.unit?.endsWith("/Q174728")
      ? Math.round(amount)
      : h?.unit?.endsWith("/Q11573")
        ? Math.round(amount * 100)
        : null;
  return {
    fullName,
    birthPlace: place?.name ?? null,
    birthCoords: place?.coords ?? null,
    birthFlag: place?.flag ?? null,
    portrait: photo,
    // Sanity check against vandalism or unit mix-ups.
    heightCm: heightCm && heightCm > 140 && heightCm < 230 ? heightCm : null,
  };
}
