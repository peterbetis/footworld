import Image from "next/image";
import type { Team } from "@/lib/teams";

export default function TeamLogo({ team, size = 28 }: { team: Team; size?: number }) {
  const style = { width: size, height: size };
  if (!team.logo) {
    return <span aria-hidden className="shrink-0 rounded-full bg-border" style={style} />;
  }
  // Swap to ESPN's dark-background variant in dark mode.
  return (
    <>
      <Image
        src={team.logo}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain dark:hidden"
        style={style}
      />
      <Image
        src={team.logoDark}
        alt=""
        width={size}
        height={size}
        className="hidden shrink-0 object-contain dark:block"
        style={style}
      />
    </>
  );
}
