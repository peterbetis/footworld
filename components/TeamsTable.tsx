import { getMessages, type Locale } from "@/lib/i18n";
import { getTeams, type Team } from "@/lib/teams";
import TeamRows from "./TeamRows";
import { CONCEAL, REVEAL } from "./sidebar";

export default async function TeamsTable({
  leagueSlug,
  leagueName,
  locale,
}: {
  leagueSlug: string;
  leagueName: string;
  locale: Locale;
}) {
  const t = getMessages(locale);
  let teams: Team[];
  try {
    teams = await getTeams(leagueSlug);
  } catch (err) {
    console.error(err);
    return (
      <TableShell title={t.leagueTeams(leagueName)}>
        <p className={`w-64 px-4 py-8 text-center text-sm text-muted ${REVEAL}`}>
          {t.teamsLoadError}
        </p>
      </TableShell>
    );
  }

  return (
    <TableShell title={t.leagueTeams(leagueName)} count={teams.length}>
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
      <h2 className="relative flex w-64 items-baseline justify-between border-b border-border px-4 py-3 text-sm font-bold">
        <span className={`whitespace-nowrap ${REVEAL}`}>{title}</span>
        {count != null && (
          <span className={`text-xs font-normal text-muted ${REVEAL}`}>{count}</span>
        )}
        {/* Expand hint shown while collapsed, centred in the logo strip. */}
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 flex w-[66px] items-center justify-center text-muted ${CONCEAL}`}
        >
          <svg viewBox="0 0 20 20" className="h-[1.1rem] w-[1.1rem]">
            <path
              d="M5 5l5 5-5 5M11 5l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </h2>
      {children}
    </section>
  );
}

export function TeamsTableSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label}>
      <div className="w-64 border-b border-border px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-border" />
      </div>
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="flex w-64 items-center gap-3 border-t border-border py-2 pr-4 pl-[17.5px] first:border-t-0"
        >
          <div className="h-7 w-7 animate-pulse rounded-full bg-border" />
          <div className="h-3 flex-1 animate-pulse rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
