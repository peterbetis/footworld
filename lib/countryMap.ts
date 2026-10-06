import "server-only";
import { geoArea, geoCentroid, geoDistance, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-50m.json";

/** A single country drawn on its own (no neighbours), with a pin, for the club panel. */
export interface CountryMap {
  width: number;
  height: number;
  /** SVG path of the country. */
  d: string;
  /** The pin, in the same units; null if there's nothing to pin. */
  pin: { x: number; y: number } | null;
}

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;

// League countries by their Natural Earth names (England plays in the UK's outline).
const NATURAL_EARTH: Record<string, string> = { England: "United Kingdom" };

const WIDTH = 600;
const HEIGHT = 460;
const PAD = 18;
// Islands further than this from the mainland's centre (~830 km) are left off,
// so France isn't shrunk to fit French Guiana, or Spain the Canaries.
const MAX_ISLAND_DISTANCE = 0.13; // radians
// Islands drawn around an offshore stadium (~320 km: São Miguel and its neighbours).
const NEARBY_ISLANDS = 0.05;

let byName: Map<string, CountryFeature> | null = null;
function countries() {
  if (!byName) {
    const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
    const all = (feature(topology, topology.objects.countries) as FeatureCollection)
      .features as CountryFeature[];
    byName = new Map(all.map((f) => [f.properties.name, f]));
  }
  return byName;
}

/**
 * The part of the country to draw: the mainland and nearby islands, or, for a
 * stadium far offshore (the Azores, the Canaries), the islands around it instead.
 */
function region(f: CountryFeature, pin: [number, number] | null): CountryFeature {
  const polygons =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const asFeature = (coordinates: Polygon["coordinates"]) =>
    ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } }) as Feature<Polygon>;
  const largest = polygons.reduce((a, b) => (geoArea(asFeature(b)) > geoArea(asFeature(a)) ? b : a));
  const centre = geoCentroid(asFeature(largest));
  let kept = polygons.filter(
    (p) => geoDistance(geoCentroid(asFeature(p)), centre) < MAX_ISLAND_DISTANCE,
  );
  if (pin && geoDistance(pin, centre) >= MAX_ISLAND_DISTANCE) {
    const near = polygons.filter(
      (p) => geoDistance(geoCentroid(asFeature(p)), pin) < NEARBY_ISLANDS,
    );
    if (near.length > 0) kept = near;
  }
  return { ...f, geometry: { type: "MultiPolygon", coordinates: kept } };
}

export function countryMap(
  country: string,
  pin: { lat: number; lon: number } | null,
): CountryMap | null {
  const f = countries().get(NATURAL_EARTH[country] ?? country);
  if (!f) return null;
  const at: [number, number] | null = pin ? [pin.lon, pin.lat] : null;
  const shape = region(f, at);
  // Fitted to the shape and the pin, so the pin is always in frame.
  const projection = geoMercator().fitExtent(
    [
      [PAD, PAD],
      [WIDTH - PAD, HEIGHT - PAD],
    ],
    {
      type: "FeatureCollection",
      features: at
        ? [shape, { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: at } }]
        : [shape],
    } as FeatureCollection,
  );
  const d = geoPath(projection).digits(1)(shape) ?? "";
  const xy = at ? projection(at) : null;
  return { width: WIDTH, height: HEIGHT, d, pin: xy ? { x: xy[0], y: xy[1] } : null };
}
