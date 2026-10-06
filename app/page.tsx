import { redirect } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import InertOnPhones from "@/components/InertOnPhones";
import ClubPrompt from "@/components/ClubPrompt";
import LeaguePrompt from "@/components/LeaguePrompt";
import LeaguesMap from "@/components/LeaguesMap";
import { I18nProvider } from "@/components/I18nProvider";
import Squad, { SquadSkeleton } from "@/components/Squad";
import TeamsBar, { BarMessage, TeamsBarSkeleton } from "@/components/TeamsBar";
import TeamsTable, { TeamsTableSkeleton } from "@/components/TeamsTable";
import { REVEAL } from "@/components/sidebar";
import { getMessages, localeForLeague } from "@/lib/i18n";
import { getLeagues } from "@/lib/leagues";
import { getLeaguesMap } from "@/lib/leaguesMap";
import { getTeams } from "@/lib/teams";
import { getWorldMap } from "@/lib/worldMap";

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
        {/* Phones and tablets: with no league yet, everything below is blurred and inert
            behind the league prompt; with a league but no club, behind the club picker.
            On desktop the leagues map is used instead. */}
        <div className="lg:hidden">
          {!selected && (
            <LeaguePrompt leagues={leagues} title={t.pickLeagueTitle} subtitle={t.pickLeagueSubtitle} />
          )}
          {selected && !teamId && (
            <Suspense fallback={null}>
              <ClubPromptLoader leagueSlug={selected.slug} league={selected} />
            </Suspense>
          )}
        </div>
        <InertOnPhones active={!selected || !teamId} className="flex flex-1 flex-col">
          <Header leagues={leagues} selected={selected?.slug ?? null} />


          {/* Desktop: with a league but no team yet, the teams column stays expanded
              (its full width in the grid); otherwise it's a logo strip that widens over
              the main section on hover. */}
          <div
            className={`mx-auto grid w-full max-w-[100rem] flex-1 gap-5 px-4 py-5 sm:px-6 ${
              selected && !teamId
                ? "lg:grid-cols-[16rem_minmax(0,1fr)]"
                : "lg:grid-cols-[4.25rem_minmax(0,1fr)]"
            }`}
          >
            <main
              aria-label={t.mainContent}
              className="self-start overflow-clip rounded-2xl border border-border bg-surface lg:order-2"
            >
              {/* The leagues map, above the selected club: pick a league's country, then a
                  club. On desktop it's also how a league and club are first chosen. */}
              <LeaguesMapSection selectedLeague={selected?.slug ?? null} leagues={leagues} />
              {/* Small screens: the teams dropdown, between the leagues map and the squad. */}
              <div id="teams-bar" className="border-b border-border px-4 py-3 sm:px-6 lg:hidden">
                {selected ? (
                  // Keyed by league so switching shows the skeleton while new teams load.
                  <Suspense key={selected.slug} fallback={<TeamsBarSkeleton label={t.loadingTeams} />}>
                    <TeamsBar leagueSlug={selected.slug} leagueName={selected.name} locale={locale} />
                  </Suspense>
                ) : (
                  <BarMessage>{t.selectLeagueForTeams}</BarMessage>
                )}
              </div>
              {selected && teamId ? (
                // Keyed by team so switching shows the skeleton while the new squad loads.
                <Suspense
                  key={`${selected.slug}-${teamId}`}
                  fallback={<SquadSkeleton label={t.loadingSquad} />}
                >
                  <Squad leagueSlug={selected.slug} teamId={teamId} locale={locale} />
                </Suspense>
              ) : (
                <p className="flex min-h-96 items-center justify-center px-6 text-center text-sm text-muted lg:min-h-0 lg:py-8">
                  {selected ? t.selectTeamForSquad : t.selectLeagueThenTeam}
                </p>
              )}
            </main>
            {/* Desktop: teams sidebar, collapsed to a logo strip; widens over the
                main section while hovered or keyboard-focused, without reflowing it. */}
            <aside
              aria-label={t.teamsSidebar}
              data-expanded={(selected && !teamId) || undefined}
              className="group/teams relative z-30 hidden w-[4.25rem] self-start overflow-hidden rounded-2xl border border-border bg-surface transition-[width,box-shadow] duration-200 ease-out hover:w-64 hover:shadow-xl has-[:focus-visible]:w-64 has-[:focus-visible]:shadow-xl data-[expanded]:w-64 data-[expanded]:shadow-none lg:block"
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
        </InertOnPhones>
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

/** The leagues map, in the world map's coordinates, with each league country's view. */
function LeaguesMapSection({
  selectedLeague,
  leagues,
}: {
  selectedLeague: string | null;
  leagues: Awaited<ReturnType<typeof getLeagues>>;
}) {
  const world = getWorldMap();
  const data = getLeaguesMap(leagues.filter((l) => l.available));
  return (
    <LeaguesMap
      width={world.width}
      height={world.height}
      projection={world.projection}
      countries={data.countries}
      overview={data.overview}
      area={data.area}
      leagues={data.leagues}
      selectedLeague={selectedLeague}
    />
  );
}
