import "server-only";

export interface PitchSlot {
  /** ESPN/Opta formation place, 1 (goalkeeper) to 11. */
  place: number;
  /** Position code, e.g. "LB", "CD-R", "AM", "F". */
  position: string;
  playerId: string;
  name: string;
  shirtName: string;
  number: number | null;
  /** Starts in this slot across the matches that used the formation. */
  starts: number;
  /** 0 = own goal line, 100 = opponent's goal line. */
  depth: number;
  /** 0 = team's left touchline, 100 = team's right. */
  lateral: number;
}

export interface TeamFormation {
  formation: string;
  /** League matches that used this formation, out of those analysed. */
  matchesUsed: number;
  matchesAnalysed: number;
  slots: PitchSlot[];
}

// Most recent completed league matches to analyse.
const MATCH_LIMIT = 10;

interface EspnSchedule {
  events?: {
    id: string;
    date: string;
    competitions?: { status?: { type?: { completed?: boolean } } }[];
  }[];
}

interface EspnSummary {
  rosters?: {
    team: { id: string };
    formation?: string;
    roster?: {
      starter?: boolean;
      jersey?: string;
      formationPlace?: string;
      position?: { abbreviation?: string };
      athlete: { id: string; displayName: string; lastName?: string };
    }[];
  }[];
}

interface Lineup {
  formation: string;
  starters: {
    place: number;
    position: string;
    playerId: string;
    name: string;
    lastName: string;
    jersey: string | undefined;
  }[];
}

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

async function getLineup(leagueSlug: string, eventId: string, teamId: string) {
  const res = await fetch(`${BASE}/${leagueSlug}/summary?event=${eventId}`, {
    next: { revalidate: 86_400 }, // finished matches don't change
  });
  if (!res.ok) return null;
  const data: EspnSummary = await res.json();
  const side = data.rosters?.find((r) => String(r.team.id) === teamId);
  if (!side?.formation) return null;
  const starters = (side.roster ?? [])
    .filter((p) => p.starter && p.formationPlace)
    .map((p) => ({
      place: Number(p.formationPlace),
      position: p.position?.abbreviation ?? "",
      playerId: p.athlete.id,
      name: p.athlete.displayName,
      lastName: p.athlete.lastName ?? "",
      jersey: p.jersey,
    }));
  return starters.length === 11 ? ({ formation: side.formation, starters } satisfies Lineup) : null;
}

/* ---------- pitch layout ---------- */

// Defence-to-attack rank of each position code. Lines are rebuilt by sorting
// on this and splitting by the formation string, so codes only need the right
// relative order (e.g. "SW" in a 4-1-3-2 is the holding midfielder, and the
// "CF-L/CF-R" pair sits behind a lone "F" in a 3-4-2-1).
function depthRank(code: string) {
  if (code === "G") return 0;
  if (code === "SW") return 1.5;
  if (code === "DM" || code.startsWith("DM-")) return 2;
  if (/^(RB|LB|RWB|LWB)$/.test(code) || code.startsWith("CD")) return 1;
  if (code.startsWith("AM")) return 4;
  if (code.startsWith("CF")) return 5;
  if (/^(F|LF|RF|ST|LW|RW)$/.test(code)) return 6;
  return 3; // CM, CM-L, CM-R, LM, RM and anything unknown
}

/** Left (negative) to right (positive), from the team's point of view. */
function lateralRank(code: string) {
  if (/^(LB|LWB|LM|LF|LW)$/.test(code)) return -2;
  if (/^(RB|RWB|RM|RF|RW)$/.test(code)) return 2;
  if (code.endsWith("-L")) return -1;
  if (code.endsWith("-R")) return 1;
  return 0;
}

function layout(formation: string, slots: Omit<PitchSlot, "depth" | "lateral">[]): PitchSlot[] {
  const keeper = slots.filter((s) => s.position === "G");
  const outfield = slots
    .filter((s) => s.position !== "G")
    .sort((a, b) => depthRank(a.position) - depthRank(b.position));

  // Split into lines by the formation ("4-2-3-1" → 4, 2, 3, 1); fall back to
  // grouping by rank if the string doesn't add up to the outfield count.
  const sizes = formation.split("-").map(Number);
  let lines: (typeof outfield)[];
  if (sizes.every((n) => n > 0) && sizes.reduce((a, b) => a + b, 0) === outfield.length) {
    let i = 0;
    lines = sizes.map((n) => outfield.slice(i, (i += n)));
  } else {
    const byRank = new Map<number, typeof outfield>();
    for (const s of outfield) byRank.set(depthRank(s.position), [...(byRank.get(depthRank(s.position)) ?? []), s]);
    lines = [...byRank.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
  }

  // Far enough off the goal line that the keeper's icon isn't clipped on small pitches.
  const placed: PitchSlot[] = keeper.map((s) => ({ ...s, depth: 9, lateral: 50 }));
  lines.forEach((line, row) => {
    // Defence just outside the box (22%) to attack around the opponent's box edge (80%).
    const depth = lines.length === 1 ? 50 : 22 + (58 * row) / (lines.length - 1);
    const ordered = [...line].sort((a, b) => lateralRank(a.position) - lateralRank(b.position));
    // Wider lines spread further: 26% between neighbours, up to 80% of the
    // pitch width, centred (a back four sits at 11/37/63/89%).
    const n = ordered.length;
    const spread = Math.min(80, 26 * (n - 1));
    ordered.forEach((s, i) => {
      const lateral = n === 1 ? 50 : 50 - spread / 2 + (spread * i) / (n - 1);
      placed.push({ ...s, depth, lateral });
    });
  });
  return placed;
}

/* ---------- public API ---------- */

/**
 * The team's most-used formation over its recent league matches, with the
 * most frequent starter in each position of that formation.
 */
export async function getFormation(
  leagueSlug: string,
  teamId: string,
  squad: { id: string; shirtName: string; number: number | null }[],
): Promise<TeamFormation | null> {
  const res = await fetch(`${BASE}/${leagueSlug}/teams/${encodeURIComponent(teamId)}/schedule`, {
    next: { revalidate: 3_600 },
  });
  if (!res.ok) throw new Error(`ESPN schedule ${res.status} for ${leagueSlug}/${teamId}`);
  const schedule: EspnSchedule = await res.json();

  const recent = (schedule.events ?? [])
    .filter((e) => e.competitions?.[0]?.status?.type?.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MATCH_LIMIT);
  const lineups = (await Promise.all(recent.map((e) => getLineup(leagueSlug, e.id, teamId)))).filter(
    (l): l is Lineup => l !== null,
  );
  if (lineups.length === 0) return null;

  // Most-used formation; ties go to the most recent (lineups are newest first).
  const counts = new Map<string, number>();
  for (const l of lineups) counts.set(l.formation, (counts.get(l.formation) ?? 0) + 1);
  const formation = [...counts.entries()].reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
  const used = lineups.filter((l) => l.formation === formation);

  // Tally who started in each place, then assign greedily from the most
  // frequent pairing so no player fills two places.
  const tally = new Map<string, { place: number; playerId: string; starts: number; latest: Lineup["starters"][number] }>();
  const placeCodes = new Map<number, Map<string, number>>();
  for (const l of used) {
    for (const s of l.starters) {
      const key = `${s.place}:${s.playerId}`;
      const cur = tally.get(key);
      if (cur) cur.starts++;
      else tally.set(key, { place: s.place, playerId: s.playerId, starts: 1, latest: s });
      const codes = placeCodes.get(s.place) ?? new Map<string, number>();
      codes.set(s.position, (codes.get(s.position) ?? 0) + 1);
      placeCodes.set(s.place, codes);
    }
  }
  const takenPlaces = new Set<number>();
  const takenPlayers = new Set<string>();
  const byId = new Map(squad.map((p) => [p.id, p]));
  const slots: Omit<PitchSlot, "depth" | "lateral">[] = [];
  for (const t of [...tally.values()].sort((a, b) => b.starts - a.starts)) {
    if (takenPlaces.has(t.place) || takenPlayers.has(t.playerId)) continue;
    takenPlaces.add(t.place);
    takenPlayers.add(t.playerId);
    const codes = placeCodes.get(t.place)!;
    const position = [...codes.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    const current = byId.get(t.playerId);
    const jersey = Number.parseInt(t.latest.jersey ?? "", 10);
    slots.push({
      place: t.place,
      position,
      playerId: t.playerId,
      name: t.latest.name,
      // Prefer the current squad's shirt details; fall back to the match sheet
      // for players who have since left.
      shirtName: current?.shirtName ?? (t.latest.lastName || t.latest.name).toUpperCase(),
      number: current ? current.number : Number.isFinite(jersey) ? jersey : null,
      starts: t.starts,
    });
  }

  return {
    formation,
    matchesUsed: used.length,
    matchesAnalysed: lineups.length,
    slots: layout(formation, slots),
  };
}
