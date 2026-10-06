import "server-only";
import {
  geoArea,
  geoCentroid,
  geoMercator,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

export interface MapCountry {
  key: string;
  name: string;
  /** SVG path in map units. */
  d: string;
}

export interface WorldMap {
  width: number;
  height: number;
  countries: MapCountry[];
  /** Initial (and reset) view: zoom k and offset tx/ty in map units. */
  defaultView: { k: number; tx: number; ty: number };
  /**
   * The Mercator projection, so the browser can place points (birthplaces):
   * x = tx + scale·λ, y = ty − scale·ln(tan(π/4 + φ/2)), with λ, φ in radians.
   */
  projection: { scale: number; tx: number; ty: number };
}

export interface MapPoint {
  /** Position in map units. */
  x: number;
  y: number;
  /** Map country to tint for this nationality, if it has a shape on the map. */
  countryKey: string | null;
}

const WIDTH = 960;

// ESPN nationality names that differ from Natural Earth's short names.
const ALIASES: Record<string, string> = {
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "Bosnia-Herzegovina": "Bosnia and Herz.",
  "Central African Republic": "Central African Rep.",
  "Congo DR": "Dem. Rep. Congo",
  "DR Congo": "Dem. Rep. Congo",
  "Czech Republic": "Czechia",
  "Dominican Republic": "Dominican Rep.",
  "Equatorial Guinea": "Eq. Guinea",
  Eswatini: "eSwatini",
  "Ivory Coast": "Côte d'Ivoire",
  "Korea Republic": "South Korea",
  "North Macedonia": "Macedonia",
  "Republic of Ireland": "Ireland",
  "South Sudan": "S. Sudan",
  "Trinidad & Tobago": "Trinidad and Tobago",
  Türkiye: "Turkey",
  USA: "United States of America",
  "United States": "United States of America",
};

// Nations without their own shape on a 1:110m map (home nations, small islands
// and microstates): [longitude, latitude] and the shape to tint, if any.
const FIXED: Record<string, { at: [number, number]; tint?: string }> = {
  England: { at: [-1.5, 52.6], tint: "United Kingdom" },
  Scotland: { at: [-4.2, 56.8], tint: "United Kingdom" },
  Wales: { at: [-3.7, 52.3], tint: "United Kingdom" },
  "Northern Ireland": { at: [-6.7, 54.6], tint: "United Kingdom" },
  "Cape Verde Islands": { at: [-23.6, 15.1] },
  "Cape Verde": { at: [-23.6, 15.1] },
  Malta: { at: [14.4, 35.9] },
  Andorra: { at: [1.6, 42.5] },
  Liechtenstein: { at: [9.55, 47.15] },
  "San Marino": { at: [12.45, 43.94] },
  Gibraltar: { at: [-5.35, 36.14] },
  "Faroe Islands": { at: [-6.9, 62.0] },
  Comoros: { at: [43.9, -11.9] },
  Mauritius: { at: [57.55, -20.3] },
  "São Tomé and Príncipe": { at: [6.6, 0.25] },
  Curaçao: { at: [-68.95, 12.15] },
  Martinique: { at: [-61.0, 14.65] },
  Guadeloupe: { at: [-61.55, 16.25] },
  "French Guiana": { at: [-53.1, 3.9], tint: "France" },
  Grenada: { at: [-61.68, 12.12] },
  Bermuda: { at: [-64.75, 32.3] },
  Singapore: { at: [103.82, 1.35] },
};

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;

// Built once per server process: the outlines never change.
const built = (() => {
  const topology = world as unknown as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  const all = (
    feature(topology, topology.objects.countries) as FeatureCollection<
      Polygon | MultiPolygon,
      { name: string }
    >
  ).features as CountryFeature[];
  const features = all.filter(
    (f) => f.properties.name !== "Antarctica" && f.properties.name !== "Fr. S. Antarctic Lands",
  );

  const projection = geoMercator().fitWidth(WIDTH, {
    type: "FeatureCollection",
    features,
  } as GeoPermissibleObjects);
  const path = geoPath(projection).digits(0);
  const collection = { type: "FeatureCollection", features } as GeoPermissibleObjects;
  // Shift the projection so the map starts at y = 0.
  const [[, y0], [, y1]] = path.bounds(collection);
  const [tx, ty] = projection.translate();
  projection.translate([tx, ty - y0]);

  const byName = new Map(features.map((f) => [f.properties.name, f]));
  const keyOf = (f: CountryFeature) => f.properties.name;

  const height = Math.ceil(y1 - y0);

  // Default view: aligned to the map's bottom edge, zoomed 10% past the point where
  // only the southern 55% of Greenland shows at the top, and centred horizontally on
  // Spain (Madrid's longitude).
  const GREENLAND_VISIBLE = 0.55;
  const EXTRA_ZOOM = 1.1;
  const greenland = byNameFor(features, "Greenland");
  const [[, gTop], [, gBottom]] = greenland ? path.bounds(greenland) : [[0, 0], [0, height * 0.4]];
  const topEdge = gBottom - GREENLAND_VISIBLE * (gBottom - gTop);
  const k = (height / (height - topEdge)) * EXTRA_ZOOM;
  const spainX = projection([-3.7, 40.4])![0];
  const defaultView = { k, tx: WIDTH / 2 - spainX * k, ty: height - height * k };

  const map: WorldMap = {
    width: WIDTH,
    height,
    countries: features.map((f) => ({ key: keyOf(f), name: f.properties.name, d: path(f) ?? "" })),
    defaultView,
    projection: {
      scale: projection.scale(),
      tx: projection.translate()[0],
      ty: projection.translate()[1],
    },
  };

  return { map, projection, byName, keyOf };
})();

function byNameFor(features: CountryFeature[], name: string) {
  return features.find((f) => f.properties.name === name);
}

export function getWorldMap(): WorldMap {
  return built.map;
}

/** Visual centre of a country: the centroid of its largest polygon (so France sits in Europe, not between it and French Guiana). */
function mainlandCentroid(f: CountryFeature): [number, number] {
  if (f.geometry.type === "Polygon") return geoCentroid(f);
  const largest = f.geometry.coordinates
    .map((coordinates) => ({ type: "Polygon" as const, coordinates }))
    .reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
  return geoCentroid(largest);
}

/** Where to pin a nationality on the map, or null if it can't be placed. */
export function locateCountry(name: string): MapPoint | null {
  const fixed = FIXED[name];
  const f = fixed ? null : built.byName.get(ALIASES[name] ?? name);
  const lonLat = fixed ? fixed.at : f ? mainlandCentroid(f) : null;
  if (!lonLat) return null;
  const xy = built.projection(lonLat);
  if (!xy) return null;
  const tint = fixed?.tint ? built.byName.get(fixed.tint) : f;
  return { x: xy[0], y: xy[1], countryKey: tint ? built.keyOf(tint) : null };
}

/** A longitude/latitude box ([west, south, east, north]) as a rectangle in map units. */
export function boxForBounds([west, south, east, north]: [number, number, number, number]) {
  const [x0, y0] = built.projection([west, north])!;
  const [x1, y1] = built.projection([east, south])!;
  return { x0, y0, x1, y1 };
}

/** The world map's projection, for drawing other map data in the same coordinates. */
export function worldProjection() {
  return built.projection;
}
