import "server-only";
import { wikipediaApi } from "./wikipedia";

/**
 * League titles per club, from Wikipedia's "List of … football champions" pages: each
 * has a curated titles-by-club table (official counts, so revoked titles aren't
 * counted, and pre-league-era championships are), which Wikidata's season records
 * often miss.
 */
const CHAMPIONS_PAGES: Record<string, string> = {
  "eng.1": "List of English football champions",
  "esp.1": "List of Spanish football champions",
  "ita.1": "List of Italian football champions",
  "ger.1": "List of German football champions",
  "fra.1": "List of French football champions",
  "por.1": "List of Portuguese football champions",
  "ned.1": "List of Dutch football champions",
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

/**
 * Rows of the page's all-time titles-by-club table: each club's article title and its
 * titles. Some pages also have tables for one era (the Dutch page lists Eredivisie-era
 * titles first), so of the titles tables the one with the most clubs is used.
 */
function parseTitlesTable(html: string) {
  const tables = [...html.matchAll(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/g)];
  let best: { title: string; titles: number }[] = [];
  for (const [, table] of tables) {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
    const headers = [...(rows[0] ?? "").matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").replace(/&#91;.*?&#93;/g, "").trim(),
    );
    // A table with a "Club" column and a titles column ("Winners", "Champions"…).
    if (!headers.some((h) => /^clubs?$/i.test(h))) continue;
    if (!headers.some((h) => /^(winners?|champions|titles)$/i.test(h))) continue;
    const entries: { title: string; titles: number }[] = [];
    for (const row of rows.slice(1)) {
      const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1]);
      // The club cell is the first linking to an article (ranks span rows, so column
      // positions shift); the titles are the first whole number after it.
      const clubAt = cells.findIndex((c) => /<a [^>]*href="\/wiki\/(?!File:)[^"]+"/.test(c));
      if (clubAt < 0) continue;
      const title = cells[clubAt].match(/<a [^>]*href="\/wiki\/(?!File:)[^"]*"[^>]*title="([^"]+)"/)?.[1];
      const count = cells
        .slice(clubAt + 1)
        .map((c) => c.replace(/<sup[\s\S]*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim())
        .find((t) => /^\d+$/.test(t));
      if (title && count) entries.push({ title: decode(title), titles: Number(count) });
    }
    if (entries.length > best.length) best = entries;
  }
  return best;
}

/** Article titles as Wikipedia resolves them (normalised, redirects followed). */
async function canonicalTitles(titles: string[]) {
  const resolved = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const data = await wikipediaApi({ action: "query", redirects: "1", titles: chunk.join("|") });
    const renamed = new Map<string, string>();
    for (const r of [...(data?.query?.normalized ?? []), ...(data?.query?.redirects ?? [])])
      renamed.set(r.from, r.to);
    for (const t of chunk) {
      let cur = t;
      for (let n = 0; n < 3 && renamed.has(cur); n++) cur = renamed.get(cur)!;
      resolved.set(t, cur);
    }
  }
  return resolved;
}

const DAY_MS = 86_400_000;
const memo = new Map<string, { at: number; byClub: Promise<Map<string, number> | null> }>();

/**
 * League titles by club article title (canonical), or null when the league has no
 * champions page or it couldn't be read. Kept for a day.
 */
export function leagueTitlesByClub(leagueSlug: string): Promise<Map<string, number> | null> {
  const hit = memo.get(leagueSlug);
  if (hit && Date.now() - hit.at < DAY_MS) return hit.byClub;
  const byClub = lookUp(leagueSlug).catch(() => null);
  memo.set(leagueSlug, { at: Date.now(), byClub });
  return byClub;
}

async function lookUp(leagueSlug: string) {
  const page = CHAMPIONS_PAGES[leagueSlug];
  if (!page) return null;
  const data = await wikipediaApi({ action: "parse", page, prop: "text", redirects: "1" });
  const entries = parseTitlesTable(data?.parse?.text ?? "");
  if (entries.length === 0) return null;
  const canonical = await canonicalTitles([...new Set(entries.map((e) => e.title))]);
  const byClub = new Map<string, number>();
  for (const e of entries) {
    const key = canonical.get(e.title) ?? e.title;
    // A club listed twice (e.g. under an old name) keeps its larger count.
    byClub.set(key, Math.max(byClub.get(key) ?? 0, e.titles));
  }
  return byClub;
}
