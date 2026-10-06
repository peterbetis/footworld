"use client";

import Image from "next/image";
import { use } from "react";
import type { ClubInfo } from "@/lib/clubInfo";
import { useT } from "./I18nProvider";
import { Field } from "./ProfileDialog";

/**
 * The club panel: a fixed (not zoomable) map of the league's country with a pin
 * on the stadium, and beside it on wide screens (below it on phones) the club's
 * full name, founding year, stadium, honours and last season, plus a stadium photo.
 */
export default function ClubInfoPanel({
  info: infoPromise,
  leagueName,
  kits,
  season,
}: {
  info: Promise<ClubInfo | null>;
  leagueName: string;
  /** The kits row (streams in separately), shown under the map. */
  kits: React.ReactNode;
  season: string;
}) {
  const t = useT();
  const info = use(infoPromise);
  const kitsBlock = (
    <section aria-label={t.kits}>
      <h3 className="mb-1.5 flex items-baseline gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {t.kits}
        {season && <span className="font-normal normal-case">{season}</span>}
      </h3>
      {kits}
    </section>
  );
  if (!info) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">{t.clubInfoUnavailable}</p>
        <div className="md:max-w-[50%]">{kitsBlock}</div>
      </div>
    );
  }

  const number = new Intl.NumberFormat(t.locale === "es" ? "es-ES" : "en-GB");
  const { map, stadium } = info;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* The country on its own, tinted in the club's colours, with the stadium pinned;
          the kits underneath. */}
      <div className="min-w-0 space-y-4">
        {map && (
          <figure className="rounded-xl border border-border bg-bg p-3">
            {/* Kept small and centred: the country is context, not the focus. */}
            <div className="relative mx-auto w-full max-w-72">
              <svg
                viewBox={`0 0 ${map.width} ${map.height}`}
                className="h-auto w-full"
                role="img"
                aria-label={stadium ? t.stadiumOnMap(stadium.name) : undefined}
              >
                <path
                  d={map.d}
                  fill="color-mix(in oklab, var(--club-1, var(--accent)) 16%, var(--surface))"
                  stroke="color-mix(in oklab, var(--club-1, var(--accent)) 70%, var(--text))"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {map.pin && (
                  <g transform={`translate(${map.pin.x} ${map.pin.y})`}>
                    {/* Soft halo, then a pin with its tip on the stadium. */}
                    <circle r="16" fill="var(--club-1, var(--accent))" opacity="0.18" />
                    <path
                      d="M0 0C-3-7-12-13-12-22a12 12 0 0 1 24 0C12-13 3-7 0 0Z"
                      fill="var(--club-1, var(--accent))"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle cy="-22" r="4.5" fill="var(--club-2, white)" stroke="white" strokeWidth="1.5" />
                  </g>
                )}
              </svg>
              {/* Hovering (or focusing) the pin shows the club's city above it. */}
              {map.pin && (info.city || stadium) && (
                <span
                  tabIndex={0}
                  aria-label={info.city ?? stadium?.name}
                  className="group/pin absolute h-10 w-8 -translate-x-1/2 -translate-y-[85%] cursor-default rounded-full outline-none focus-visible:outline-2 focus-visible:outline-accent"
                  style={{
                    left: `${(map.pin.x / map.width) * 100}%`,
                    top: `${(map.pin.y / map.height) * 100}%`,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 translate-y-1 rounded-md bg-text px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-surface opacity-0 shadow-md transition-[opacity,translate] duration-150 group-hover/pin:translate-y-0 group-hover/pin:opacity-100 group-focus-visible/pin:translate-y-0 group-focus-visible/pin:opacity-100"
                  >
                    {info.city ?? stadium?.name}
                  </span>
                </span>
              )}
            </div>
            {stadium && (
              <figcaption className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted">
                <svg viewBox="0 0 24 32" className="h-3 w-2.5 text-[var(--club-1,var(--accent))]" aria-hidden>
                  <path
                    d="M12 1C5.9 1 1 5.8 1 11.8 1 20 12 31 12 31s11-11 11-19.2C23 5.8 18.1 1 12 1Z"
                    fill="currentColor"
                  />
                </svg>
                {stadium.name}
              </figcaption>
            )}
          </figure>
        )}
        {kitsBlock}
      </div>

      <div className="min-w-0 space-y-5">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
          <Field label={t.fullName}>{info.fullName ?? <Unknown />}</Field>
          <Field label={t.city}>{info.city ?? <Unknown />}</Field>
          <Field label={t.founded}>{info.founded ?? <Unknown />}</Field>
          <Field label={t.lastSeason}>
            {info.lastSeason ? (
              info.lastSeason.position ? (
                <>
                  {t.leaguePosition(info.lastSeason.position)}
                  <span className="block text-xs font-normal text-muted">
                    {leagueName} {info.lastSeason.season.replace("-", "–")}
                  </span>
                </>
              ) : (
                <span className="text-muted">{t.notInLeagueLastSeason}</span>
              )
            ) : (
              <Unknown />
            )}
          </Field>
          <Field label={t.stadium}>
            {stadium ? (
              <>
                {stadium.name}
                {stadium.capacity && (
                  <span className="block text-xs font-normal text-muted">
                    {t.capacity(number.format(stadium.capacity))}
                  </span>
                )}
              </>
            ) : (
              <Unknown />
            )}
          </Field>
          <Field label={t.titles}>
            {info.titles ? (
              <ul className="space-y-0.5">
                <li>
                  <span className="font-bold tabular-nums">{info.titles.league}</span>{" "}
                  <span className="font-normal">{t.leagueTitles(info.titles.league)}</span>
                </li>
                {info.titles.europeanCups > 0 && (
                  <li>
                    <span className="font-bold tabular-nums">{info.titles.europeanCups}</span>{" "}
                    <span className="font-normal">{t.europeanCups(info.titles.europeanCups)}</span>
                  </li>
                )}
              </ul>
            ) : (
              <Unknown />
            )}
          </Field>
        </dl>

        {stadium?.photo && (
          <figure className="overflow-hidden rounded-xl border border-border bg-border">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={stadium.photo}
                alt={t.stadiumPhoto(stadium.name)}
                fill
                unoptimized
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </figure>
        )}
      </div>
    </div>
  );
}

function Unknown() {
  const t = useT();
  return <span className="text-muted">{t.unknown}</span>;
}

export function ClubInfoSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy aria-label={label} className="grid gap-6 md:grid-cols-2">
      <div className="aspect-[600/460] animate-pulse rounded-xl bg-border" />
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-border" />
            <div className="h-4 w-40 animate-pulse rounded bg-border" />
          </div>
        ))}
        <div className="aspect-[16/9] animate-pulse rounded-xl bg-border" />
      </div>
    </div>
  );
}
