import Image from "next/image";
import type { Team } from "@/lib/teams";

export default function TeamLogo({
  team,
  size = 31,
  eager = false,
}: {
  team: Team;
  size?: number;
  /** Load straight away rather than lazily: for crests in view on load (the page's LCP). */
  eager?: boolean;
}) {
  const loading = eager ? "eager" : undefined;
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
        loading={loading}
        className="shrink-0 object-contain dark:hidden"
        style={style}
      />
      <Image
        src={team.logoDark}
        alt=""
        width={size}
        height={size}
        loading={loading}
        className="hidden shrink-0 object-contain dark:block"
        style={style}
      />
    </>
  );
}
