import "server-only";
import { createHash } from "node:crypto";

/** Shared Wikipedia / Wikidata access for club data (kits, manager). */

// English Wikipedia article for each club, by ESPN team id.
const ARTICLES: Record<string, string> = {
  // LaLiga
  "96": "Deportivo Alavés",
  "93": "Athletic Bilbao",
  "1068": "Atlético Madrid",
  "83": "FC Barcelona",
  "85": "RC Celta de Vigo",
  "90": "Deportivo de La Coruña",
  "3751": "Elche CF",
  "88": "RCD Espanyol",
  "2922": "Getafe CF",
  "1538": "Levante UD",
  "99": "Málaga CF",
  "97": "CA Osasuna",
  "87": "Racing de Santander",
  "101": "Rayo Vallecano",
  "244": "Real Betis",
  "86": "Real Madrid CF",
  "89": "Real Sociedad",
  "243": "Sevilla FC",
  "94": "Valencia CF",
  "102": "Villarreal CF",
  // Premier League
  "349": "AFC Bournemouth",
  "359": "Arsenal F.C.",
  "362": "Aston Villa F.C.",
  "337": "Brentford F.C.",
  "331": "Brighton & Hove Albion F.C.",
  "363": "Chelsea F.C.",
  "388": "Coventry City F.C.",
  "384": "Crystal Palace F.C.",
  "368": "Everton F.C.",
  "370": "Fulham F.C.",
  "306": "Hull City A.F.C.",
  "373": "Ipswich Town F.C.",
  "357": "Leeds United F.C.",
  "364": "Liverpool F.C.",
  "382": "Manchester City F.C.",
  "360": "Manchester United F.C.",
  "361": "Newcastle United F.C.",
  "393": "Nottingham Forest F.C.",
  "366": "Sunderland A.F.C.",
  "367": "Tottenham Hotspur F.C.",
};

// Wikimedia asks API clients to identify themselves.
const HEADERS = { "User-Agent": "FootWorld/0.1 (https://github.com/peterbetis/footworld)" };
const ONE_DAY = 86_400; // club articles change rarely; kits and managers even less

async function getJson(base: string, params: Record<string, string>) {
  const res = await fetch(`${base}?${new URLSearchParams({ format: "json", ...params })}`, {
    headers: HEADERS,
    next: { revalidate: ONE_DAY },
  });
  if (!res.ok) throw new Error(`${new URL(base).hostname} API ${res.status}`);
  return res.json();
}

/** English Wikipedia's MediaWiki API (formatversion 2). */
export function wikipediaApi(params: Record<string, string>) {
  return getJson("https://en.wikipedia.org/w/api.php", { formatversion: "2", ...params });
}

/** Wikidata's API (entities are keyed by id). */
export function wikidataApi(params: Record<string, string>) {
  return getJson("https://www.wikidata.org/w/api.php", params);
}

export function articleUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

/** The club's article title and wikitext, or null if unmapped or missing. Cached per club. */
export async function getClubArticle(teamId: string) {
  const title = ARTICLES[teamId];
  if (!title) return null;
  const page = await wikipediaApi({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    redirects: "1",
    titles: title,
  });
  const wikitext: string | undefined =
    page?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
  return wikitext ? { title, wikitext } : null;
}

/** Direct thumbnail URL for a Wikimedia Commons file (avoids Special:FilePath redirects). */
export function commonsThumb(file: string, width: number) {
  const name = file.replace(/ /g, "_");
  const md5 = createHash("md5").update(name).digest("hex");
  const path = `${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(name)}`;
  const thumb = `${width}px-${encodeURIComponent(name)}${name.toLowerCase().endsWith(".svg") ? ".png" : ""}`;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${thumb}`;
}
