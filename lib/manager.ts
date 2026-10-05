import "server-only";
import type { Locale } from "./i18n";
import { getPersonDetails } from "./playerProfile";
import { commonsThumb, getClubArticle, wikidataApi, wikipediaApi } from "./wikipedia";

export interface Manager {
  name: string;
  /** Nationality in the page's language. */
  nationality: string | null;
  flag: string | null;
  portrait: string | null;
  /** For the manager modal (null when the manager has no Wikidata entry). */
  details: {
    fullName: string | null;
    /** YYYY-MM-DD. */
    birthDate: string | null;
    birthPlace: string | null;
    birthFlag: string | null;
    /** Larger photo (Wikimedia Commons), falling back to the card portrait. */
    photo: string | null;
  } | null;
}

interface WikidataEntity {
  labels?: Record<string, { value: string }>;
  claims?: Record<string, { mainsnak: { datavalue?: { value: unknown } } }[]>;
}

const claimIds = (e: WikidataEntity | undefined, prop: string) =>
  (e?.claims?.[prop] ?? []).flatMap((c) => {
    const v = c.mainsnak.datavalue?.value as { id?: string } | undefined;
    return v?.id ? [v.id] : [];
  });

const claimString = (e: WikidataEntity | undefined, prop: string) =>
  (e?.claims?.[prop] ?? []).flatMap((c) => {
    const v = c.mainsnak.datavalue?.value;
    return typeof v === "string" ? [v] : [];
  })[0];

/**
 * The club's current manager from its Wikipedia infobox (ESPN's coach data is
 * historical), with a portrait from the manager's article and nationality and
 * flag from Wikidata.
 */
export async function getManager(teamId: string, locale: Locale): Promise<Manager | null> {
  const club = await getClubArticle(teamId);
  if (!club) return null;

  // "| manager = [[Hansi Flick]]" — first wiki link; comments stripped first.
  const text = club.wikitext.replace(/<!--[\s\S]*?-->/g, "");
  const link = text.match(/\|\s*manager\s*=\s*[^\n]*?\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/);
  if (!link) return null;
  const title = link[1].trim();

  const page = await wikipediaApi({
    action: "query",
    prop: "pageimages|pageprops",
    piprop: "thumbnail",
    pithumbsize: "240",
    ppprop: "wikibase_item",
    redirects: "1",
    titles: title,
  });
  const p = page?.query?.pages?.[0];
  if (!p || p.missing) return null;
  const portrait: string | null = p.thumbnail?.source
    ? p.thumbnail.source.replace(/\?.*$/, "")
    : null;
  const qid: string | undefined = p.pageprops?.wikibase_item;

  let nationality: string | null = null;
  let flag: string | null = null;
  if (qid) {
    const person: WikidataEntity | undefined = (
      await wikidataApi({ action: "wbgetentities", ids: qid, props: "claims" })
    )?.entities?.[qid];
    // "Country for sport" is the football nationality; fall back to citizenship.
    const countryId = claimIds(person, "P1532")[0] ?? claimIds(person, "P27")[0];
    if (countryId) {
      const country: WikidataEntity | undefined = (
        await wikidataApi({
          action: "wbgetentities",
          ids: countryId,
          props: "labels|claims",
          languages: "en|es",
        })
      )?.entities?.[countryId];
      nationality = country?.labels?.[locale]?.value ?? country?.labels?.en?.value ?? null;
      const flagFile = claimString(country, "P41");
      flag = flagFile ? commonsThumb(flagFile, 120) : null;
    }
  }

  const articleTitle: string = p.title ?? title;
  // Display name: the infobox's link text if given, else the title without a
  // disambiguation suffix ("José Alberto (footballer)" → "José Alberto").
  const name = (link[2] ?? articleTitle).replace(/\s*\([^)]*\)\s*$/, "").trim();
  const person = qid ? await getPersonDetails(qid, locale).catch(() => null) : null;
  const details = person && {
    fullName: person.fullName,
    birthDate: person.birthDate,
    birthPlace: person.birthPlace?.name ?? null,
    birthFlag: person.birthPlace?.flag ?? null,
    photo: person.photo ?? portrait,
  };
  return { name, nationality, flag, portrait, details };
}
