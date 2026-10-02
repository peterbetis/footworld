/**
 * The desktop teams sidebar collapses to a strip of logos and expands while
 * hovered (or while it holds keyboard focus). Elements inside it that should
 * only show when expanded use REVEAL; the sidebar itself is the `teams` group.
 */
export const REVEAL =
  "opacity-0 transition-opacity duration-200 group-hover/teams:opacity-100 group-has-[:focus-visible]/teams:opacity-100";

/** Inverse of REVEAL: visible only while collapsed. */
export const CONCEAL =
  "transition-opacity duration-200 group-hover/teams:opacity-0 group-has-[:focus-visible]/teams:opacity-0";
