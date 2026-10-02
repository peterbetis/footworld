import { getKit } from "@/lib/kits";
import { getSquad, type Position, type Squad as SquadData } from "@/lib/players";
import { getTeams } from "@/lib/teams";
import Shirt from "./Shirt";
import TeamLogo from "./TeamLogo";

const GROUPS: { position: Position; title: string }[] = [
  { position: "G", title: "Goalkeepers" },
  { position: "D", title: "Defenders" },
  { position: "M", title: "Midfielders" },
  { position: "F", title: "Forwards" },
];

export default async function Squad({
  leagueSlug,
  teamId,
}: {
  leagueSlug: string;
  teamId: string;
}) {
  let squad: SquadData;
  try {
    squad = await getSquad(leagueSlug, teamId);
  } catch (err) {
    console.error(err);
    return (
      <p className="px-6 py-16 text-center text-sm text-muted">
        Couldn&apos;t load this squad right now. Try again shortly.
      </p>
    );
  }

  // Cached alongside the teams list, so this doesn't refetch.
  const team = (await getTeams(leagueSlug).catch(() => [])).find((t) => t.id === teamId);
  const kit = getKit(teamId, squad.teamColor);

  return (
    <section aria-label={`${squad.teamName} squad`}>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        {team && <TeamLogo team={team} size={40} />}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{squad.teamName}</h2>
          <p className="text-xs text-muted">
            {squad.season && `${squad.season} squad · `}
            {squad.players.length} players
          </p>
        </div>
      </header>

      <div className="space-y-8 px-4 py-5 sm:px-6">
        {GROUPS.map(({ position, title }) => {
          const players = squad.players.filter((p) => p.position === position);
          if (players.length === 0) return null;
          return (
            <section key={position} aria-label={title}>
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
                {title} <span className="font-normal">· {players.length}</span>
              </h3>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col items-center rounded-lg bg-bg px-2 pt-3 pb-2 text-center"
                  >
                    <div className="w-full max-w-[72px]">
                      <Shirt
                        kit={kit}
                        name={p.shirtName}
                        number={p.number}
                        uid={`shirt-${p.id}`}
                        label={`${p.name}${p.number != null ? `, number ${p.number}` : ""}`}
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 w-full text-xs leading-tight font-semibold" title={p.name}>
                      {p.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {p.number != null ? `#${p.number}` : "No number"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export function SquadSkeleton() {
  return (
    <div aria-busy aria-label="Loading squad">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="h-10 w-10 animate-pulse rounded-full bg-border" />
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-border" />
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 py-5 sm:grid-cols-4 sm:px-6 md:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-bg" />
        ))}
      </div>
    </div>
  );
}
