import type { League } from "@/lib/leagues";
import LeagueSelect from "./LeagueSelect";

/**
 * Landing state: with no league picked yet, the page is blurred behind a
 * centred card whose league picker is already open.
 */
export default function LeaguePrompt({
  leagues,
  title,
  subtitle,
}: {
  leagues: League[];
  title: string;
  subtitle: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="league-prompt-title"
      className="league-prompt fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 pt-[14vh] pb-10 backdrop-blur-md"
    >
      <div className="league-prompt-card w-full max-w-md rounded-3xl border border-white/10 bg-header p-6 text-white shadow-2xl sm:p-8">
        <h2 id="league-prompt-title" className="text-2xl font-extrabold tracking-tight">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-white/70">{subtitle}</p>
        <div className="mt-6">
          <LeagueSelect leagues={leagues} selected={null} variant="hero" />
        </div>
      </div>
    </div>
  );
}
