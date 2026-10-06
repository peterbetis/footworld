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
  // Serie A
  "103": "AC Milan",
  "104": "AS Roma",
  "105": "Atalanta BC",
  "107": "Bologna FC 1909",
  "2925": "Cagliari Calcio",
  "2572": "Como 1907",
  "109": "ACF Fiorentina",
  "4057": "Frosinone Calcio",
  "3263": "Genoa CFC",
  "110": "Inter Milan",
  "111": "Juventus FC",
  "112": "SS Lazio",
  "113": "US Lecce",
  "4007": "AC Monza",
  "114": "SSC Napoli",
  "115": "Parma Calcio 1913",
  "3997": "US Sassuolo Calcio",
  "239": "Torino FC",
  "118": "Udinese Calcio",
  "17530": "Venezia FC",
  // Bundesliga
  "598": "1. FC Union Berlin",
  "131": "Bayer 04 Leverkusen",
  "132": "FC Bayern Munich",
  "124": "Borussia Dortmund",
  "268": "Borussia Mönchengladbach",
  "125": "Eintracht Frankfurt",
  "3841": "FC Augsburg",
  "122": "1. FC Köln",
  "127": "Hamburger SV",
  "2950": "1. FSV Mainz 05",
  "11420": "RB Leipzig",
  "126": "SC Freiburg",
  "3307": "SC Paderborn 07",
  "10388": "SV Elversberg",
  "133": "FC Schalke 04",
  "7911": "TSG 1899 Hoffenheim",
  "134": "VfB Stuttgart",
  "137": "SV Werder Bremen",
  // Ligue 1
  "172": "AJ Auxerre",
  "174": "AS Monaco FC",
  "7868": "Angers SCO",
  "6997": "Stade Brestois 29",
  "3236": "Le Havre AC",
  "2697": "Le Mans FC",
  "175": "RC Lens",
  "166": "Lille OSC",
  "273": "FC Lorient",
  "167": "Olympique Lyonnais",
  "176": "Olympique de Marseille",
  "2502": "OGC Nice",
  "6851": "Paris FC",
  "160": "Paris Saint-Germain FC",
  "169": "Stade Rennais FC",
  "180": "RC Strasbourg Alsace",
  "179": "Toulouse FC",
  "170": "ES Troyes AC",
  // Primeira Liga
  "21607": "Académico de Viseu F.C.",
  "21613": "F.C. Alverca",
  "15784": "F.C. Arouca",
  "1929": "S.L. Benfica",
  "2994": "S.C. Braga",
  "3472": "C.D. Nacional",
  "21581": "Casa Pia A.C.",
  "12216": "G.D. Estoril Praia",
  "21610": "C.F. Estrela da Amadora",
  "12698": "F.C. Famalicão",
  "437": "FC Porto",
  "3699": "Gil Vicente F.C.",
  "552": "C.S. Marítimo",
  "3696": "Moreirense F.C.",
  "3822": "Rio Ave F.C.",
  "12215": "C.D. Santa Clara",
  "2250": "Sporting CP",
  "5309": "Vitória S.C.",
  // Eredivisie
  "2726": "ADO Den Haag",
  "140": "AZ Alkmaar",
  "139": "AFC Ajax",
  "2566": "Excelsior Rotterdam",
  "145": "FC Groningen",
  "152": "FC Twente",
  "153": "FC Utrecht",
  "142": "Feyenoord",
  "143": "Fortuna Sittard",
  "3706": "Go Ahead Eagles",
  "146": "SC Heerenveen",
  "147": "NEC Nijmegen",
  "2565": "PEC Zwolle",
  "148": "PSV Eindhoven",
  "3736": "SC Cambuur",
  "151": "Sparta Rotterdam",
  "3735": "SC Telstar",
  "156": "Willem II Tilburg",
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

/** Wikidata's SPARQL query service; returns the result rows (cached for a day). */
export async function wikidataSparql(query: string) {
  const res = await fetch(`https://query.wikidata.org/sparql?${new URLSearchParams({ query })}`, {
    headers: { ...HEADERS, Accept: "application/sparql-results+json" },
    next: { revalidate: ONE_DAY },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status}`);
  const data = await res.json();
  return (data?.results?.bindings ?? []) as Record<string, { value: string }>[];
}

/** Wikidata's API (entities are keyed by id). */
export function wikidataApi(params: Record<string, string>) {
  return getJson("https://www.wikidata.org/w/api.php", params);
}

/** The club's English Wikipedia article title, by ESPN team id. */
export function clubArticleTitle(teamId: string): string | null {
  return ARTICLES[teamId] ?? null;
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
