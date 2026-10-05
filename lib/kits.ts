export type KitPattern =
  | "solid"
  | "stripes"
  | "hoops"
  | "sash"
  | "band"
  /** Accent on one vertical half. */
  | "halves"
  /** Accent above a diagonal split (e.g. Monaco). */
  | "diagonal"
  /** One broad central vertical stripe (e.g. Ajax, PSG). */
  | "vband";

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
  // Serie A
  "103": { pattern: "stripes", base: "#111111", accent: "#fb090b", sleeves: "#fb090b", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // AC Milan
  "104": { pattern: "solid", base: "#8e1f2f", accent: "#8e1f2f", trim: "#f0bc42", print: "#f0bc42" }, // AS Roma
  "105": { pattern: "stripes", base: "#111111", accent: "#1e71b8", sleeves: "#1e71b8", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // Atalanta
  "107": { pattern: "stripes", base: "#1a2f48", accent: "#a21c26", sleeves: "#1a2f48", trim: "#1a2f48", print: "#ffffff", printOutline: "#1a2f48" }, // Bologna
  "2925": { pattern: "halves", base: "#a6192e", accent: "#002350", trim: "#ffffff", print: "#ffffff", printOutline: "#002350" }, // Cagliari
  "2572": { pattern: "solid", base: "#0a3d91", accent: "#0a3d91", trim: "#ffffff", print: "#ffffff" }, // Como
  "109": { pattern: "solid", base: "#5b2b82", accent: "#5b2b82", trim: "#ffffff", print: "#ffffff" }, // Fiorentina
  "4057": { pattern: "solid", base: "#f6d32d", accent: "#f6d32d", trim: "#0b3e8f", print: "#0b3e8f" }, // Frosinone
  "3263": { pattern: "halves", base: "#a6192e", accent: "#002147", trim: "#ffffff", print: "#ffffff", printOutline: "#002147" }, // Genoa
  "110": { pattern: "stripes", base: "#111111", accent: "#0068a8", sleeves: "#0068a8", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // Inter
  "111": { pattern: "stripes", base: "#ffffff", accent: "#111111", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Juventus
  "112": { pattern: "solid", base: "#87d8f7", accent: "#87d8f7", trim: "#0b2240", print: "#0b2240" }, // Lazio
  "113": { pattern: "stripes", base: "#f9e300", accent: "#d4001f", trim: "#d4001f", print: "#0b1d4a", printOutline: "#ffffff" }, // Lecce
  "4007": { pattern: "solid", base: "#c8102e", accent: "#c8102e", trim: "#ffffff", print: "#ffffff" }, // Monza
  "114": { pattern: "solid", base: "#12a0d7", accent: "#12a0d7", trim: "#ffffff", print: "#ffffff" }, // Napoli
  "115": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#ffd200", print: "#111111" }, // Parma
  "3997": { pattern: "stripes", base: "#111111", accent: "#00a752", sleeves: "#00a752", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // Sassuolo
  "239": { pattern: "solid", base: "#8a1e03", accent: "#8a1e03", trim: "#ffffff", print: "#ffffff" }, // Torino
  "118": { pattern: "stripes", base: "#ffffff", accent: "#111111", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Udinese
  "17530": { pattern: "solid", base: "#111111", accent: "#111111", trim: "#f47b20", print: "#ffffff" }, // Venezia

  // Bundesliga
  "598": { pattern: "solid", base: "#eb1923", accent: "#eb1923", trim: "#ffffff", print: "#ffffff" }, // Union Berlin
  "131": { pattern: "solid", base: "#e32221", accent: "#e32221", trim: "#111111", print: "#ffffff" }, // Bayer Leverkusen
  "132": { pattern: "solid", base: "#dc052d", accent: "#dc052d", trim: "#ffffff", print: "#ffffff" }, // Bayern Munich
  "124": { pattern: "solid", base: "#fde100", accent: "#fde100", trim: "#111111", print: "#111111" }, // Borussia Dortmund
  "268": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#00a650", print: "#111111" }, // Borussia Mönchengladbach
  "125": { pattern: "solid", base: "#111111", accent: "#111111", trim: "#e1000f", print: "#ffffff" }, // Eintracht Frankfurt
  "3841": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#ba3733", print: "#ba3733" }, // FC Augsburg
  "122": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#ed1c24", print: "#ed1c24" }, // FC Cologne
  "127": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#0a3f86", print: "#0a3f86" }, // Hamburg SV
  "2950": { pattern: "solid", base: "#c3141e", accent: "#c3141e", trim: "#ffffff", print: "#ffffff" }, // Mainz
  "11420": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#dd0741", print: "#0c2043" }, // RB Leipzig
  "126": { pattern: "solid", base: "#e2001a", accent: "#e2001a", trim: "#111111", print: "#ffffff" }, // SC Freiburg
  "3307": { pattern: "solid", base: "#00337f", accent: "#00337f", trim: "#111111", print: "#ffffff" }, // SC Paderborn 07
  "10388": { pattern: "solid", base: "#111111", accent: "#111111", trim: "#ffffff", print: "#ffffff" }, // SV Elversberg
  "133": { pattern: "solid", base: "#004d9d", accent: "#004d9d", trim: "#ffffff", print: "#ffffff" }, // Schalke 04
  "7911": { pattern: "solid", base: "#1961b5", accent: "#1961b5", trim: "#ffffff", print: "#ffffff" }, // TSG Hoffenheim
  "134": { pattern: "band", base: "#ffffff", accent: "#e32219", trim: "#e32219", print: "#e32219" }, // VfB Stuttgart
  "137": { pattern: "solid", base: "#1d9053", accent: "#1d9053", trim: "#ffffff", print: "#ffffff" }, // Werder Bremen

  // Ligue 1
  "172": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#0e5cad", print: "#0e5cad" }, // AJ Auxerre
  "174": { pattern: "diagonal", base: "#ffffff", accent: "#e30613", trim: "#e30613", print: "#111111", printOutline: "#ffffff" }, // AS Monaco
  "7868": { pattern: "stripes", base: "#ffffff", accent: "#111111", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Angers
  "6997": { pattern: "solid", base: "#e2001a", accent: "#e2001a", trim: "#ffffff", print: "#ffffff" }, // Brest
  "3236": { pattern: "halves", base: "#6cb4e4", accent: "#0e2240", trim: "#0e2240", print: "#ffffff", printOutline: "#0e2240" }, // Le Havre
  "2697": { pattern: "solid", base: "#d62b11", accent: "#d62b11", trim: "#ffd200", print: "#ffffff" }, // Le Mans
  "175": { pattern: "solid", base: "#fdd700", accent: "#fdd700", sleeves: "#e1001a", trim: "#e1001a", print: "#e1001a" }, // Lens
  "166": { pattern: "solid", base: "#e01e13", accent: "#e01e13", trim: "#24216a", print: "#ffffff" }, // Lille
  "273": { pattern: "solid", base: "#f58113", accent: "#f58113", trim: "#111111", print: "#111111" }, // Lorient
  "167": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#0a3f86", print: "#0a3f86" }, // Lyon
  "176": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#2faee0", print: "#2faee0" }, // Marseille
  "2502": { pattern: "stripes", base: "#111111", accent: "#c4161c", sleeves: "#c4161c", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // Nice
  "6851": { pattern: "solid", base: "#0b1c3e", accent: "#0b1c3e", trim: "#ffffff", print: "#ffffff" }, // Paris FC
  "160": { pattern: "vband", base: "#0b1c3e", accent: "#da291c", trim: "#da291c", print: "#ffffff", printOutline: "#0b1c3e" }, // Paris Saint-Germain
  "169": { pattern: "solid", base: "#e13327", accent: "#e13327", trim: "#111111", print: "#111111" }, // Stade Rennais
  "180": { pattern: "solid", base: "#009fe3", accent: "#009fe3", trim: "#ffffff", print: "#ffffff" }, // Strasbourg
  "179": { pattern: "solid", base: "#5d2c82", accent: "#5d2c82", trim: "#ffffff", print: "#ffffff" }, // Toulouse
  "170": { pattern: "solid", base: "#1d4e9b", accent: "#1d4e9b", trim: "#ffffff", print: "#ffffff" }, // Troyes

  // Primeira Liga
  "21607": { pattern: "solid", base: "#111111", accent: "#111111", trim: "#c60000", print: "#ffffff" }, // Académico de Viseu
  "21613": { pattern: "solid", base: "#0047ab", accent: "#0047ab", trim: "#c60000", print: "#ffffff" }, // Alverca
  "15784": { pattern: "solid", base: "#ffea01", accent: "#ffea01", trim: "#293dc2", print: "#293dc2" }, // Arouca
  "1929": { pattern: "solid", base: "#e83030", accent: "#e83030", trim: "#ffffff", print: "#ffffff" }, // Benfica
  "2994": { pattern: "solid", base: "#e30613", accent: "#e30613", sleeves: "#ffffff", trim: "#e30613", print: "#ffffff" }, // Braga
  "3472": { pattern: "stripes", base: "#ffffff", accent: "#111111", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Nacional
  "21581": { pattern: "solid", base: "#111111", accent: "#111111", trim: "#ffffff", print: "#ffffff" }, // Casa Pia
  "12216": { pattern: "solid", base: "#ffea01", accent: "#ffea01", trim: "#293dc2", print: "#293dc2" }, // Estoril
  "21610": { pattern: "solid", base: "#de0a26", accent: "#de0a26", trim: "#3b8132", print: "#ffffff" }, // Estrela da Amadora
  "12698": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#183760", print: "#183760" }, // Famalicão
  "437": { pattern: "stripes", base: "#ffffff", accent: "#0d4b9d", sleeves: "#0d4b9d", trim: "#0d4b9d", print: "#0d1b4a", printOutline: "#ffffff" }, // FC Porto
  "3699": { pattern: "solid", base: "#de1f26", accent: "#de1f26", trim: "#ffffff", print: "#ffffff" }, // Gil Vicente
  "552": { pattern: "stripes", base: "#e30613", accent: "#008222", trim: "#ffffff", print: "#ffffff", printOutline: "#111111" }, // Marítimo
  "3696": { pattern: "solid", base: "#00843d", accent: "#00843d", trim: "#ffffff", print: "#ffffff" }, // Moreirense
  "3822": { pattern: "stripes", base: "#ffffff", accent: "#3b8649", sleeves: "#3b8649", trim: "#3b8649", print: "#0a3d2a", printOutline: "#ffffff" }, // Rio Ave
  "12215": { pattern: "solid", base: "#c60000", accent: "#c60000", trim: "#ffffff", print: "#ffffff" }, // Santa Clara
  "2250": { pattern: "hoops", base: "#ffffff", accent: "#008127", trim: "#008127", print: "#111111", printOutline: "#ffffff" }, // Sporting CP
  "5309": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#111111", print: "#111111" }, // Vitória de Guimarães

  // Eredivisie
  "2726": { pattern: "halves", base: "#00843d", accent: "#ffd500", trim: "#00843d", print: "#ffffff", printOutline: "#00843d" }, // ADO Den Haag
  "140": { pattern: "solid", base: "#db0021", accent: "#db0021", trim: "#ffffff", print: "#ffffff" }, // AZ Alkmaar
  "139": { pattern: "vband", base: "#ffffff", accent: "#d2122e", trim: "#d2122e", print: "#111111", printOutline: "#ffffff" }, // Ajax
  "2566": { pattern: "stripes", base: "#e30613", accent: "#111111", trim: "#111111", print: "#ffffff", printOutline: "#111111" }, // Excelsior
  "145": { pattern: "stripes", base: "#ffffff", accent: "#00843d", sleeves: "#00843d", trim: "#00843d", print: "#0a2240", printOutline: "#ffffff" }, // FC Groningen
  "152": { pattern: "solid", base: "#e30613", accent: "#e30613", trim: "#ffffff", print: "#ffffff" }, // FC Twente
  "153": { pattern: "solid", base: "#d20515", accent: "#d20515", trim: "#ffffff", print: "#ffffff" }, // FC Utrecht
  "142": { pattern: "halves", base: "#ffffff", accent: "#e30613", trim: "#111111", print: "#111111", printOutline: "#ffffff" }, // Feyenoord
  "143": { pattern: "solid", base: "#fcee33", accent: "#fcee33", trim: "#00843d", print: "#00843d" }, // Fortuna Sittard
  "3706": { pattern: "hoops", base: "#e30613", accent: "#ffd500", trim: "#ffd500", print: "#ffffff", printOutline: "#e30613" }, // Go Ahead Eagles
  "146": { pattern: "stripes", base: "#ffffff", accent: "#003eff", sleeves: "#003eff", trim: "#003eff", print: "#0a2240", printOutline: "#ffffff" }, // Heerenveen
  "147": { pattern: "stripes", base: "#e30613", accent: "#111111", trim: "#00843d", print: "#ffffff", printOutline: "#111111" }, // NEC Nijmegen
  "2565": { pattern: "solid", base: "#1f4fa0", accent: "#1f4fa0", trim: "#ffffff", print: "#ffffff" }, // PEC Zwolle
  "148": { pattern: "stripes", base: "#ffffff", accent: "#ed1c24", sleeves: "#ed1c24", trim: "#ed1c24", print: "#111111", printOutline: "#ffffff" }, // PSV Eindhoven
  "3736": { pattern: "halves", base: "#fcee33", accent: "#0b3a8c", trim: "#0b3a8c", print: "#ffffff", printOutline: "#0b3a8c" }, // SC Cambuur
  "151": { pattern: "stripes", base: "#ffffff", accent: "#f31522", sleeves: "#f31522", trim: "#f31522", print: "#111111", printOutline: "#ffffff" }, // Sparta Rotterdam
  "3735": { pattern: "solid", base: "#ffffff", accent: "#ffffff", trim: "#c60000", print: "#c60000" }, // Telstar
  "156": { pattern: "stripes", base: "#ffffff", accent: "#e30613", trim: "#1a316b", print: "#1a316b", printOutline: "#ffffff" }, // Willem II
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
