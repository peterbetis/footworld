import "server-only";
import type { Locale } from "./i18n";
import { wikidataApi } from "./wikipedia";

/** Reading Wikidata entities: shared by player, manager and club lookups. */

export interface WikidataClaim {
  rank?: "preferred" | "normal" | "deprecated";
  mainsnak: { datavalue?: { value: unknown } };
  qualifiers?: Record<string, unknown>;
}

export interface WikidataEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  sitelinks?: Record<string, { title: string }>;
  claims?: Record<string, WikidataClaim[]>;
}

/**
 * Current values first: preferred rank, then statements without an end date
 * (London's countries include the Roman Empire, with an end date).
 */
export const claimValues = (e: WikidataEntity | undefined, prop: string) => {
  const claims = (e?.claims?.[prop] ?? []).filter((c) => c.rank !== "deprecated");
  const preferred = claims.filter((c) => c.rank === "preferred");
  const current = preferred.length > 0 ? preferred : claims.filter((c) => !c.qualifiers?.P582);
  return (current.length > 0 ? current : claims).flatMap((c) =>
    c.mainsnak.datavalue ? [c.mainsnak.datavalue.value] : [],
  );
};

export const claimIds = (e: WikidataEntity | undefined, prop: string) =>
  claimValues(e, prop).flatMap((v) => {
    const id = (v as { id?: string }).id;
    return id ? [id] : [];
  });

export const claimString = (e: WikidataEntity | undefined, prop: string) =>
  claimValues(e, prop).find((v): v is string => typeof v === "string");

export const label = (e: WikidataEntity | undefined, locale: Locale) =>
  e?.labels?.[locale]?.value ?? e?.labels?.en?.value ?? null;

export async function getEntities(ids: string[], props: string, locale: Locale) {
  if (ids.length === 0) return {} as Record<string, WikidataEntity>;
  const data = await wikidataApi({
    action: "wbgetentities",
    ids: ids.join("|"),
    props,
    languages: locale === "en" ? "en" : `${locale}|en`,
    sitefilter: "enwiki",
  });
  return (data?.entities ?? {}) as Record<string, WikidataEntity>;
}

/**
 * One entity's labels and just the given properties' statements. For big items
 * (countries, cities), whose full claims run to megabytes: too big for Next's data
 * cache and slow to download, when only a flag or a parent area is needed.
 */
export async function getEntityLite(
  id: string,
  props: string[],
  locale: Locale,
): Promise<WikidataEntity | undefined> {
  const [entity, ...claims] = await Promise.all([
    wikidataApi({
      action: "wbgetentities",
      ids: id,
      props: "labels",
      languages: locale === "en" ? "en" : `${locale}|en`,
    }),
    ...props.map((property) => wikidataApi({ action: "wbgetclaims", entity: id, property })),
  ]);
  const labels = entity?.entities?.[id]?.labels;
  if (!labels) return undefined;
  return {
    id,
    labels,
    claims: Object.fromEntries(props.map((p, i) => [p, claims[i]?.claims?.[p] ?? []])),
  };
}
