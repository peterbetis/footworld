import type { NextRequest } from "next/server";
import { getLeagueClubs } from "@/lib/leagueClubs";
import { getLeagues } from "@/lib/leagues";

// GET /api/league-clubs?league=eng.1&lang=en — a league's clubs with stadium
// coordinates and city, for the leagues map.
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("league");
  const leagues = await getLeagues();
  if (!slug || !leagues.some((l) => l.slug === slug && l.available)) {
    return Response.json({ error: "unknown league" }, { status: 400 });
  }
  try {
    const locale = request.nextUrl.searchParams.get("lang") === "es" ? "es" : "en";
    return Response.json(await getLeagueClubs(slug, locale), {
      // Stadiums don't move; let the browser and CDN keep this for a day.
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return Response.json({ error: "lookup failed" }, { status: 502 });
  }
}
