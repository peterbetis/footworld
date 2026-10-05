"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Team } from "@/lib/teams";
import FlagCircle from "./FlagCircle";
import { useT } from "./I18nProvider";

const CLOSE_MS = 220; // matches the .player-dialog transition in globals.css

/**
 * The profile modal shared by players and the manager: a photo with the name
 * over it, league and club badges in its corners, and the details below.
 * Centred over a blurred page; closes on the X, Escape or a click outside it,
 * fading out before the dialog is actually closed.
 */
export default function ProfileDialog({
  open,
  onClose,
  label,
  name,
  kicker,
  photo,
  photoLoading = false,
  team,
  league,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label?: string;
  /** Kept after closing, so the content doesn't vanish mid-fade. */
  name: string | null;
  /** Shown before the name over the photo, e.g. the shirt number. */
  kicker?: React.ReactNode;
  photo: string | null;
  /** The photo is still being looked up (pulsing placeholder). */
  photoLoading?: boolean;
  /** Club crest, in the photo's bottom-right corner badge. */
  team?: Team;
  /** League logo (light-on-dark variant), in the top-left corner badge. */
  league?: { name: string; logo: string };
  /** The details: `Field`s laid out by the caller. */
  children: React.ReactNode;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  // Photos that have loaded, or failed to (shown as the silhouette).
  const [photos, setPhotos] = useState<Record<string, "ok" | "failed">>({});

  // Open with showModal() (top layer, inert page, focus trap); close after the fade-out.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      delete dialog.dataset.state;
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    dialog.dataset.state = "closing";
    const timer = setTimeout(() => {
      dialog.close();
      delete dialog.dataset.state;
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const shown = photo && photos[photo] !== "failed" ? photo : null;
  const photoState = (src: string, state: "ok" | "failed") =>
    setPhotos((cur) => ({ ...cur, [src]: state }));

  return (
    <dialog
      ref={ref}
      aria-label={label}
      // Escape: run the same fade-out as the other ways of closing.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // The dialog box is the only thing under a click outside the card (its backdrop).
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="player-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-transparent p-0 text-text"
    >
      {name && (
        <article className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="relative aspect-[4/5] max-h-[55dvh] w-full bg-border">
            {shown ? (
              <Image
                key={shown}
                src={shown}
                alt={t.playerPhoto(name)}
                fill
                unoptimized
                sizes="384px"
                onLoad={() => photoState(shown, "ok")}
                onError={() => photoState(shown, "failed")}
                className={`object-cover object-top transition-opacity duration-300 ${
                  photos[shown] === "ok" ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : photoLoading ? (
              <div className="h-full w-full animate-pulse bg-border" aria-hidden />
            ) : (
              // No photo on Wikimedia Commons: a neutral silhouette.
              <svg viewBox="0 0 64 64" className="h-full w-full text-muted" aria-hidden>
                <circle cx="32" cy="24" r="12" fill="currentColor" opacity="0.4" />
                <path d="M10 64c2-14 11-21 22-21s20 7 22 21Z" fill="currentColor" opacity="0.4" />
              </svg>
            )}
            {/* Name over the bottom of the photo. */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent pt-14 pb-4 pl-5 text-white ${
                team ? "pr-24" : "pr-5"
              }`}
            >
              <div className="flex items-end gap-3">
                {kicker}
                <h2 className="text-xl leading-tight font-bold drop-shadow">{name}</h2>
              </div>
            </div>
            {/* Club badge, flush in the photo's bottom-right corner (dark-background crest). */}
            {team?.logoDark && (
              <div className="absolute right-0 bottom-0 rounded-tl-3xl border-t border-l border-white/20 bg-black/55 p-3 pt-3.5 pl-3.5 shadow-lg backdrop-blur-md">
                <Image
                  src={team.logoDark}
                  alt={team.name}
                  title={team.name}
                  width={52}
                  height={52}
                  className="h-13 w-13 object-contain drop-shadow"
                />
              </div>
            )}
            {/* League badge, flush in the top-left corner over the photo. */}
            {league?.logo && (
              <div className="absolute top-0 left-0 rounded-br-3xl border-r border-b border-white/20 bg-black/55 p-3 pr-3.5 pb-3.5 shadow-lg backdrop-blur-md">
                <Image
                  src={league.logo}
                  alt={league.name}
                  title={league.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain drop-shadow"
                />
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeProfile}
              className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors outline-none hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path
                  d="M5 5l10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {children}
        </article>
      )}
    </dialog>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

export function Skeleton() {
  return <span className="block h-4 w-40 animate-pulse rounded bg-border" aria-hidden />;
}

/** Date of birth with the age underneath. */
export function BirthDateValue({ date }: { date: string | null }) {
  const t = useT();
  if (!date) return <span className="text-muted">{t.unknown}</span>;
  return (
    <>
      {formatDate(date, t.locale)}
      <span className="block text-xs font-normal text-muted">
        {t.ageYears(ageOn(date, new Date()))}
      </span>
    </>
  );
}

/** Place of birth ending with a flag, glued to the last word so it never wraps alone. */
export function BirthPlaceValue({
  place,
  flag,
}: {
  place: string | null;
  flag: { src: string; padded: boolean } | null;
}) {
  const t = useT();
  if (!place) return <span className="text-muted">{t.unknown}</span>;
  const split = place.lastIndexOf(" ") + 1;
  return (
    <>
      {place.slice(0, split)}
      <span className="whitespace-nowrap">
        {place.slice(split)}
        {flag && (
          <span className="ml-1.5 inline-block align-[-4px]">
            <FlagCircle src={flag.src} country="" size={18} padded={flag.padded} />
          </span>
        )}
      </span>
    </>
  );
}

/** "5 Sept 2001" / "5 sept 2001", read as a calendar date (no time-zone shift). */
function formatDate(isoDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** Age in whole years on `today`. */
function ageOn(isoDate: string, today: Date) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const hadBirthday =
    today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  return today.getFullYear() - y - (hadBirthday ? 0 : 1);
}
