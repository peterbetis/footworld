export type KitPattern = "solid" | "stripes" | "hoops" | "sash" | "band";

export interface Kit {
  pattern: KitPattern;
  /** Main shirt colour. */
  base: string;
  /** Stripes / hoops / sash / band colour (unused for solid). */
  accent: string;
  /** Sleeve colour; defaults to the base. */
  sleeves?: string;
  /** Collar and cuffs. */
  trim: string;
  /** Name and number print colour. */
  print: string;
  /** Outline around the print, for legibility on patterned shirts. */
  printOutline?: string;
}

/**
 * Home kits by ESPN team id. No free API publishes kit designs, so these are
 * hand-maintained: each club's traditional home pattern and colours, which
 * carry over season to season. Seasonal details (gradients, trim) are not modelled.
 */
const KITS: Record<string, Kit> = {
  // LaLiga
  "96": { pattern: "stripes", base: "#ffffff", accent: "#0057b8", sleeves: "#0057b8", trim: "#0057b8", print: "#0a2240", printOutline: "#ffffff" }, // Alavés
  "93": { pattern: "stripes", base: "#ffffff", accent: "#e30613", sleeves: "#e30613", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Athletic Club
  "1068": { pattern: "stripes", base: "#ffffff", accent: "#cb3524", sleeves: "#cb3524", trim: "#1c2c5b", print: "#1c2c5b", printOutline: "#ffffff" }, // Atlético Madrid
  "83": { pattern: "stripes", base: "#a50044", accent: "#004d98", sleeves: "#004d98", trim: "#004d98", print: "#edbb00", printOutline: "#0b1d4a" }, // Barcelona
  "85": { pattern: "solid", base: "#8bc4eb", accent: "#8bc4eb", trim: "#ffffff", print: "#c8102e" }, // Celta Vigo
  "90": { pattern: "stripes", base: "#ffffff", accent: "#1d5ba4", sleeves: "#1d5ba4", trim: "#1d5ba4", print: "#0a2c5a", printOutline: "#ffffff" }, // Deportivo
  "3751": { pattern: "band", base: "#ffffff", accent: "#00843d", trim: "#00843d", print: "#00843d" }, // Elche
  "88": { pattern: "stripes", base: "#ffffff", accent: "#0072ce", sleeves: "#0072ce", trim: "#0072ce", print: "#0a2240", printOutline: "#ffffff" }, // Espanyol
  "2922": { pattern: "solid", base: "#005fae", accent: "#005fae", trim: "#ffffff", print: "#ffffff" }, // Getafe
  "1538": { pattern: "stripes", base: "#b4053f", accent: "#00428e", sleeves: "#00428e", trim: "#00428e", print: "#ffffff", printOutline: "#111111" }, // Levante
  "99": { pattern: "stripes", base: "#ffffff", accent: "#2b7bc4", sleeves: "#2b7bc4", trim: "#2b7bc4", print: "#0a2240", printOutline: "#ffffff" }, // Málaga
  "97": { pattern: "solid", base: "#d50032", accent: "#d50032", trim: "#0a2240", print: "#ffffff" }, // Osasuna
  "87": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#00843d", print: "#00843d" }, // Racing Santander
  "101": { pattern: "sash", base: "#ffffff", accent: "#e53027", trim: "#e53027", print: "#111111", printOutline: "#ffffff" }, // Rayo Vallecano
  "244": { pattern: "stripes", base: "#ffffff", accent: "#00954c", sleeves: "#00954c", trim: "#00954c", print: "#0a3d2a", printOutline: "#ffffff" }, // Real Betis
  "86": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#00205b", print: "#00205b" }, // Real Madrid
  "89": { pattern: "stripes", base: "#ffffff", accent: "#0067b1", sleeves: "#0067b1", trim: "#0067b1", print: "#0a2240", printOutline: "#ffffff" }, // Real Sociedad
  "243": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#d81022", print: "#d81022" }, // Sevilla
  "94": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#111111", print: "#111111" }, // Valencia
  "102": { pattern: "solid", base: "#ffe667", accent: "#ffe667", trim: "#005187", print: "#005187" }, // Villarreal

  // Premier League
  "349": { pattern: "stripes", base: "#da291c", accent: "#111111", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // AFC Bournemouth
  "359": { pattern: "solid", base: "#ef0107", accent: "#ef0107", sleeves: "#ffffff", trim: "#ef0107", print: "#ffffff" }, // Arsenal
  "362": { pattern: "solid", base: "#670e36", accent: "#670e36", sleeves: "#95bfe5", trim: "#95bfe5", print: "#ffffff" }, // Aston Villa
  "337": { pattern: "stripes", base: "#ffffff", accent: "#e30613", sleeves: "#e30613", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Brentford
  "331": { pattern: "stripes", base: "#ffffff", accent: "#0057b8", sleeves: "#0057b8", trim: "#0057b8", print: "#0a2240", printOutline: "#ffffff" }, // Brighton & Hove Albion
  "363": { pattern: "solid", base: "#034694", accent: "#034694", trim: "#ffffff", print: "#ffffff" }, // Chelsea
  "388": { pattern: "solid", base: "#6cbce6", accent: "#6cbce6", trim: "#ffffff", print: "#0b2341" }, // Coventry City
  "384": { pattern: "stripes", base: "#c4122e", accent: "#1b458f", sleeves: "#1b458f", trim: "#1b458f", print: "#ffffff", printOutline: "#0a1a3a" }, // Crystal Palace
  "368": { pattern: "solid", base: "#003399", accent: "#003399", trim: "#ffffff", print: "#ffffff" }, // Everton
  "370": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#111111", print: "#111111" }, // Fulham
  "306": { pattern: "stripes", base: "#f5a12d", accent: "#1a1a1a", trim: "#1a1a1a", print: "#ffffff", printOutline: "#1a1a1a" }, // Hull City
  "373": { pattern: "solid", base: "#0044a9", accent: "#0044a9", trim: "#ffffff", print: "#ffffff" }, // Ipswich Town
  "357": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#ffcd00", print: "#1d428a" }, // Leeds United
  "364": { pattern: "solid", base: "#c8102e", accent: "#c8102e", trim: "#ffffff", print: "#ffffff" }, // Liverpool
  "382": { pattern: "solid", base: "#6cabdd", accent: "#6cabdd", trim: "#1c2c5b", print: "#1c2c5b" }, // Manchester City
  "360": { pattern: "solid", base: "#da291c", accent: "#da291c", trim: "#111111", print: "#ffffff" }, // Manchester United
  "361": { pattern: "stripes", base: "#ffffff", accent: "#111111", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Newcastle United
  "393": { pattern: "solid", base: "#dd0000", accent: "#dd0000", trim: "#ffffff", print: "#ffffff" }, // Nottingham Forest
  "366": { pattern: "stripes", base: "#ffffff", accent: "#eb172b", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Sunderland
  "367": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#132257", print: "#132257" }, // Tottenham Hotspur
};

function isDark(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}

/** Kit for a team, falling back to a plain shirt in ESPN's team colour. */
export function getKit(teamId: string, teamColor: string): Kit {
  const known = KITS[teamId];
  if (known) return known;
  const base = `#${teamColor.replace("#", "") || "1f2937"}`;
  const print = isDark(base) ? "#ffffff" : "#111111";
  return { pattern: "solid", base, accent: base, trim: print, print };
}

/* ---------- change kits ---------- */

const solid = (base: string, trim: string, print: string): Kit => ({
  pattern: "solid",
  base,
  accent: base,
  trim,
  print,
});

/**
 * Away and third kits by ESPN team id. Illustrations only: they use colours
 * each club commonly wears for its change kits, not confirmed 2026-27 designs,
 * so correct any entry here if it doesn't match the real kit.
 */
const CHANGE_KITS: Record<string, { away: Kit; third: Kit }> = {
  // LaLiga
  "96": { away: solid("#141414", "#0057b8", "#ffffff"), third: solid("#f08c00", "#0a2240", "#0a2240") }, // Alavés
  "93": { away: solid("#111111", "#e30613", "#ffffff"), third: solid("#1f7a4d", "#ffffff", "#ffffff") }, // Athletic Club
  "1068": { away: solid("#1c2c5b", "#cb3524", "#ffffff"), third: solid("#0e7c86", "#1c2c5b", "#ffffff") }, // Atlético Madrid
  "83": { away: solid("#e9c46a", "#a50044", "#004d98"), third: solid("#0b1f3a", "#edbb00", "#edbb00") }, // Barcelona
  "85": { away: solid("#c8102e", "#ffffff", "#ffffff"), third: solid("#0b2341", "#8bc4eb", "#8bc4eb") }, // Celta Vigo
  "90": { away: solid("#111111", "#1d5ba4", "#ffffff"), third: solid("#5b2a86", "#ffffff", "#ffffff") }, // Deportivo
  "3751": { away: solid("#00843d", "#ffffff", "#ffffff"), third: solid("#111111", "#00843d", "#ffffff") }, // Elche
  "88": { away: solid("#f26b21", "#0a2240", "#0a2240"), third: solid("#111111", "#0072ce", "#ffffff") }, // Espanyol
  "2922": { away: solid("#ffffff", "#005fae", "#005fae"), third: solid("#c8102e", "#ffffff", "#ffffff") }, // Getafe
  "1538": { away: solid("#ffffff", "#b4053f", "#00428e"), third: solid("#7cc6ea", "#00428e", "#00428e") }, // Levante
  "99": { away: solid("#111111", "#2b7bc4", "#ffffff"), third: solid("#c9a227", "#111111", "#111111") }, // Málaga
  "97": { away: solid("#ffffff", "#0a2240", "#0a2240"), third: solid("#0a2240", "#d50032", "#ffffff") }, // Osasuna
  "87": { away: solid("#00843d", "#ffffff", "#ffffff"), third: solid("#111111", "#00843d", "#ffffff") }, // Racing Santander
  "101": {
    away: { pattern: "sash", base: "#111111", accent: "#e53027", trim: "#e53027", print: "#ffffff", printOutline: "#111111" },
    third: { pattern: "sash", base: "#e53027", accent: "#ffffff", trim: "#ffffff", print: "#ffffff", printOutline: "#111111" },
  }, // Rayo Vallecano
  "244": { away: solid("#111111", "#00954c", "#00954c"), third: solid("#7fcfd3", "#0a3d2a", "#0a3d2a") }, // Real Betis
  "86": { away: solid("#1b2a4a", "#d4af37", "#d4af37"), third: solid("#111111", "#f2c14e", "#f2c14e") }, // Real Madrid
  "89": { away: solid("#111111", "#f2c300", "#f2c300"), third: solid("#f2c300", "#0067b1", "#0067b1") }, // Real Sociedad
  "243": { away: solid("#d81022", "#ffffff", "#ffffff"), third: solid("#111111", "#d81022", "#ffffff") }, // Sevilla
  "94": { away: solid("#111111", "#ee7203", "#ffffff"), third: solid("#ee7203", "#111111", "#111111") }, // Valencia
  "102": { away: solid("#005187", "#ffe667", "#ffe667"), third: solid("#ffffff", "#ffe667", "#005187") }, // Villarreal

  // Premier League
  "349": { away: solid("#ffffff", "#111111", "#111111"), third: solid("#e8a0bf", "#111111", "#111111") }, // AFC Bournemouth
  "359": { away: solid("#f2c14e", "#063672", "#063672"), third: solid("#0b1f3a", "#9c824a", "#ffffff") }, // Arsenal
  "362": { away: solid("#ffffff", "#670e36", "#670e36"), third: solid("#111111", "#95bfe5", "#95bfe5") }, // Aston Villa
  "337": { away: solid("#0f1c3f", "#e30613", "#ffffff"), third: solid("#f2c300", "#111111", "#111111") }, // Brentford
  "331": { away: solid("#f2c300", "#0a2240", "#0a2240"), third: solid("#111111", "#0057b8", "#ffffff") }, // Brighton & Hove Albion
  "363": { away: solid("#ffffff", "#034694", "#034694"), third: solid("#1c1c1c", "#d1d3d4", "#ffffff") }, // Chelsea
  "388": { away: solid("#0b2341", "#6cbce6", "#6cbce6"), third: solid("#ffffff", "#6cbce6", "#0b2341") }, // Coventry City
  "384": { away: solid("#ffffff", "#c4122e", "#1b458f"), third: solid("#f2c300", "#1b458f", "#1b458f") }, // Crystal Palace
  "368": { away: solid("#f2a900", "#0a2240", "#0a2240"), third: solid("#ffffff", "#003399", "#003399") }, // Everton
  "370": { away: solid("#111111", "#ffffff", "#ffffff"), third: solid("#cc0000", "#111111", "#ffffff") }, // Fulham
  "306": { away: solid("#1a1a1a", "#f5a12d", "#f5a12d"), third: solid("#ffffff", "#1a1a1a", "#1a1a1a") }, // Hull City
  "373": { away: solid("#de2c37", "#ffffff", "#ffffff"), third: solid("#111111", "#0044a9", "#ffffff") }, // Ipswich Town
  "357": { away: solid("#1d428a", "#ffcd00", "#ffcd00"), third: solid("#ffcd00", "#1d428a", "#1d428a") }, // Leeds United
  "364": { away: solid("#f5f5f0", "#c8102e", "#c8102e"), third: solid("#111111", "#d4af37", "#ffffff") }, // Liverpool
  "382": { away: solid("#1c2c5b", "#6cabdd", "#ffffff"), third: solid("#ffffff", "#6cabdd", "#1c2c5b") }, // Manchester City
  "360": { away: solid("#ffffff", "#111111", "#111111"), third: solid("#0b1f3a", "#da291c", "#ffffff") }, // Manchester United
  "361": { away: solid("#0b1b3d", "#ffffff", "#ffffff"), third: solid("#2e7d4f", "#ffffff", "#ffffff") }, // Newcastle United
  "393": { away: solid("#ffffff", "#dd0000", "#dd0000"), third: solid("#111111", "#dd0000", "#ffffff") }, // Nottingham Forest
  "366": { away: solid("#111111", "#eb172b", "#ffffff"), third: solid("#ffffff", "#eb172b", "#eb172b") }, // Sunderland
  "367": { away: solid("#132257", "#ffffff", "#ffffff"), third: solid("#b8a9d9", "#132257", "#132257") }, // Tottenham Hotspur
};

export interface KitSet {
  home: Kit;
  away: Kit;
  /** Clubs without a defined third kit show home and away only. */
  third: Kit | null;
}

/** Home, away and third kits; unknown clubs get a plain contrasting away kit. */
export function getKitSet(teamId: string, teamColor: string): KitSet {
  const home = getKit(teamId, teamColor);
  const change = CHANGE_KITS[teamId];
  if (change) return { home, ...change };
  const away = isDark(home.base)
    ? solid("#ffffff", home.base, home.base)
    : solid("#111827", home.base, "#ffffff");
  return { home, away, third: null };
}
