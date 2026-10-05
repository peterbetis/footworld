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

Leagues are configured in `lib/leagues.ts`. All seven leagues are `available`: LaLiga, Premier League, Serie A, Bundesliga, Ligue 1, Primeira Liga and Eredivisie. No league is selected on first load; picking one from the dropdown sets it in the URL by its readable name (`/?league=laliga`) and loads its teams. Clicking a team selects and highlights it, also by name (`&team=real-madrid`; names come from `slugify` in `lib/slug.ts`). Older links using ESPN codes (`?league=esp.1&team=86`) still work and redirect to the readable form; clicking it again clears the selection, and switching league clears it too.

## Language

The interface follows the selected league: with LaLiga selected everything is in Spanish, otherwise in English. All interface text lives in `lib/i18n.ts` (an `en` and an `es` set); server components call `getMessages(locale)` and client components use `useT()` from `components/I18nProvider.tsx`. Country names come from ESPN in the page's language (the roster is also fetched with `?lang=es&region=es` for LaLiga), while the English name stays the internal key used to match players, flags and the map. The page wrapper's `lang` attribute switches too, so screen readers use the right pronunciation.

## Layout

- **Header**: app name and league dropdown with logos.
- **Left sidebar (desktop, 1024px and up)**: collapsed to a strip of team logos; it widens over the main section while hovered (or keyboard-focused) to show names and codes. Lists the selected league's teams with logos, alphabetically, from `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/teams` (cached for 6h). Logos switch to ESPN's dark variants in dark mode.
- **Teams bar (below 1024px)**: the sidebar is hidden and the teams appear in a dropdown in a bar under the header instead.
- **Main section (right)**: the selected team's current squad, grouped by position and ordered by squad number. Each player is drawn as a small shirt-back icon in the team's kit, with their name and number. Full width below 1024px.

## Player profile

Selecting a player (a tile or the pitch) opens a modal over the blurred page with their portrait, full name, nationality and place of birth, and in a second column their date of birth and age, position and height (ESPN, with Wikidata's more precise height (P2048) once loaded). It closes with the X, Escape or a click outside, fading out, and the player stays selected. Transfermarkt has no free API (and its terms forbid scraping), so the data comes from Wikidata (`lib/playerProfile.ts`, served by `app/api/player/route.ts`): the player is found by name among footballers and told apart from namesakes by ESPN's date of birth; full name is the birth name (P1477) or the Wikipedia infobox's `full_name`; place of birth is P19 (the best-known place when there are several, real places only) with its country, or a home nation for UK places, falling back to the infobox's `birth_place`; the photo is P18 from Wikimedia Commons. Profiles are cached for a day.

## Birthplace pins

While a country is selected, the map pins where each of its players was born. Pins close together on screen merge into one with a count. Hovering a pin shows a card with the player (or players) born there, and clicking a pin or a name opens the player's profile. Coordinates come with the profile: the Wikidata birthplace's coordinates (P625), or for the infobox fallback, the coordinates of the place it links to. The map's Mercator parameters are passed to the browser to place them. Profiles are loaded through a small shared client cache (`lib/profileStore.ts`), used by both the pins and the modal, with at most three lookups at a time.

## Manager

Below the formation pitch, a card shows the club's current manager: portrait, name, and nationality with flag. ESPN's coach data is historical, so this comes from Wikipedia and Wikidata (`lib/manager.ts`): the manager is the first link in the club infobox's `manager` field, the portrait is that article's page image, and nationality is the person's Wikidata *country for sport* (P1532), falling back to citizenship (P27), with the country's English or Spanish label and its flag (P41) from Wikimedia Commons. Shared Wikipedia/Wikidata helpers and the club-to-article mapping live in `lib/wikipedia.ts`. Results are cached for a day and the card streams in after the squad; if a manager has no photo, a neutral silhouette is shown. Clicking the card opens the manager's profile, the same modal as a player's (`components/ProfileDialog.tsx`) without position and height: photo, full name, date of birth and age, and place of birth with its flag, read from their Wikidata entry with the same helpers as player profiles.

## Formation

Beside the squad (in a right-hand column that stays in view while scrolling on wide screens; below the squad on narrower ones), a pitch shows the team's most-used formation over its last 10 completed league matches (from each match's line-up in `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/summary?event={id}`, cached for a day; the schedule comes from `.../teams/{teamId}/schedule`). Each position shows the player who started there most often in that formation, as a shirt icon in the team's kit. The pitch is vertical, with the goalkeeper at the top and the team attacking downwards (so the team's right side appears on the viewer's left). Players on the pitch share the page's selection: clicking one selects them in the squad and on the map.

The analysis is in `lib/formation.ts`. ESPN numbers each formation's positions consistently, so the most frequent starter per position is well defined; lines are rebuilt from the formation string (e.g. 4-2-3-1) and each player's position code. The pitch streams in after the squad so it doesn't delay the rest of the page.

## Kits

A third collapsible panel, **Kits** (*Equipaciones* in Spanish), shows the selected club's current-season home, away and third kits. They come from the club's English Wikipedia article (`lib/wikiKits.ts`): the infobox's kit parameters (`pattern_b1`, `body1`, … for kits 1–3) are rendered through Wikipedia's `{{Football kit}}` template via the MediaWiki API, and the result is reduced to layer positions, colours and `upload.wikimedia.org` image URLs, which the page stacks into the kit image. Wikipedia's HTML is never inserted into the page. Responses are cached for a day, the panel streams in after the squad.

Wikipedia articles are mapped from ESPN team ids in `ARTICLES` in `lib/wikipedia.ts` (all 132 clubs). Some clubs' articles still show an older season's kits; the season is read from Wikipedia's pattern names (e.g. `_lorient2526h` → 2025-26) and the panel says so when it isn't the current one, or when the names don't include a season. If a club has no article mapping, no kit data, or Wikipedia can't be reached, the panel falls back to drawn kits from `lib/kits.ts` (traditional home design plus approximate change-kit colours), labelled as illustrations.

## Squads and kits

- Squads come from `https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/teams/{teamId}/roster` (current season, cached for 1h), including squad numbers, positions and nationality. Each tile shows the player's nationality as a small round flag (ESPN's flag image, zoomed to fill the circle) in the bottom-right corner; hover it for the country name.
- No free API publishes kit designs, so each club's home kit is defined by hand in `lib/kits.ts`: pattern (`solid`, `stripes`, `hoops`, `sash`, `band`) and colours for the shirt, sleeves, trim and lettering. Home kits are defined for all 132 clubs across the seven leagues (2026-27); away/third illustrations exist for the LaLiga and Premier League clubs only and are just a fallback for the Wikipedia kits. These follow each club's traditional home design; seasonal details such as gradients or trim aren't modelled. Clubs without an entry get a plain shirt in ESPN's team colour.
- Below the team header, the page has two collapsible panels with matching header bars (click anywhere on a bar to toggle): **Nationalities** and **Squad** (player tiles plus the formation pitch). Both are open by default and collapse independently.
- The **Nationalities** panel holds the share charts and the world map. Collapsing keeps the map's zoom and any selection, and the selection status stays visible in the panel's title bar.
- In that panel, a row of ring charts shows each nationality's share of the squad (largest first, flag in the centre, percentage and country below). Hovering a ring previews that country on the map and tiles; clicking selects it, the same as clicking its flag on the map.
- Above the squad, a world map shows one round flag per nationality in the squad, with a count when several players share it, and tints those countries. Clicking a flag highlights that country's players and blurs the rest; clicking it again shows everyone. Player tiles are selectable too: hovering one highlights it, its country on the map and teammates of the same nationality; clicking selects the player (✓ badge), selects their country on the map and blurs everyone from other countries. Click the player again, their flag on the map, "Show all", or any empty space in the squad area to clear. Where flags would overlap (Europe especially), they're nudged apart with a thin line back to their country. The map zooms from 1× to 16×: + / − / reset buttons, Ctrl/⌘ + scroll or trackpad pinch (zooms around the cursor), two-finger pinch on touch screens, and double-click; drag to pan when zoomed. A plain scroll wheel still scrolls the page. Flags keep their size while zooming, so crowded regions separate as you zoom in.
- The map is drawn on the server from Natural Earth outlines (`world-atlas`, 1:110m) with `d3-geo` (Mercator projection), so no mapping code ships to the browser. Nationality names are matched to map countries in `lib/worldMap.ts`, which also has fixed positions for nations without their own shape at this scale (England, Scotland, Wales, Northern Ireland, Cape Verde, Malta and other small islands).
- Shirt names use the player's surname, or their single name for players like Pedri and Gavi. The lettering uses the Oswald font.
