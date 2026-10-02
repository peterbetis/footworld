import { getTeams, type Team } from "@/lib/teams";
import TeamsDropdown from "./TeamsDropdown";

export default async function TeamsBar({
  leagueSlug,
  leagueName,
}: {
  leagueSlug: string;
  leagueName: string;
}) {
  let teams: Team[];
  try {
    // Shares the cached fetch with the desktop sidebar table.
    teams = await getTeams(leagueSlug);
  } catch (err) {
    console.error(err);
    return <BarMessage>Couldn&apos;t load teams right now. Try again shortly.</BarMessage>;
  }
  return <TeamsDropdown leagueName={leagueName} teams={teams} />;
}

/** Placeholder with the same footprint as the dropdown button. */
export function BarMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[50px] items-center rounded-xl border border-dashed border-border px-3 text-sm text-muted">
      {children}
    </div>
  );
}

export function TeamsBarSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading teams"
      className="flex min-h-[50px] items-center gap-3 rounded-xl border border-border px-2"
    >
      <div className="h-8 w-8 animate-pulse rounded-full bg-border" />
      <div className="h-3 w-36 animate-pulse rounded bg-border" />
    </div>
  );
}
