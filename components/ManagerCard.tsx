"use client";

import Image from "next/image";
import { use, useState } from "react";
import type { Manager } from "@/lib/manager";
import type { Team } from "@/lib/teams";
import FlagCircle from "./FlagCircle";
import { useT } from "./I18nProvider";
import ProfileDialog, { BirthDateValue, BirthPlaceValue, Field } from "./ProfileDialog";

/**
 * The club's current manager: portrait, name and nationality (from Wikipedia/Wikidata).
 * Clicking anywhere on the card opens the manager's profile.
 */
export default function ManagerCard({
  manager: managerPromise,
  team,
  league,
}: {
  manager: Promise<Manager | null>;
  /** For the badges on the manager's profile. */
  team?: Team;
  league?: { name: string; logo: string };
}) {
  const t = useT();
  const manager = use(managerPromise);
  const [open, setOpen] = useState(false);
  if (!manager) return null;

  return (
    <section aria-label={t.manager} className="sm:max-w-sm">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t.managerProfile(manager.name)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-bg p-2.5 pr-4 text-left transition-[background-color,border-color,box-shadow] duration-150 outline-none hover:border-accent/60 hover:bg-accent/5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-border">
          {manager.portrait ? (
            <Image
              src={manager.portrait}
              alt={t.managerPortrait(manager.name)}
              fill
              unoptimized
              sizes="64px"
              className="object-cover object-top"
            />
          ) : (
            // No photo on Wikipedia: a neutral silhouette.
            <svg viewBox="0 0 64 64" className="h-full w-full text-muted" aria-hidden>
              <circle cx="32" cy="24" r="12" fill="currentColor" opacity="0.5" />
              <path d="M10 64c2-14 11-21 22-21s20 7 22 21Z" fill="currentColor" opacity="0.5" />
            </svg>
          )}
        </span>
        <span className="block min-w-0">
          <span className="block text-[12px] font-semibold tracking-wide text-muted uppercase">
            {t.manager}
          </span>
          <span className="block truncate text-base font-bold">{manager.name}</span>
          {manager.nationality && (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm">
              {manager.flag && <FlagCircle src={manager.flag} country="" size={18} padded={false} />}
              <span className="truncate text-muted">{manager.nationality}</span>
            </span>
          )}
        </span>
      </button>
      <ManagerModal
        manager={manager}
        team={team}
        league={league}
        open={open}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}

/** The manager's profile: like a player's, without position and height. */
function ManagerModal({
  manager,
  team,
  league,
  open,
  onClose,
}: {
  manager: Manager;
  team?: Team;
  league?: { name: string; logo: string };
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const d = manager.details;
  // The birthplace country's flag; otherwise the manager's nationality flag.
  const birthFlag = d?.birthFlag
    ? { src: d.birthFlag, padded: false }
    : manager.flag
      ? { src: manager.flag, padded: false }
      : null;
  return (
    <ProfileDialog
      open={open}
      onClose={onClose}
      label={t.playerProfile(manager.name)}
      name={manager.name}
      photo={d?.photo ?? manager.portrait}
      team={team}
      league={league}
    >
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-x-5 px-5 pt-4 pb-5 text-sm">
        <dl className="space-y-3">
          <Field label={t.fullName}>
            {d?.fullName ?? manager.name}
            <span className="mt-1.5 block">
              <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">
                {t.manager}
              </span>
            </span>
          </Field>
        </dl>
        <dl className="space-y-3">
          <Field label={t.dateOfBirth}>
            <BirthDateValue date={d?.birthDate ?? null} />
          </Field>
          <Field label={t.birthPlace}>
            <BirthPlaceValue place={d?.birthPlace ?? null} flag={birthFlag} />
          </Field>
        </dl>
      </div>
    </ProfileDialog>
  );
}

export function ManagerCardSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy
      aria-label={label}
      className="flex items-center gap-3 rounded-xl border border-border bg-bg p-2.5 sm:max-w-sm"
    >
      <div className="h-16 w-16 animate-pulse rounded-lg bg-border" />
      <div className="space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-border" />
        <div className="h-4 w-32 animate-pulse rounded bg-border" />
        <div className="h-3 w-20 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}
