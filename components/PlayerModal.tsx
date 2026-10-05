"use client";

import { Suspense, use, useEffect } from "react";
import type { TeamFormation } from "@/lib/formation";
import type { Player } from "@/lib/players";
import { profileKey, requestProfile, useProfiles } from "@/lib/profileStore";
import type { Team } from "@/lib/teams";
import { Markings } from "./FormationPitch";
import { useT } from "./I18nProvider";
import ProfileDialog, { BirthDateValue, BirthPlaceValue, Field, Skeleton } from "./ProfileDialog";

/**
 * A selected player's profile (see ProfileDialog): photo, full name, position
 * with their usual spot on a mini pitch, date of birth, height and birthplace.
 */
export default function PlayerModal({
  player,
  team,
  league,
  formation,
  open,
  onClose,
}: {
  /** Kept after closing, so the content doesn't vanish mid-fade. */
  player: Player | null;
  team?: Team;
  league?: { name: string; logo: string };
  /** The team's line-ups, for the player's usual spot on the mini pitch. */
  formation?: Promise<TeamFormation | null>;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const profiles = useProfiles();

  // Load the profile (shared with the map's birthplace pins), ahead of any queued pins.
  useEffect(() => {
    if (open && player) requestProfile(player, t.locale, true);
  }, [open, player, t.locale]);

  const entry = player ? profiles.get(profileKey(player.id, t.locale)) : undefined;
  const loading = entry === undefined;
  const profile = entry && entry !== "error" ? entry : null;
  // Flag of the birthplace's country (Wikidata); otherwise the player's nationality
  // flag, so the field always ends with one.
  const birthFlag = profile?.birthFlag
    ? { src: profile.birthFlag, padded: false }
    : player?.nationality
      ? { src: player.nationality.flag, padded: true }
      : null;
  // Wikidata's exact height once loaded; ESPN's (rounded from inches) until then.
  const height = profile?.heightCm ?? player?.heightCm ?? null;

  return (
    <ProfileDialog
      open={open}
      onClose={onClose}
      label={player ? t.playerProfile(player.name) : undefined}
      name={player?.name ?? null}
      kicker={
        player?.number != null && (
          <span
            className="text-4xl leading-none font-bold tabular-nums"
            style={{ fontFamily: "var(--font-kit)" }}
          >
            {player.number}
          </span>
        )
      }
      photo={profile?.portrait ?? null}
      photoLoading={loading}
      team={team}
      league={league}
    >
      {player && (
        <>
          {/* Two independent columns, so the mini pitch doesn't open gaps in the other:
              name and position on the left; birth details and height on the right. */}
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-x-5 px-5 pt-4 pb-5 text-sm">
            <dl className="space-y-3">
              <Field label={t.fullName}>
                {loading ? <Skeleton /> : (profile?.fullName ?? player.name)}
              </Field>
              <Field label={t.position}>
                {t.positionName[player.position]}
                {formation && (
                  <Suspense fallback={<MiniPitch spot={null} />}>
                    <PositionPitch formation={formation} player={player} />
                  </Suspense>
                )}
              </Field>
            </dl>
            <dl className="space-y-3">
              <Field label={t.dateOfBirth}>
                <BirthDateValue date={player.birthDate} />
              </Field>
              <Field label={t.height}>
                {height ? (
                  <>
                    {height} cm
                    {t.locale === "en" && (
                      <span className="ml-1.5 text-xs font-normal text-muted">{feetInches(height)}</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted">{t.unknown}</span>
                )}
              </Field>
              <Field label={t.birthPlace}>
                {loading ? (
                  <Skeleton />
                ) : (
                  <BirthPlaceValue place={profile?.birthPlace ?? null} flag={birthFlag} />
                )}
              </Field>
            </dl>
          </div>
          {!loading && !profile && (
            <p className="-mt-2 px-5 pb-5 text-xs text-muted">{t.profileUnavailable}</p>
          )}
        </>
      )}
    </ProfileDialog>
  );
}

/** 178 → "5′ 10″". */
function feetInches(cm: number) {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}

// Where each line sits on the pitch, for players with no league starts to go by.
const LINE_SPOT = {
  G: { depth: 9, lateral: 50 },
  D: { depth: 22, lateral: 50 },
  M: { depth: 50, lateral: 50 },
  F: { depth: 80, lateral: 50 },
};

/** The player's usual spot in the team's line-ups, from the analysed league matches. */
function PositionPitch({
  formation,
  player,
}: {
  formation: Promise<TeamFormation | null>;
  player: Player;
}) {
  const t = useT();
  const usual = use(formation)?.usual[player.id];
  return (
    <MiniPitch
      spot={usual ?? LINE_SPOT[player.position]}
      approximate={!usual}
      number={player.number}
      label={usual ? t.usualSpot(usual.starts) : t.noStartsYet}
    />
  );
}

/**
 * A small horizontal pitch with one player on it: own goal on the left,
 * attacking right, so the team's left touchline is along the top.
 */
function MiniPitch({
  spot,
  approximate = false,
  number = null,
  label,
}: {
  spot: { depth: number; lateral: number } | null;
  /** No starts to go by: a faded dot in the player's line. */
  approximate?: boolean;
  number?: number | null;
  label?: string;
}) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      title={label}
      className="relative mt-2 aspect-[105/68] w-full max-w-32 overflow-hidden rounded-md shadow-inner ring-1 ring-black/10 [--pitch-stripe:#2b7a37] [--pitch:#2f8a3e] dark:ring-white/10 dark:[--pitch-stripe:#1d5427] dark:[--pitch:#215f2c]"
    >
      <svg viewBox="0 0 105 68" className="absolute inset-0 h-full w-full" aria-hidden>
        <Markings />
      </svg>
      {spot && (
        <span
          aria-hidden
          className={`absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[8px] leading-none font-bold tabular-nums shadow ring-[1.5px] ${
            approximate
              ? "bg-white/35 text-white ring-white/80"
              : "bg-accent text-white ring-white"
          }`}
          // Kept clear of the edges so the badge isn't clipped.
          style={{
            left: `${Math.min(92, Math.max(8, spot.depth))}%`,
            top: `${Math.min(86, Math.max(14, spot.lateral))}%`,
          }}
        >
          {number ?? ""}
        </span>
      )}
    </div>
  );
}
