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
}: {
  open: boolean;
  onToggle: () => void;
  /** id of the panel this bar shows and hides. */
  controls: string;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  status?: React.ReactNode;
}) {
  return (
    <div
      // Colours come from the club theme (see .section-bar in globals.css): a strong
      // two-colour tint and stripe when expanded, a light one when collapsed.
      data-open={open || undefined}
      className="section-bar group/bar relative flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6"
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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--c1)] text-[var(--club-1-ink,white)] opacity-70 shadow-sm ring-[1.5px] ring-[var(--c2)] ring-offset-0 transition-opacity duration-200 group-hover/bar:opacity-100"
        >
          {icon}
        </span>
        <span className="text-base font-bold tracking-tight">{title}</span>
        {badge != null && (
          <span className="rounded-full bg-[color-mix(in_oklab,var(--c1)_16%,transparent)] px-2 py-0.5 text-xs font-semibold text-text ring-1 ring-[color-mix(in_oklab,var(--c1)_30%,transparent)]">
            {badge}
          </span>
        )}
      </button>

      {status != null && (
        <div className="pointer-events-none relative order-last basis-full text-xs text-muted sm:order-none sm:ml-auto sm:basis-auto">
          {status}
        </div>
      )}

      <span
        aria-hidden
        className={`pointer-events-none flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors ${
          open
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
