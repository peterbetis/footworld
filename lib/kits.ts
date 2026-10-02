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
