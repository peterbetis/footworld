import Link from "next/link";
import { getGlobe } from "@/lib/globe";
import type { League } from "@/lib/leagues";
import LeagueSelect from "./LeagueSelect";

export default function Header({
  leagues,
  selected,
}: {
  leagues: League[];
  selected: string | null;
}) {
  const globe = getGlobe();
  return (
    <header className="bg-header text-white shadow-md">
      <div className="mx-auto flex max-w-[100rem] items-center gap-4 sm:gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {/* Logo: a small globe with green continents, same size as before. */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            className="h-[2.475rem] w-[2.475rem] shrink-0 drop-shadow-sm"
          >
            <defs>
              <radialGradient id="globe-shine" cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
                <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.35" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="49" fill="#1d6fd6" />
            <path d={globe.graticule} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.6" />
            <path d={globe.land} fill="var(--accent)" stroke="#15803d" strokeWidth="0.6" />
            <circle cx="50" cy="50" r="49" fill="url(#globe-shine)" />
            <circle cx="50" cy="50" r="48.5" fill="none" stroke="#fff" strokeOpacity="0.35" />
          </svg>
          <span className="text-xl font-extrabold tracking-tight">
            Foot
            <span className="bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
              World
            </span>
          </span>
        </Link>
        {/* min-w-0 lets the picker shrink (its label truncates) on narrow phones. */}
        <div className="ml-auto min-w-0 sm:ml-0">
          <LeagueSelect leagues={leagues} selected={selected} />
        </div>
      </div>
    </header>
  );
}
