"use client";

import Image from "next/image";
import { use } from "react";
import type { Kit, KitSet } from "@/lib/kits";
import type { Team } from "@/lib/teams";
import type { KitLayer, WikiKits } from "@/lib/wikiKits";
import { useT } from "./I18nProvider";
import Shirt from "./Shirt";
import TeamLogo from "./TeamLogo";

// Wikipedia's {{Football kit}} canvas.
const CANVAS_W = 100;
const CANVAS_H = 135;

/**
 * Current-season kits from Wikipedia, falling back to the drawn kits when the
 * club has no Wikipedia kit data (or Wikipedia can't be reached).
 */
export default function KitsGallery({
  wiki: wikiPromise,
  fallback,
  team,
  teamName,
  currentSeason,
}: {
  wiki: Promise<WikiKits | null>;
  /** e.g. "2026-27", to flag Wikipedia kits that are from an older season. */
  currentSeason: string;
  fallback: KitSet;
  team: Team | undefined;
  teamName: string;
}) {
  const t = useT();
  const wiki = use(wikiPromise);
  const label = (key: string) =>
    key === "home" ? t.homeKit : key === "away" ? t.awayKit : t.thirdKit;

  if (wiki) {
    return (
      <>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          {wiki.kits.map((kit) => (
            <KitCard key={kit.key} label={label(kit.key)} colours={kit.colours}>
              <WikiKitImage layers={kit.layers} label={t.kitLabel(label(kit.key), teamName)} />
            </KitCard>
          ))}
        </ul>
        {wiki.season !== currentSeason && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-text">
            {wiki.season ? t.kitsOlderSeason(wiki.season) : t.kitsUnknownSeason}
          </p>
        )}
      </>
    );
  }

  const drawn: { key: string; kit: Kit }[] = [
    { key: "home", kit: fallback.home },
    { key: "away", kit: fallback.away },
    ...(fallback.third ? [{ key: "third", kit: fallback.third }] : []),
  ];
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
        {drawn.map(({ key, kit }) => (
          <KitCard
            key={key}
            label={label(key)}
            colours={[
              ...new Set(
                [kit.base, kit.accent, kit.sleeves, kit.trim, kit.print].filter(
                  (c): c is string => !!c,
                ),
              ),
            ]}
          >
            <figure
              className="relative w-full max-w-32"
              role="img"
              aria-label={t.kitLabel(label(key), teamName)}
            >
              <Shirt kit={kit} name="" number={null} uid={`kit-${key}`} label="" />
              {/* Crest on the chest, wearer's left (viewer's right). */}
              {team && (
                <span
                  className="absolute top-[30%] left-[60%] -translate-x-1/2 -translate-y-1/2"
                  aria-hidden
                >
                  <TeamLogo team={team} size={24} />
                </span>
              )}
            </figure>
          </KitCard>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t.kitsIllustrated}</p>
    </>
  );
}

function KitCard({
  label,
  colours,
  children,
}: {
  label: string;
  colours: string[];
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col items-center rounded-xl border border-border bg-bg px-3 pt-4 pb-3">
      {children}
      <p className="mt-2 text-sm font-semibold">{label}</p>
      {colours.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1" aria-hidden>
          {colours.map((c) => (
            <span
              key={c}
              title={c}
              className="h-[0.9625rem] w-[0.9625rem] rounded-full ring-1 ring-black/15 dark:ring-white/20"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </li>
  );
}

/** Stacks Wikipedia's kit layers (colour, pattern, outline) at the template's proportions. */
function WikiKitImage({ layers, label }: { layers: KitLayer[]; label: string }) {
  // Wikipedia's outline layers are white outside the kit silhouette (that's how the
  // template cuts out the shape), so the kit sits on a white panel in both themes.
  return (
    <div className="w-full max-w-32 rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5">
      <div
        role="img"
        aria-label={label}
        className="relative w-full"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        {layers.map((l, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(l.x / CANVAS_W) * 100}%`,
              top: `${(l.y / CANVAS_H) * 100}%`,
              width: `${(l.w / CANVAS_W) * 100}%`,
              height: `${(l.h / CANVAS_H) * 100}%`,
              background: l.color ?? undefined,
            }}
          >
            {l.image && (
              <Image src={l.image} alt="" fill unoptimized sizes="128px" className="object-fill" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KitsGallerySkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy
      aria-label={label}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-xl bg-bg" />
      ))}
    </div>
  );
}
