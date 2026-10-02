# FootWorld

Football data from the main European leagues, built with Next.js 16 and Tailwind CSS 4.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data

League data comes from ESPN's public sports API, which needs no API key. It's unofficial and undocumented, so endpoints may change without notice.

- League info and logos: `https://sports.core.api.espn.com/v2/sports/soccer/leagues/{slug}`. Logos are cached for 24h.
- League slugs: `esp.1` LaLiga, `eng.1` Premier League, `ita.1` Serie A, `ger.1` Bundesliga, `fra.1` Ligue 1, `por.1` Primeira Liga, `ned.1` Eredivisie.

Leagues are configured in `lib/leagues.ts`. Only LaLiga is currently `available`; the others appear in the dropdown marked "Soon". No league is selected on first load; picking one from the dropdown sets it in the URL (`/?league=esp.1`) and loads its teams. Clicking a team selects and highlights it (`&team=<id>`); clicking it again clears the selection, and switching league clears it too.

## Layout

- **Header**: app name and league dropdown with logos.
- **Left sidebar (desktop, 1024px and up)**: collapsed to a strip of team logos; it widens over the main section while hovered (or keyboard-focused) to show names and codes. Lists the selected league's teams with logos, alphabetically, from `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/teams` (cached for 6h). Logos switch to ESPN's dark variants in dark mode.
- **Teams bar (below 1024px)**: the sidebar is hidden and the teams appear in a dropdown in a bar under the header instead.
- **Main section (right)**: the selected team's current squad, grouped by position and ordered by squad number. Each player is drawn as a small shirt-back icon in the team's kit, with their name and number. Full width below 1024px.

## Squads and kits

- Squads come from `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/teams/{teamId}/roster` (current season, cached for 1h), including squad numbers, positions and nationality. Each tile shows the player's nationality as a small round flag (ESPN's flag image, zoomed to fill the circle) in the bottom-right corner; hover it for the country name.
- No free API publishes kit designs, so each club's home kit is defined by hand in `lib/kits.ts`: pattern (`solid`, `stripes`, `hoops`, `sash`, `band`) and colours for the shirt, sleeves, trim and lettering. All 20 LaLiga clubs are defined. These follow each club's traditional home design; seasonal details such as gradients or trim aren't modelled. Clubs without an entry get a plain shirt in ESPN's team colour.
- Shirt names use the player's surname, or their single name for players like Pedri and Gavi. The lettering uses the Oswald font.
