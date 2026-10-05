import type { Kit, KitSet } from "./kits";

/**
 * Two club colours taken from the kits, for theming the panel headers: the
 * home shirt's most distinctive colour, and a second one from the rest of
 * the home kit or the change kits, chosen to differ clearly from the first.
 * Each comes with a dark-mode variant (lifted if too dark to show on the dark
 * surface) and an ink colour that reads on top of it.
 */
export interface ClubPalette {
  primary: Swatch;
  secondary: Swatch;
}

interface Swatch {
  light: string;
  dark: string;
  /** Text/icon colour on top of `light` and of `dark`. */
  inkLight: string;
  inkDark: string;
}

type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb => {
  const n = Number.parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** WCAG relative luminance (0 black – 1 white). */
function luminance([r, g, b]: Rgb) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** HSL saturation and lightness (0–1). */
function satLight([r, g, b]: Rgb) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

/** A colour with some identity: not white, black or a grey. */
function isColourful(hex: string) {
  const { s, l } = satLight(toRgb(hex));
  return s > 0.25 && l > 0.1 && l < 0.92;
}

/** Rough perceptual distance, so the two club colours don't look alike. */
function distance(a: string, b: string) {
  const [x, y] = [toRgb(a), toRgb(b)];
  const rMean = (x[0] + y[0]) / 2;
  const [dr, dg, db] = [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

const kitColours = (kit: Kit | null) =>
  kit ? [kit.base, kit.accent, kit.sleeves, kit.trim, kit.print].filter((c): c is string => !!c) : [];

function swatch(hex: string): Swatch {
  const rgb = toRgb(hex);
  // On the dark surface, very dark colours (navy, maroon) are lifted towards white.
  const lum = luminance(rgb);
  const dark = lum < 0.06 ? toHex(mix(rgb, [255, 255, 255], 0.38)) : toHex(rgb);
  const ink = (c: string) => (luminance(toRgb(c)) > 0.45 ? "#0c111d" : "#ffffff");
  return { light: toHex(rgb), dark, inkLight: ink(toHex(rgb)), inkDark: ink(dark) };
}

export function clubPalette(kits: KitSet, fallback = "#22c55e"): ClubPalette {
  const home = kitColours(kits.home);
  const change = [...kitColours(kits.away), ...kitColours(kits.third)];
  const primary = home.find(isColourful) ?? change.find(isColourful) ?? fallback;
  const secondary =
    [...home, ...change].find((c) => isColourful(c) && distance(c, primary) > 180) ??
    // A single-colour club: a deeper shade of the primary.
    toHex(mix(toRgb(primary), [0, 0, 0], 0.45));
  return { primary: swatch(primary), secondary: swatch(secondary) };
}

/** The palette as CSS custom properties, for an element whose subtree uses the club theme. */
export function clubThemeStyle(p: ClubPalette): React.CSSProperties {
  return {
    "--club-1-l": p.primary.light,
    "--club-1-d": p.primary.dark,
    "--club-1-ink-l": p.primary.inkLight,
    "--club-1-ink-d": p.primary.inkDark,
    "--club-2-l": p.secondary.light,
    "--club-2-d": p.secondary.dark,
    "--club-2-ink-l": p.secondary.inkLight,
    "--club-2-ink-d": p.secondary.inkDark,
  } as React.CSSProperties;
}
