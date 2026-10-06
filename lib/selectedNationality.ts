import { useSyncExternalStore } from "react";

/**
 * The nationality selected in the squad panel, shared with the leagues map (which sits
 * outside the squad panel) so it can highlight the country and bring it into view.
 */
export interface SelectedNationality {
  /** Map shape key ("United Kingdom" for England). */
  key: string;
  /** Where its flag sits, in the world map's units. */
  x: number;
  y: number;
}

let selected: SelectedNationality | null = null;
const listeners = new Set<() => void>();

export function setSelectedNationality(next: SelectedNationality | null) {
  if (next?.key === selected?.key) return;
  selected = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSelectedNationality() {
  return useSyncExternalStore(
    subscribe,
    () => selected,
    () => null,
  );
}

/** Calls `onChange` with each newly selected (or cleared) nationality; returns an unsubscribe. */
export function onSelectedNationalityChange(
  onChange: (n: SelectedNationality | null) => void,
) {
  return subscribe(() => onChange(selected));
}
