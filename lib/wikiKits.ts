import "server-only";
import { getClubArticle, wikipediaApi } from "./wikipedia";

/**
 * Current-season kits from each club's English Wikipedia article.
 *
 * The infobox describes up to three kits (home/away/third) as pattern names and
 * colours; Wikipedia's {{Football kit}} template draws each one as 5 parts (left
 * arm, body, right arm, shorts, socks), each a solid colour with a pattern PNG
 * and an outline image on top. We ask Wikipedia to render the template, then
 * keep only the layer geometry, colours and Wikimedia image URLs — never the
 * returned HTML itself.
 */

export interface KitLayer {
  /** Position and size on the template's 100 × 135 canvas. */
  x: number;
  y: number;
  w: number;
  h: number;
  color: string | null;
  image: string | null;
}

export interface WikiKit {
  key: "home" | "away" | "third";
  layers: KitLayer[];
  /** Distinct fill colours, for swatches. */
  colours: string[];
}

export interface WikiKits {
  kits: WikiKit[];
  /**
   * Season the kits are from, read from Wikipedia's pattern names
   * ("_barcelona2627h" → "2026-27"); null when the names don't say.
   */
  season: string | null;
}

/** "2627" inside a pattern name → "2026-27" (two consecutive two-digit years). */
function seasonFromPatterns(params: string[]) {
  for (const p of params) {
    for (const m of p.matchAll(/pattern_b=[^|]*?(\d{2})(\d{2})/g)) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (b === (a + 1) % 100) return `20${m[1]}-${m[2]}`;
    }
  }
  return null;
}

const PARTS = ["la", "b", "ra", "sh", "so"] as const;
const COLOURS = ["leftarm", "body", "rightarm", "shorts", "socks"] as const;
const KEYS = ["home", "away", "third"] as const;

/** Infobox parameters for kit `n` (1–3), or null if the article doesn't define it. */
function kitParams(wikitext: string, n: number) {
  const text = wikitext.replace(/<!--[\s\S]*?-->/g, "");
  const get = (name: string) =>
    text.match(new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n|}]*)`))?.[1].trim() ?? "";
  const patterns = PARTS.map((p) => get(`pattern_${p}${n}`));
  const colours = COLOURS.map((c) => get(`${c}${n}`));
  if (!patterns[1] && !colours[1]) return null;
  // Only safe characters reach the template call.
  const clean = (v: string) => v.replace(/[^A-Za-z0-9_\-#]/g, "");
  return [
    ...PARTS.map((p, i) => `pattern_${p}=${clean(patterns[i])}`),
    ...COLOURS.map((c, i) => `${c}=${clean(colours[i])}`),
  ].join("|");
}

/** Wikimedia image URL from a rendered <img src>, or null if it isn't one. */
function imageUrl(src: string) {
  const url = new URL(src.replace(/&amp;/g, "&"), "https://en.wikipedia.org");
  if (!/^(upload|thumb)\.wikimedia\.org$/.test(url.hostname)) return null;
  url.protocol = "https:";
  url.search = "";
  return url.toString();
}

/** Turns one rendered kit's HTML into layers. */
function parseLayers(html: string): KitLayer[] {
  const layers: KitLayer[] = [];
  const div =
    /<div style="position: absolute; left: (\d+)px; top: (\d+)px; width: (\d+)px; height: (\d+)px;([^"]*)">([\s\S]*?)<\/div>/g;
  for (const m of html.matchAll(div)) {
    const color = m[5].match(/background-color:\s*(#[0-9A-Fa-f]{3,8})/)?.[1] ?? null;
    const src = m[6].match(/<img[^>]*\ssrc="([^"]+)"/)?.[1];
    layers.push({
      x: Number(m[1]),
      y: Number(m[2]),
      w: Number(m[3]),
      h: Number(m[4]),
      color,
      image: src ? imageUrl(src) : null,
    });
  }
  return layers;
}

export async function getWikiKits(teamId: string): Promise<WikiKits | null> {
  const club = await getClubArticle(teamId);
  if (!club) return null;
  const { wikitext } = club;

  const defined = KEYS.map((key, i) => ({ key, params: kitParams(wikitext, i + 1) })).filter(
    (k): k is { key: (typeof KEYS)[number]; params: string } => k.params !== null,
  );
  if (defined.length === 0) return null;

  // Render all kits in one call, separated by markers we can split on.
  const text = defined
    .map((k) => `<span id="kit-${k.key}"></span>{{Football kit|${k.params}}}`)
    .join("\n");
  const parsed = await wikipediaApi({
    action: "parse",
    contentmodel: "wikitext",
    prop: "text",
    disablelimitreport: "1",
    text,
  });
  const html: string = parsed?.parse?.text ?? "";
  const chunks = html.split(/<span id="kit-(home|away|third)"><\/span>/).slice(1);

  const kits: WikiKit[] = [];
  for (let i = 0; i < chunks.length; i += 2) {
    const key = chunks[i] as WikiKit["key"];
    const layers = parseLayers(chunks[i + 1] ?? "");
    if (layers.length === 0) continue;
    const colours = [...new Set(layers.flatMap((l) => (l.color ? [l.color.toLowerCase()] : [])))];
    kits.push({ key, layers, colours });
  }

  return kits.length
    ? {
        kits,
        season: seasonFromPatterns(defined.map((k) => k.params)),
      }
    : null;
}
