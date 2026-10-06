import "server-only";
import { geoBounds, geoCentroid, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world110 from "world-atlas/countries-110m.json";
import world50 from "world-atlas/countries-50m.json";
import type { League } from "./leagues";
import { boxForBounds, locateCountry, worldProjection } from "./worldMap";

/** A rectangle in map units; the browser fits it to the map's shape. */
export type MapBox = { x0: number; y0: number; x1: number; y1: number };

/** A league on the leagues map: its country, where its logo sits, and its zoomed-in view. */
export interface LeagueSpot {
  slug: string;
  urlSlug: string;
  name: string;
  logo: string;
  /** The league country's flag (SVG, flagcdn.com), shown under the logo. */
  flag: string | null;
  /** Map shape tinted for the league ("United Kingdom" for the Premier League). */
  countryKey: string | null;
  /** Logo position, in map units. */
  x: number;
  y: number;
  /** The league's country (mainland), framed when it's clicked. */
  box: MapBox;
}

// Each league country's mainland, as [west, south, east, north]: what fills the map
// when the country is clicked (England rather than the whole UK; no overseas islands).
const BOUNDS: Record<string, [number, number, number, number]> = {
  Spain: [-9.4, 35.9, 3.4, 43.8],
  England: [-5.8, 49.9, 1.8, 55.8],
  Italy: [6.6, 36.6, 18.6, 47.1],
  Germany: [5.8, 47.2, 15.1, 55.1],
  France: [-4.9, 42.3, 8.3, 51.1],
  Portugal: [-9.6, 36.9, -6.1, 42.2],
  Netherlands: [3.3, 50.7, 7.3, 53.6],
};

// Flag codes on flagcdn.com (a free flag CDN), which has England's own flag.
const FLAG_CODES: Record<string, string> = {
  Spain: "es",
  England: "gb-eng",
  Italy: "it",
  Germany: "de",
  France: "fr",
  Portugal: "pt",
  Netherlands: "nl",
};

// All seven countries together: the map's starting view.
const OVERVIEW: [number, number, number, number] = [-10.5, 35.5, 19.5, 56.5];

// Countries drawn on the leagues map. Zoomed into one country, the world map's 1:110m
// outlines look blocky, so countries centred in western and central Europe use Natural
// Earth's 1:50m outlines; the rest of the surrounding area keeps 1:110m (Russia in
// medium detail alone would weigh more than everything else). All are drawn in the
// world map's coordinates, so the same views and positions apply.
const DETAILED: [number, number, number, number] = [-12, 34, 26, 61];
const AREA: [number, number, number, number] = [-32, 25, 50, 73];

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;
const featuresOf = (topology: unknown) => {
  const t = topology as Topology<{ countries: GeometryCollection }>;
  return (feature(t, t.objects.countries) as FeatureCollection).features as CountryFeature[];
};
// By the country's centre, so overseas territories (French Guiana, the Canaries) don't
// rule out France or Spain.
const centredIn = (f: CountryFeature, [w0, s0, e0, n0]: [number, number, number, number]) => {
  const [lon, lat] = geoCentroid(f);
  return lon >= w0 && lon <= e0 && lat >= s0 && lat <= n0;
};
const touches = (f: CountryFeature, [w0, s0, e0, n0]: [number, number, number, number]) => {
  const [[w, s], [e, n]] = geoBounds(f);
  return w < e0 && e > w0 && s < n0 && n > s0;
};

let outlines: { key: string; name: string; d: string }[] | null = null;
function europeOutlines() {
  if (!outlines) {
    const projection = worldProjection();
    const fine = featuresOf(world50).filter((f) => centredIn(f, DETAILED));
    const fineNames = new Set(fine.map((f) => f.properties.name));
    const coarse = featuresOf(world110).filter(
      (f) => touches(f, AREA) && !fineNames.has(f.properties.name),
    );
    const finePath = geoPath(projection).digits(2);
    const coarsePath = geoPath(projection).digits(1);
    outlines = [
      ...coarse.map((f) => ({ key: f.properties.name, name: f.properties.name, d: coarsePath(f) ?? "" })),
      ...fine.map((f) => ({ key: f.properties.name, name: f.properties.name, d: finePath(f) ?? "" })),
    ];
  }
  return outlines;
}

export function getLeaguesMap(leagues: League[]) {
  const spots: LeagueSpot[] = leagues.flatMap((l) => {
    const at = locateCountry(l.country);
    const bounds = BOUNDS[l.country];
    if (!at || !bounds) return [];
    return [
      {
        slug: l.slug,
        urlSlug: l.urlSlug,
        name: l.name,
        logo: l.logo,
        flag: FLAG_CODES[l.country] ? `https://flagcdn.com/${FLAG_CODES[l.country]}.svg` : null,
        countryKey: at.countryKey,
        x: at.x,
        y: at.y,
        box: boxForBounds(bounds),
      },
    ];
  });
  return {
    countries: europeOutlines(),
    overview: boxForBounds(OVERVIEW),
    // Where countries are drawn: a selected nationality outside it can't be shown.
    area: boxForBounds(AREA),
    leagues: spots,
  };
}
