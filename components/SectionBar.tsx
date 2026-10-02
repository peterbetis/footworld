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
      className={`group/bar relative flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-accent/10 sm:px-6 ${
        open ? "bg-accent/5" : ""
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={controls}
        onClick={onToggle}
        className="flex items-center gap-2.5 text-left outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
      >
        <span
          aria-hidden
          className="flex h-[2.2rem] w-[2.2rem] shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-sm"
        >
          {icon}
        </span>
        <span className="text-base font-bold tracking-tight">{title}</span>
        {badge != null && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-text">
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
        className={`pointer-events-none flex h-[2.2rem] w-[2.2rem] shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm transition-colors group-hover/bar:border-accent group-hover/bar:text-accent ${
          status != null ? "ml-auto sm:ml-0" : "ml-auto"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          className={`h-[1.1rem] w-[1.1rem] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
