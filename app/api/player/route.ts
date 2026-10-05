import type { NextRequest } from "next/server";
import { getPlayerProfile } from "@/lib/playerProfile";

// GET /api/player?name=Bukayo%20Saka&born=2001-09-05&lang=en — the player modal's details.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const name = params.get("name")?.trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });
  const born = params.get("born");
  const locale = params.get("lang") === "es" ? "es" : "en";

  try {
    const profile = await getPlayerProfile(
      name,
      born && /^\d{4}-\d{2}-\d{2}$/.test(born) ? born : null,
      locale,
    );
    return Response.json(profile, {
      // Biographies rarely change; let the browser and CDN keep them for a day.
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return Response.json({ error: "lookup failed" }, { status: 502 });
  }
}
