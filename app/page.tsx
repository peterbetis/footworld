import { Suspense } from "react";
import Header from "@/components/Header";
import Squad, { SquadSkeleton } from "@/components/Squad";
import TeamsBar, { BarMessage, TeamsBarSkeleton } from "@/components/TeamsBar";
import TeamsTable, { TeamsTableSkeleton } from "@/components/TeamsTable";
import { REVEAL } from "@/components/sidebar";
import { getLeagues } from "@/lib/leagues";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { league, team } = await searchParams;
  const leagues = await getLeagues();
  // Nothing is selected until the user picks a league from the dropdown.
  const selected = leagues.find((l) => l.slug === league && l.available) ?? null;
  const teamId = selected && typeof team === "string" && /^\d+$/.test(team) ? team : null;

  return (
    <>
      <Header leagues={leagues} selected={selected?.slug ?? null} />

      {/* Small screens: teams dropdown in a bar under the header. */}
      <div className="border-b border-border bg-surface lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          {selected ? (
            // Keyed by league so switching shows the skeleton while new teams load.
            <Suspense key={selected.slug} fallback={<TeamsBarSkeleton />}>
              <TeamsBar leagueSlug={selected.slug} leagueName={selected.name} />
            </Suspense>
          ) : (
            <BarMessage>Select a league to see its teams.</BarMessage>
          )}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[4.25rem_minmax(0,1fr)]">
        <main
          aria-label="Main content"
          className="min-h-96 overflow-hidden rounded-2xl border border-border bg-surface lg:order-2"
        >
          {selected && teamId ? (
            // Keyed by team so switching shows the skeleton while the new squad loads.
            <Suspense key={`${selected.slug}-${teamId}`} fallback={<SquadSkeleton />}>
              <Squad leagueSlug={selected.slug} teamId={teamId} />
            </Suspense>
          ) : (
            <p className="flex min-h-96 items-center justify-center px-6 text-center text-sm text-muted">
              {selected
                ? "Select a team to see its squad."
                : "Select a league, then a team, to see its squad."}
            </p>
          )}
        </main>
        {/* Desktop: teams sidebar, collapsed to a logo strip; widens over the
            main section while hovered or keyboard-focused, without reflowing it. */}
        <aside
          aria-label="Teams"
          className="group/teams relative z-30 hidden w-[4.25rem] self-start overflow-hidden rounded-2xl border border-border bg-surface transition-[width,box-shadow] duration-200 ease-out hover:w-80 hover:shadow-xl has-[:focus-visible]:w-80 has-[:focus-visible]:shadow-xl lg:block"
        >
          {selected ? (
            <Suspense key={selected.slug} fallback={<TeamsTableSkeleton />}>
              <TeamsTable leagueSlug={selected.slug} leagueName={selected.name} />
            </Suspense>
          ) : (
            <p className={`w-80 px-4 py-10 text-center text-sm text-muted ${REVEAL}`}>
              Select a league to see its teams.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
