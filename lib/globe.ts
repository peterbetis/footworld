import "server-only";
import { geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { merge } from "topojson-client";
import type { GeometryCollection, MultiPolygon, Polygon, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

export interface Globe {
  /** Land outline (all countries merged) on a 100 × 100 canvas. */
  land: string;
  /** Latitude/longitude lines every 10°. */
  graticule: string;
}

// Built once per server process: a small orthographic globe for the app logo,
// tilted to show Europe, Africa and the Atlantic.
const globe: Globe = (() => {
  const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
  // Every country in this file is a polygon or multipolygon.
  const land = merge(topology, topology.objects.countries.geometries as (Polygon | MultiPolygon)[]);
  const projection = geoOrthographic()
    .rotate([-10, -30])
    .scale(49)
    .translate([50, 50])
    .clipAngle(90);
  const path = geoPath(projection).digits(1);
  return {
    land: path(land as GeoPermissibleObjects) ?? "",
    graticule: path(geoGraticule10()) ?? "",
  };
})();

export function getGlobe(): Globe {
  return globe;
}
