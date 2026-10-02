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

Leagues are configured in `lib/leagues.ts`. LaLiga and the Premier League are `available`; the others appear in the dropdown marked "Soon". No league is selected on first load; picking one from the dropdown sets it in the URL (`/?league=esp.1`) and loads its teams. Clicking a team selects and highlights it (`&team=<id>`); clicking it again clears the selection, and switching league clears it too.

## Layout

- **Header**: app name and league dropdown with logos.
- **Left sidebar (desktop, 1024px and up)**: collapsed to a strip of team logos; it widens over the main section while hovered (or keyboard-focused) to show names and codes. Lists the selected league's teams with logos, alphabetically, from `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/teams` (cached for 6h). Logos switch to ESPN's dark variants in dark mode.
- **Teams bar (below 1024px)**: the sidebar is hidden and the teams appear in a dropdown in a bar under the header instead.
- **Main section (right)**: the selected team's current squad, grouped by position and ordered by squad number. Each player is drawn as a small shirt-back icon in the team's kit, with their name and number. Full width below 1024px.

## Squads and kits

- Squads come from `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/teams/{teamId}/roster` (current season, cached for 1h), including squad numbers, positions and nationality. Each tile shows the player's nationality as a small round flag (ESPN's flag image, zoomed to fill the circle) in the bottom-right corner; hover it for the country name.
- No free API publishes kit designs, so each club's home kit is defined by hand in `lib/kits.ts`: pattern (`solid`, `stripes`, `hoops`, `sash`, `band`) and colours for the shirt, sleeves, trim and lettering. All 20 LaLiga and 20 Premier League clubs (2026-27) are defined. These follow each club's traditional home design; seasonal details such as gradients or trim aren't modelled. Clubs without an entry get a plain shirt in ESPN's team colour.
- Next to the team name, a row of ring charts shows each nationality's share of the squad (largest first, flag in the centre, percentage and country below). Hovering a ring previews that country on the map and tiles; clicking selects it, the same as clicking its flag on the map.
- Above the squad, a world map shows one round flag per nationality in the squad, with a count when several players share it, and tints those countries. Clicking a flag highlights that country's players and blurs the rest; clicking it again shows everyone. Player tiles are selectable too: hovering one highlights it, its country on the map and teammates of the same nationality; clicking selects the player (✓ badge), selects their country on the map and blurs everyone from other countries. Click the player again, their flag on the map, or "Show all" to clear. Where flags would overlap (Europe especially), they're nudged apart with a thin line back to their country. The map zooms from 1× to 8×: + / − / reset buttons, Ctrl/⌘ + scroll or trackpad pinch (zooms around the cursor), two-finger pinch on touch screens, and double-click; drag to pan when zoomed. A plain scroll wheel still scrolls the page. Flags keep their size while zooming, so crowded regions separate as you zoom in.
- The map is drawn on the server from Natural Earth outlines (`world-atlas`, 1:110m) with `d3-geo` (Equal Earth projection), so no mapping code ships to the browser. Nationality names are matched to map countries in `lib/worldMap.ts`, which also has fixed positions for nations without their own shape at this scale (England, Scotland, Wales, Northern Ireland, Cape Verde, Malta and other small islands).
- Shirt names use the player's surname, or their single name for players like Pedri and Gavi. The lettering uses the Oswald font.
