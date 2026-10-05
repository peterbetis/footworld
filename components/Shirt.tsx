import type { Kit } from "@/lib/kits";

// Back view of a short-sleeved shirt, in a 200×220 box.
const SHIRT_PATH =
  "M70 14 Q100 24 130 14 L160 24 L194 58 L174 86 L152 72 L154 206 Q100 214 46 206 L48 72 L26 86 L6 58 L40 24 Z";
const SLEEVES = ["40,24 6,58 26,86 48,72", "160,24 194,58 174,86 152,72"];
const CUFFS = [
  "6,58 26,86 31.3,81.4 11.3,53.4",
  "194,58 174,86 168.7,81.4 188.7,53.4",
];
const STRIPE = 17;

/**
 * A shirt back with the player's name and number, styled by the team's kit.
 * `uid` must be unique on the page (it namespaces the SVG defs).
 */
export default function Shirt({
  kit,
  name,
  number,
  uid,
  label,
}: {
  kit: Kit;
  name: string;
  number: number | null;
  uid: string;
  label: string;
}) {
  const clip = `${uid}-clip`;
  const fabric = `${uid}-fabric`;
  const outline = kit.printOutline
    ? { stroke: kit.printOutline, paintOrder: "stroke" as const, strokeLinejoin: "round" as const }
    : {};
  // Squeeze long names to fit across the shoulders.
  const nameFit = name.length > 9 ? { textLength: 104, lengthAdjust: "spacingAndGlyphs" as const } : {};

  return (
    <svg viewBox="0 0 200 220" role="img" aria-label={label} className="h-auto w-full">
      <defs>
        <clipPath id={clip}>
          <path d={SHIRT_PATH} />
        </clipPath>
        <linearGradient id={fabric} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect width="200" height="220" fill={kit.base} />
        <Pattern kit={kit} />
        {kit.sleeves &&
          SLEEVES.map((points) => <polygon key={points} points={points} fill={kit.sleeves} />)}
        {CUFFS.map((points) => (
          <polygon key={points} points={points} fill={kit.trim} />
        ))}
        <rect width="200" height="220" fill={`url(#${fabric})`} />
      </g>

      {/* Collar */}
      <path d="M70 14 Q100 24 130 14" fill="none" stroke={kit.trim} strokeWidth="6" />
      {/* Seams */}
      <path
        d="M40 24 L48 72 M160 24 L152 72"
        fill="none"
        stroke="#000"
        strokeOpacity="0.12"
        strokeWidth="1"
      />
      <path d={SHIRT_PATH} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="1.5" />

      <g fill={kit.print} fontFamily="var(--font-kit)" textAnchor="middle" {...outline}>
        <text
          x="100"
          y="60"
          fontSize="17"
          fontWeight="600"
          letterSpacing="1.5"
          strokeWidth={kit.printOutline ? 3 : 0}
          {...nameFit}
        >
          {name}
        </text>
        {number != null && (
          <text x="100" y="158" fontSize="84" fontWeight="700" strokeWidth={kit.printOutline ? 5 : 0}>
            {number}
          </text>
        )}
      </g>
    </svg>
  );
}

function Pattern({ kit }: { kit: Kit }) {
  switch (kit.pattern) {
    case "stripes": {
      // Accent stripes, with one centred down the spine.
      const xs = [-2, -1, 0, 1, 2, 3].flatMap((i) => [100 - STRIPE / 2 + i * STRIPE * 2, 100 - STRIPE / 2 - i * STRIPE * 2]);
      return (
        <>
          {[...new Set(xs)].map((x) => (
            <rect key={x} x={x} y="0" width={STRIPE} height="220" fill={kit.accent} />
          ))}
        </>
      );
    }
    case "hoops":
      return (
        <>
          {[30, 70, 110, 150, 190].map((y) => (
            <rect key={y} x="0" y={y} width="200" height="20" fill={kit.accent} />
          ))}
        </>
      );
    case "sash":
      return <polygon points="34,14 72,14 172,214 134,214" fill={kit.accent} />;
    case "band":
      return <rect x="0" y="68" width="200" height="22" fill={kit.accent} />;
    case "halves":
      return <rect x="100" y="0" width="100" height="220" fill={kit.accent} />;
    case "diagonal":
      return <polygon points="0,0 200,0 0,220" fill={kit.accent} />;
    case "vband":
      return <rect x="74" y="0" width="52" height="220" fill={kit.accent} />;
    default:
      return null;
  }
}
