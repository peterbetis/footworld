import { getTeams, type Team } from "@/lib/teams";
import TeamRows from "./TeamRows";

export default async function TeamsTable({
  leagueSlug,
  leagueName,
}: {
  leagueSlug: string;
  leagueName: string;
}) {
  let teams: Team[];
  try {
    teams = await getTeams(leagueSlug);
  } catch (err) {
    console.error(err);
    return (
      <TableShell title={`${leagueName} teams`}>
        <p className="px-4 py-8 text-center text-sm text-muted">
          Couldn&apos;t load teams right now. Try again shortly.
        </p>
      </TableShell>
    );
  }

  return (
    <TableShell title={`${leagueName} teams`} count={teams.length}>
      <TeamRows teams={teams} />
    </TableShell>
  );
}

function TableShell({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h2 className="flex items-baseline justify-between border-b border-border px-4 py-3 text-sm font-bold">
        {title}
        {count != null && <span className="text-xs font-normal text-muted">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

export function TeamsTableSkeleton() {
  return (
    <div aria-busy aria-label="Loading teams">
      <div className="border-b border-border px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-border" />
      </div>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-border px-4 py-2 first:border-t-0">
          <div className="h-7 w-7 animate-pulse rounded-full bg-border" />
          <div className="h-3 flex-1 animate-pulse rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
