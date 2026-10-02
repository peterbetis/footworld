import "server-only";

export interface League {
  /** ESPN league slug, e.g. "esp.1". */
  slug: string;
  name: string;
  country: string;
  /** Logo for dark backgrounds (the header is dark). */
  logo: string;
  available: boolean;
}

// Main European leagues, in display order. Only La Liga has data wired up so far.
const LEAGUES: Omit<League, "logo">[] = [
  { slug: "esp.1", name: "LaLiga", country: "Spain", available: true },
  { slug: "eng.1", name: "Premier League", country: "England", available: false },
  { slug: "ita.1", name: "Serie A", country: "Italy", available: false },
  { slug: "ger.1", name: "Bundesliga", country: "Germany", available: false },
  { slug: "fra.1", name: "Ligue 1", country: "France", available: false },
  { slug: "por.1", name: "Primeira Liga", country: "Portugal", available: false },
  { slug: "ned.1", name: "Eredivisie", country: "Netherlands", available: false },
];

interface EspnLeague {
  logos?: { href: string; rel?: string[] }[];
}

// ESPN's public (unofficial, keyless) sports API.
async function getLogo(slug: string): Promise<string> {
  try {
    const res = await fetch(
      `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${slug}?lang=en&region=us`,
      { next: { revalidate: 86_400 } }, // league logos rarely change
    );
    if (!res.ok) return "";
    const data: EspnLeague = await res.json();
    const logos = data.logos ?? [];
    return (
      logos.find((l) => l.rel?.includes("dark"))?.href ?? logos[0]?.href ?? ""
    );
  } catch {
    return "";
  }
}

export async function getLeagues(): Promise<League[]> {
  const logos = await Promise.all(LEAGUES.map((l) => getLogo(l.slug)));
  return LEAGUES.map((l, i) => ({ ...l, logo: logos[i] }));
}
