import { redirect } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import ClubPrompt from "@/components/ClubPrompt";
import LeaguePrompt from "@/components/LeaguePrompt";
import { I18nProvider } from "@/components/I18nProvider";
import Squad, { SquadSkeleton } from "@/components/Squad";
import TeamsBar, { BarMessage, TeamsBarSkeleton } from "@/components/TeamsBar";
import TeamsTable, { TeamsTableSkeleton } from "@/components/TeamsTable";
import { REVEAL } from "@/components/sidebar";
import { getMessages, localeForLeague } from "@/lib/i18n";
import { getLeagues } from "@/lib/leagues";
import { getTeams } from "@/lib/teams";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const leagueParam = typeof params.league === "string" ? params.league : undefined;
  const teamParam = typeof params.team === "string" ? params.team : undefined;
  const leagues = await getLeagues();

  // URLs use readable names (?league=laliga&team=real-madrid). ESPN codes from
  // older links (?league=esp.1&team=86) are still understood, then redirected.
  // Nothing is selected until the user picks a league from the dropdown.
  const selected =
    leagues.find((l) => l.available && (l.urlSlug === leagueParam || l.slug === leagueParam)) ??
    null;
  const team =
    selected && teamParam
      ? (await getTeams(selected.slug).catch(() => [])).find(
          (t) => t.urlSlug === teamParam || t.id === teamParam,
        )
      : undefined;
  const teamId = team?.id ?? null;

  if (selected) {
    const canonical = `/?league=${selected.urlSlug}${team ? `&team=${team.urlSlug}` : ""}`;
    const current = `/?league=${leagueParam}${teamParam ? `&team=${teamParam}` : ""}`;
    if (canonical !== current) redirect(canonical);
  }
  const locale = localeForLeague(selected?.slug);
  const t = getMessages(locale);

  return (
    <I18nProvider locale={locale}>
      {/* lang follows the league, so screen readers switch pronunciation too. */}
      <div lang={locale} className="flex flex-1 flex-col">
        {/* No league yet: everything below is blurred and inert behind the league prompt. */}
        {!selected && (
          <LeaguePrompt leagues={leagues} title={t.pickLeagueTitle} subtitle={t.pickLeagueSubtitle} />
        )}
        {/* League but no club yet: the same, with the club picker. */}
        {selected && !teamId && (
          <Suspense fallback={null}>
            <ClubPromptLoader leagueSlug={selected.slug} league={selected} />
          </Suspense>
        )}
        <div inert={!selected || !teamId} className="flex flex-1 flex-col">
          <Header leagues={leagues} selected={selected?.slug ?? null} />

          {/* Small screens: teams dropdown in a bar under the header. */}
          <div className="border-b border-border bg-surface lg:hidden">
            <div className="mx-auto max-w-[100rem] px-4 py-3 sm:px-6">
              {selected ? (
                // Keyed by league so switching shows the skeleton while new teams load.
                <Suspense key={selected.slug} fallback={<TeamsBarSkeleton label={t.loadingTeams} />}>
                  <TeamsBar leagueSlug={selected.slug} leagueName={selected.name} locale={locale} />
                </Suspense>
              ) : (
                <BarMessage>{t.selectLeagueForTeams}</BarMessage>
              )}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[100rem] flex-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[4.25rem_minmax(0,1fr)]">
            <main
              aria-label={t.mainContent}
              className="self-start overflow-clip rounded-2xl border border-border bg-surface lg:order-2"
            >
              {selected && teamId ? (
                // Keyed by team so switching shows the skeleton while the new squad loads.
                <Suspense
                  key={`${selected.slug}-${teamId}`}
                  fallback={<SquadSkeleton label={t.loadingSquad} />}
                >
                  <Squad leagueSlug={selected.slug} teamId={teamId} locale={locale} />
                </Suspense>
              ) : (
                <p className="flex min-h-96 items-center justify-center px-6 text-center text-sm text-muted">
                  {selected ? t.selectTeamForSquad : t.selectLeagueThenTeam}
                </p>
              )}
            </main>
            {/* Desktop: teams sidebar, collapsed to a logo strip; widens over the
                main section while hovered or keyboard-focused, without reflowing it. */}
            <aside
              aria-label={t.teamsSidebar}
              className="group/teams relative z-30 hidden w-[4.25rem] self-start overflow-hidden rounded-2xl border border-border bg-surface transition-[width,box-shadow] duration-200 ease-out hover:w-64 hover:shadow-xl has-[:focus-visible]:w-64 has-[:focus-visible]:shadow-xl lg:block"
            >
              {selected ? (
                <Suspense
                  key={selected.slug}
                  fallback={<TeamsTableSkeleton label={t.loadingTeams} />}
                >
                  <TeamsTable leagueSlug={selected.slug} leagueName={selected.name} locale={locale} />
                </Suspense>
              ) : (
                <p className={`w-64 px-4 py-10 text-center text-sm text-muted ${REVEAL}`}>
                  {t.selectLeagueForTeams}
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </I18nProvider>
  );
}

/** The club prompt once the league's teams are in (shares the cached fetch); none if they fail. */
async function ClubPromptLoader({
  leagueSlug,
  league,
}: {
  leagueSlug: string;
  league: { name: string; logo: string };
}) {
  const teams = await getTeams(leagueSlug).catch(() => null);
  if (!teams?.length) return null;
  return <ClubPrompt teams={teams} league={{ name: league.name, logo: league.logo }} />;
}
