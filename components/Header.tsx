import Link from "next/link";
import type { League } from "@/lib/leagues";
import LeagueSelect from "./LeagueSelect";

export default function Header({
  leagues,
  selected,
}: {
  leagues: League[];
  selected: string | null;
}) {
  return (
    <header className="bg-header text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 sm:gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-lg"
          >
            ⚽
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Foot<span className="text-accent">World</span>
          </span>
        </Link>
        <div className="ml-auto sm:ml-0">
          <LeagueSelect leagues={leagues} selected={selected} />
        </div>
      </div>
    </header>
  );
}
