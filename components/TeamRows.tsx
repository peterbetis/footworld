"use client";

import type { Team } from "@/lib/teams";
import { useSelectedTeam } from "@/lib/useSelectedTeam";
import { useT } from "./I18nProvider";
import TeamLogo from "./TeamLogo";
import { REVEAL } from "./sidebar";

export default function TeamRows({ teams }: { teams: Team[] }) {
  const { selectedSlug, toggle } = useSelectedTeam();
  const t = useT();

  return (
    // Fixed at the expanded width so nothing reflows while the sidebar animates.
    // Fixed layout: long names truncate instead of pushing the code column out.
    <table className="w-64 table-fixed text-sm">
      <colgroup>
        <col />
        <col className="w-12" />
      </colgroup>
      <thead className="sr-only">
        <tr>
          <th scope="col">{t.teamColumn}</th>
          <th scope="col">{t.codeColumn}</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((t) => {
          const selected = t.urlSlug === selectedSlug;
          return (
            <tr
              key={t.id}
              className={`relative border-t border-border transition-colors first:border-t-0 has-[:focus-visible]:bg-bg ${
                selected ? "bg-accent/10 shadow-[inset_3px_0_0_var(--accent)]" : "hover:bg-bg"
              }`}
            >
              {/* Left padding centres the logo in the collapsed strip. */}
              <td className="py-2 pl-[17.5px]">
                {/* The ::after overlay stretches the button's hit area over the whole row. */}
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(t.urlSlug)}
                  className="flex w-full cursor-pointer items-center gap-3 text-left outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                >
                  <TeamLogo team={t} />
                  <span
                    title={t.name}
                    className={`min-w-0 truncate whitespace-nowrap ${REVEAL} ${selected ? "font-bold" : "font-medium"}`}
                  >
                    {t.name}
                  </span>
                </button>
              </td>
              <td
                className={`py-2 pr-4 text-right text-xs font-semibold tracking-wide ${REVEAL} ${
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
