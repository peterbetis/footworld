"use client";

import type { Team } from "@/lib/teams";
import { useSelectedTeam } from "@/lib/useSelectedTeam";
import TeamLogo from "./TeamLogo";

export default function TeamRows({ teams }: { teams: Team[] }) {
  const { selectedId, toggle } = useSelectedTeam();

  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th scope="col">Team</th>
          <th scope="col">Code</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((t) => {
          const selected = t.id === selectedId;
          return (
            <tr
              key={t.id}
              className={`relative border-t border-border transition-colors first:border-t-0 focus-within:bg-bg ${
                selected
                  ? "bg-accent/10 shadow-[inset_3px_0_0_var(--accent)]"
                  : "hover:bg-bg"
              }`}
            >
              <td className="py-2 pl-4">
                {/* The ::after overlay stretches the button's hit area over the whole row. */}
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(t.id)}
                  className="flex w-full items-center gap-3 text-left outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                >
                  <TeamLogo team={t} />
                  <span className={`truncate ${selected ? "font-bold" : "font-medium"}`}>
                    {t.name}
                  </span>
                </button>
              </td>
              <td
                className={`py-2 pr-4 text-right text-xs font-semibold tracking-wide ${
                  selected ? "text-text" : "text-muted"
                }`}
              >
                {t.abbreviation}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
