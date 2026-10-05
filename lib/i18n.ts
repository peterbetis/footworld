export type Locale = "en" | "es";

/** The interface follows the selected league: LaLiga in Spanish, everything else in English. */
export function localeForLeague(slug: string | null | undefined): Locale {
  return slug === "esp.1" ? "es" : "en";
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const en = {
  locale: "en" as Locale,

  // Header and league picker
  selectLeague: "Select a league",
  pickLeagueTitle: "Pick a league to start",
  pickLeagueSubtitle: "See where every club's players come from, on a world map.",
  pickClubTitle: (league: string) => `Pick a ${league} club`,
  pickClubSubtitle: "See its squad, where its players come from, its kits and more.",
  changeLeague: "Change league",
  europeanLeagues: (n: number) => `${n} European leagues`,
  leagueLabel: (name: string) => `League: ${name}`,
  soon: "Soon",
  leagueCountry: (country: string) => country,

  // Page states
  mainContent: "Main content",
  teamsSidebar: "Teams",
  selectLeagueForTeams: "Select a league to see its teams.",
  selectTeamForSquad: "Select a team to see its squad.",
  selectLeagueThenTeam: "Select a league, then a team, to see its squad.",

  // Teams list and dropdown
  leagueTeams: (league: string) => `${league} teams`,
  teamsLoadError: "Couldn't load teams right now. Try again shortly.",
  loadingTeams: "Loading teams",
  teamColumn: "Team",
  codeColumn: "Code",
  clubs: (n: number) => plural(n, "club", "clubs"),
  selectATeam: "Select a team",
  selectLeagueTeam: (league: string) => `Select a ${league} team`,
  teamLabel: (name: string) => `Team: ${name}`,

  // Squad header
  squadLoadError: "Couldn't load this squad right now. Try again shortly.",
  loadingSquad: "Loading squad",
  seasonSquad: (season: string) => `${season} squad`,
  players: (n: number) => plural(n, "player", "players"),

  // Nationalities panel
  nationalities: "Nationalities",
  countries: (n: number) => plural(n, "country", "countries"),
  playersFrom: (n: number, country: string) => `${plural(n, "player", "players")} from ${country}`,
  showAll: "Show all",
  clearSelection: "Clear the selected country and player",
  hintFlagOrPlayer: "Click a flag or a player to highlight",
  hintPlayer: "Click a player to highlight",
  sharesLabel: "Nationalities by share of the squad",
  shareOf: (country: string, count: number, total: number, pct: number) =>
    `${country}: ${count} of ${total} players (${pct}%)`,
  markerLabel: (country: string, n: number) => `${country}: ${plural(n, "player", "players")}`,
  bornIn: (name: string, place: string) => `${name}, born in ${place}`,
  bornInMany: (n: number, place: string) => `${n} players born in or near ${place}`,
  bornHere: (n: number) => `${plural(n, "player", "players")} born here`,
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetZoom: "Reset zoom",
  zoomHintPointer: "Ctrl/⌘ + scroll or pinch to zoom · drag to pan",
  zoomHintTouch: "Pinch to zoom · drag to pan",

  // Squad panel
  squad: "Squad",
  squadHint: "Players by position · most used formation",
  goalkeepers: "Goalkeepers",
  defenders: "Defenders",
  midfielders: "Midfielders",
  forwards: "Forwards",
  numberLabel: (n: number) => `number ${n}`,

  // Formation
  mostUsedFormation: "Most used formation",
  noLineups: "No league line-ups to analyse yet this season.",
  formationUsage: (used: number, analysed: number) =>
    `Used in ${used} of the last ${analysed} league matches · most frequent starter in each position`,
  lineupLabel: (formation: string) => `Most used starting line-up, ${formation}`,
  startedOf: (starts: number, of: number) => `started ${starts} of ${of}`,
  leftSquad: "no longer in the squad",
  loadingFormation: "Loading formation",

  // Manager
  manager: "Manager",
  loadingManager: "Loading manager",
  managerPortrait: (name: string) => `Portrait of ${name}`,
  managerProfile: (name: string) => `${name}, manager: open profile`,

  // Player profile modal
  playerProfile: (name: string) => `${name}'s profile`,
  closeProfile: "Close",
  fullName: "Full name",
  birthPlace: "Place of birth",
  unknown: "Unknown",
  loadingProfile: "Loading profile",
  profileUnavailable: "No profile found for this player.",
  playerPhoto: (name: string) => `Photo of ${name}`,
  dateOfBirth: "Date of birth",
  ageYears: (n: number) => `${n} years old`,
  position: "Position",
  positionName: { G: "Goalkeeper", D: "Defender", M: "Midfielder", F: "Forward" } as Record<
    "G" | "D" | "M" | "F",
    string
  >,
  height: "Height",
  usualSpot: (n: number) => `Usual spot in the team, from ${plural(n, "league start", "league starts")}`,
  noStartsYet: "No league starts yet: shown in their line",

  // Kits
  kits: "Kits",
  kitCount: (n: number) => plural(n, "kit", "kits"),
  kitsHint: "This season's kits",
  kitsIllustrated: "Illustrated from club colours · not official images",
  kitsLoading: "Loading kits",
  kitsOlderSeason: (season: string) =>
    `Wikipedia hasn't added this club's current-season kits yet; showing ${season}.`,
  kitsUnknownSeason: "Wikipedia doesn't say which season these kits are from.",
  homeKit: "Home",
  awayKit: "Away",
  thirdKit: "Third",
  kitColours: "Colours",
  kitLabel: (kit: string, team: string) => `${team} ${kit.toLowerCase()} kit`,
};

export type Messages = typeof en;

const es: Messages = {
  locale: "es",

  selectLeague: "Elige una liga",
  pickLeagueTitle: "Elige una liga para empezar",
  pickLeagueSubtitle: "Descubre de dónde vienen los jugadores de cada club, en un mapa del mundo.",
  pickClubTitle: (league) => `Elige un club de ${league}`,
  pickClubSubtitle: "Descubre su plantilla, de dónde vienen sus jugadores, sus equipaciones y más.",
  changeLeague: "Cambiar de liga",
  europeanLeagues: (n) => `${n} ligas europeas`,
  leagueLabel: (name) => `Liga: ${name}`,
  soon: "Pronto",
  leagueCountry: (country) =>
    ({
      Spain: "España",
      England: "Inglaterra",
      Italy: "Italia",
      Germany: "Alemania",
      France: "Francia",
      Portugal: "Portugal",
      Netherlands: "Países Bajos",
    })[country] ?? country,

  mainContent: "Contenido principal",
  teamsSidebar: "Equipos",
  selectLeagueForTeams: "Elige una liga para ver sus equipos.",
  selectTeamForSquad: "Elige un equipo para ver su plantilla.",
  selectLeagueThenTeam: "Elige una liga y después un equipo para ver su plantilla.",

  leagueTeams: (league) => `Equipos de ${league}`,
  teamsLoadError: "No se pudieron cargar los equipos. Inténtalo de nuevo en un momento.",
  loadingTeams: "Cargando equipos",
  teamColumn: "Equipo",
  codeColumn: "Código",
  clubs: (n) => plural(n, "club", "clubes"),
  selectATeam: "Elige un equipo",
  selectLeagueTeam: (league) => `Elige un equipo de ${league}`,
  teamLabel: (name) => `Equipo: ${name}`,

  squadLoadError: "No se pudo cargar esta plantilla. Inténtalo de nuevo en un momento.",
  loadingSquad: "Cargando plantilla",
  seasonSquad: (season) => `Plantilla ${season}`,
  players: (n) => plural(n, "jugador", "jugadores"),

  nationalities: "Nacionalidades",
  countries: (n) => plural(n, "país", "países"),
  playersFrom: (n, country) => `${plural(n, "jugador", "jugadores")} de ${country}`,
  showAll: "Ver todos",
  clearSelection: "Quitar el país y el jugador seleccionados",
  hintFlagOrPlayer: "Pulsa una bandera o un jugador para destacarlo",
  hintPlayer: "Pulsa un jugador para destacarlo",
  sharesLabel: "Nacionalidades por porcentaje de la plantilla",
  shareOf: (country, count, total, pct) => `${country}: ${count} de ${total} jugadores (${pct}%)`,
  markerLabel: (country, n) => `${country}: ${plural(n, "jugador", "jugadores")}`,
  bornIn: (name, place) => `${name}, nacido en ${place}`,
  bornInMany: (n, place) => `${n} jugadores nacidos en ${place} o cerca`,
  bornHere: (n) => `${plural(n, "jugador nacido", "jugadores nacidos")} aquí`,
  zoomIn: "Acercar",
  zoomOut: "Alejar",
  resetZoom: "Restablecer zoom",
  zoomHintPointer: "Ctrl/⌘ + rueda o pellizca para hacer zoom · arrastra para moverte",
  zoomHintTouch: "Pellizca para hacer zoom · arrastra para moverte",

  squad: "Plantilla",
  squadHint: "Jugadores por posición · formación más utilizada",
  goalkeepers: "Porteros",
  defenders: "Defensas",
  midfielders: "Centrocampistas",
  forwards: "Delanteros",
  numberLabel: (n) => `dorsal ${n}`,

  mostUsedFormation: "Formación más utilizada",
  noLineups: "Todavía no hay alineaciones de liga que analizar esta temporada.",
  formationUsage: (used, analysed) =>
    `Utilizada en ${used} de los últimos ${analysed} partidos de liga · titular más habitual en cada posición`,
  lineupLabel: (formation) => `Once inicial más utilizado, ${formation}`,
  startedOf: (starts, of) => `titular ${starts} de ${of}`,
  leftSquad: "ya no está en la plantilla",
  loadingFormation: "Cargando formación",

  manager: "Entrenador",
  loadingManager: "Cargando entrenador",
  managerPortrait: (name) => `Retrato de ${name}`,
  managerProfile: (name) => `${name}, entrenador: ver ficha`,

  playerProfile: (name) => `Ficha de ${name}`,
  closeProfile: "Cerrar",
  fullName: "Nombre completo",
  birthPlace: "Lugar de nacimiento",
  unknown: "Desconocido",
  loadingProfile: "Cargando ficha",
  profileUnavailable: "No se ha encontrado la ficha de este jugador.",
  playerPhoto: (name) => `Foto de ${name}`,
  dateOfBirth: "Nacido el",
  ageYears: (n) => `${n} años`,
  position: "Posición",
  positionName: { G: "Portero", D: "Defensa", M: "Centrocampista", F: "Delantero" },
  height: "Altura",
  usualSpot: (n) => `Posición habitual en el equipo, según ${plural(n, "titularidad", "titularidades")} en liga`,
  noStartsYet: "Aún sin titularidades en liga: se muestra en su línea",

  kits: "Equipaciones",
  kitCount: (n) => plural(n, "equipación", "equipaciones"),
  kitsHint: "Equipaciones de esta temporada",
  kitsIllustrated: "Ilustradas con los colores del club · no son imágenes oficiales",
  kitsLoading: "Cargando equipaciones",
  kitsOlderSeason: (season) =>
    `Wikipedia aún no tiene las equipaciones de esta temporada para este club; se muestran las de ${season}.`,
  kitsUnknownSeason: "Wikipedia no indica de qué temporada son estas equipaciones.",
  homeKit: "Primera",
  awayKit: "Segunda",
  thirdKit: "Tercera",
  kitColours: "Colores",
  kitLabel: (kit, team) => `${kit} equipación del ${team}`,
};

export function getMessages(locale: Locale): Messages {
  return locale === "es" ? es : en;
}
