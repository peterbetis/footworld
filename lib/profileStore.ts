import { useSyncExternalStore } from "react";
import type { Locale } from "./i18n";
import type { PlayerProfile } from "./playerProfile";

/**
 * Player profiles fetched in the browser, shared by the profile modal and the
 * birthplace pins on the map, so each player is looked up once per language.
 * At most a few lookups run at a time: each one makes several Wikidata
 * requests on the server, and Wikimedia rate-limits bursts.
 */

/** A loaded profile; `null` means the lookup found nobody. */
export type ProfileEntry = PlayerProfile | null | "error";

export interface ProfileRequest {
  id: string;
  name: string;
  birthDate: string | null;
}

// Bump when the API's response shape changes, so browsers skip day-old cached copies.
const API_VERSION = "4";
const MAX_ACTIVE = 3;

const EMPTY: ReadonlyMap<string, ProfileEntry> = new Map();
let snapshot: ReadonlyMap<string, ProfileEntry> = EMPTY;
const listeners = new Set<() => void>();
const pending = new Set<string>();
const queue: (() => Promise<void>)[] = [];
let active = 0;

export const profileKey = (playerId: string, locale: Locale) => `${playerId}:${locale}`;

function store(key: string, entry: ProfileEntry) {
  snapshot = new Map(snapshot).set(key, entry);
  for (const listener of listeners) listener();
}

function pump() {
  while (active < MAX_ACTIVE && queue.length > 0) {
    const job = queue.shift()!;
    active++;
    job().finally(() => {
      active--;
      pump();
    });
  }
}

/**
 * Starts loading a player's profile unless it's loaded or on its way.
 * `urgent` (the modal) jumps the queue ahead of the map's pins.
 */
export function requestProfile(player: ProfileRequest, locale: Locale, urgent = false) {
  const key = profileKey(player.id, locale);
  if (snapshot.has(key)) return;
  if (pending.has(key)) {
    // Already queued for the map: let the modal's request go first.
    if (urgent) {
      const i = queue.findIndex((job) => (job as { key?: string }).key === key);
      if (i > 0) queue.unshift(...queue.splice(i, 1));
    }
    return;
  }
  pending.add(key);
  const job = Object.assign(
    async () => {
      const query = new URLSearchParams({ name: player.name, lang: locale, v: API_VERSION });
      if (player.birthDate) query.set("born", player.birthDate);
      try {
        const res = await fetch(`/api/player?${query}`);
        store(key, res.ok ? ((await res.json()) as PlayerProfile | null) : "error");
      } catch {
        store(key, "error");
      } finally {
        pending.delete(key);
      }
    },
    { key },
  );
  if (urgent) queue.unshift(job);
  else queue.push(job);
  pump();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Every profile loaded so far, by `profileKey`; re-renders as more arrive. */
export function useProfiles() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}
