"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Team } from "@/lib/teams";
import { useSelectedTeam } from "@/lib/useSelectedTeam";
import { useT } from "./I18nProvider";

/**
 * League picked but no club yet: the page is blurred behind a centred card
 * with every club's crest to choose from, and a way back to the league prompt.
 */
export default function ClubPrompt({
  teams,
  league,
}: {
  teams: Team[];
  league: { name: string; logo: string };
}) {
  const t = useT();
  const router = useRouter();
  const { selectedSlug, toggle } = useSelectedTeam();
  const [leaving, startLeaving] = useTransition();
  // Optimistic: set as soon as a crest is clicked, while that squad loads.
  const loading = selectedSlug;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-prompt-title"
      className="league-prompt fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 pt-[8vh] pb-10 backdrop-blur-md"
    >
      <div className="league-prompt-card w-full max-w-3xl rounded-3xl border border-white/10 bg-header p-5 text-white shadow-2xl sm:p-8">
        {/* On phones the "change league" button wraps onto its own row under the title. */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          {league.logo && (
            <Image
              src={league.logo}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 object-contain"
            />
          )}
          <div className="min-w-0 flex-1 basis-48">
            <h2 id="club-prompt-title" className="text-2xl font-extrabold tracking-tight">
              {t.pickClubTitle(league.name)}
            </h2>
            <p className="mt-1 text-sm text-white/70">{t.pickClubSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => startLeaving(() => router.replace("/"))}
            disabled={leaving}
            className="shrink-0 cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold max-sm:order-last max-sm:basis-full text-white/80 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
          >
            {t.changeLeague}
          </button>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {teams.map((team, i) => {
            const isLoading = loading === team.urlSlug;
            return (
              <li key={team.id}>
                <button
                  type="button"
                  // Focus starts on the first club, so the keyboard works straight away.
                  autoFocus={i === 0}
                  disabled={loading !== null}
                  onClick={() => toggle(team.urlSlug)}
                  className={`relative flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded-xl border px-2 pt-3 pb-2.5 text-center transition-[background-color,border-color,opacity,translate] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default ${
                    isLoading
                      ? "border-accent bg-accent/15"
                      : loading
                        ? "border-white/5 opacity-40"
                        : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/10"
                  }`}
                >
                  {team.logoDark ? (
                    <Image
                      src={team.logoDark}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 object-contain"
                    />
                  ) : (
                    <span aria-hidden className="h-11 w-11 rounded-full bg-white/10" />
                  )}
                  <span className="line-clamp-2 text-xs leading-tight font-semibold">
                    {team.name}
                  </span>
                  {isLoading && (
                    <span
                      aria-hidden
                      className="absolute top-2 right-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
