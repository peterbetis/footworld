"use client";

/**
 * Header bar for a collapsible panel. The whole bar toggles the panel: the
 * toggle button's ::after overlay covers it. Anything in `status` is drawn
 * underneath that overlay (clicks pass through to the toggle) except elements
 * marked `pointer-events-auto relative z-10`, such as a "Show all" button.
 */
export default function SectionBar({
  open,
  onToggle,
  controls,
  icon,
  title,
  badge,
  status,
  tone = "club",
}: {
  open: boolean;
  onToggle: () => void;
  /** id of the panel this bar shows and hides. */
  controls: string;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  status?: React.ReactNode;
  /**
   * "club": the club's colours (see .section-bar in globals.css), a strong two-colour
   * tint and stripe when expanded, a light one when collapsed. "nav": the header's
   * navy, with lighter navy and translucent white like the league picker, for the
   * leagues map.
   */
  tone?: "club" | "nav";
}) {
  const nav = tone === "nav";
  return (
    <div
      data-open={open || undefined}
      className={`group/bar relative flex flex-wrap items-center gap-x-4 gap-y-0 px-4 py-1.5 transition-[background-color,box-shadow] duration-200 sm:gap-y-1 sm:px-6 sm:py-2 ${
        nav
          ? `text-white ${
              open
                ? "bg-header-2 shadow-[inset_4px_0_0_color-mix(in_oklab,var(--header-2)_60%,white)] hover:bg-[color-mix(in_oklab,var(--header-2)_88%,white)]"
                : "bg-header shadow-[inset_4px_0_0_color-mix(in_oklab,var(--header-2)_80%,white)] hover:bg-header-2"
            }`
          : "section-bar"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={controls}
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-2.5 text-left outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
      >
        <span
          aria-hidden
          // Softened so the icon doesn't outweigh the title; full strength on hover.
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 shadow-sm ring-[1.5px] ring-offset-0 transition-opacity duration-200 group-hover/bar:opacity-100 sm:h-7 sm:w-7 ${
            nav
              ? "bg-white/10 text-white ring-white/20"
              : "bg-[var(--c1)] text-[var(--club-1-ink,white)] ring-[var(--c2)]"
          }`}
        >
          {icon}
        </span>
        <span className="text-base font-bold tracking-tight">{title}</span>
        {badge != null && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
              nav
                ? "bg-white/10 text-white ring-white/15"
                : "bg-[color-mix(in_oklab,var(--c1)_16%,transparent)] text-text ring-[color-mix(in_oklab,var(--c1)_30%,transparent)]"
            }`}
          >
            {badge}
          </span>
        )}
      </button>

      {status != null && (
        <div
          className={`pointer-events-none relative order-last basis-full text-[11px] leading-tight sm:order-none sm:ml-auto sm:basis-auto sm:text-xs ${
            nav ? "text-white/60" : "text-muted"
          }`}
        >
          {status}
        </div>
      )}

      <span
        aria-hidden
        className={`pointer-events-none flex h-6.5 w-6.5 shrink-0 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-full border shadow-sm transition-colors ${
          nav
            ? open
              ? "border-accent bg-accent text-white"
              : "border-white/30 bg-white/5 text-white group-hover/bar:border-white/60"
            : open
              ? "border-[var(--c2)] bg-[var(--c2)] text-[var(--club-2-ink,white)]"
              : "border-[color-mix(in_oklab,var(--c1)_60%,transparent)] bg-surface text-[color-mix(in_oklab,var(--c1)_60%,var(--text))] group-hover/bar:border-[var(--c1)]"
        } ${status != null ? "ml-auto sm:ml-0" : "ml-auto"}`}
      >
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

/** Height-animating wrapper for a SectionBar's panel; content stays mounted while closed. */
export function CollapsiblePanel({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      inert={!open}
      className="grid grid-cols-[minmax(0,1fr)] transition-[grid-template-rows] duration-300 ease-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      {/* overflow-clip (not hidden) so sticky children still stick to the page. Unlike
          overflow-hidden it doesn't zero the automatic minimum width, so min-w-0 is needed
          or wide content (the shares row) stretches the page on phones. */}
      <div className="min-h-0 min-w-0 overflow-clip">{children}</div>
    </div>
  );
}
