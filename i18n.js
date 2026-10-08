// i18n.js - English / Spanish switch for the public pages (index, schedule,
// roster, player). Load it BEFORE shared.js and before each page's own
// script, since both call t().
//
// How it works:
// - Every on-screen phrase is written in English in the page code and
//   wrapped in t("..."). In Spanish mode t() looks the phrase up in ES below;
//   anything missing falls back to the English text, so nothing ever breaks.
// - Static text in the HTML is marked with data-i18n (translates the
//   element's own text) or data-i18n-alt / data-i18n-aria (attributes).
// - The language is chosen by ?lang=es / ?lang=en in the URL first, then the
//   saved choice in this browser, then English. The EN | ES toggle above the
//   card saves the choice and reloads the page, so every page you click to
//   stays in that language.
// - Names never change: players, opponents, venues, schools, competitions.
//
// Adding a new label to a page: write it as t("New label") and add a
// "New label": "Spanish text" line to ES. Same-English-different-meaning
// phrases use a "|context" suffix, e.g. t("Upcoming|title"); English mode
// shows everything before the "|".
//
// CACHE NOTE: pages load this as i18n.js?v=N. After editing, bump N on all
// four pages (index, schedule, roster, player).

const LANG_KEY = "svu_lang";
const LANGS = ["en", "es"];

const LANG = (() => {
  let fromUrl = null;
  try { fromUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (LANGS.includes(fromUrl)) {
    try { localStorage.setItem(LANG_KEY, fromUrl); } catch (e) {}
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch (e) {}
  return "en"; // English is the default
})();
document.documentElement.lang = LANG;

const ES = {
  // ---- Shared / navigation ----
  "Home": "Inicio",
  "Roster": "Plantel",
  "Fixtures": "Partidos",
  "Team pages": "Páginas del equipo",
  "Shenandoah Valley United logo": "Escudo de Shenandoah Valley United",
  "Language": "Idioma",
  "Schedule data couldn't be loaded.": "No se pudieron cargar los datos del calendario.",

  // ---- Records ----
  "Overall": "General",
  "Reg. Season": "Temp. regular",
  "(W-L-T)": "(G-P-E)",

  // ---- Home page ----
  "This Weekend": "Este fin de semana",
  "This Week": "Esta semana",
  "Next Up": "Próximo partido",
  "Upcoming|title": "Próximos partidos",
  "No upcoming games scheduled. See {link} for results.": "No hay partidos programados. Consulta {link} para ver los resultados.",
  "Competitions": "Competiciones",
  "Tables": "Tablas",
  "Table": "Tabla",
  "No table": "Sin tabla",
  "No games played yet": "Aún no se han jugado partidos",

  // ---- Game status ----
  "Upcoming": "Próximo",
  "Live": "En vivo",
  "Postponed": "Aplazado",
  "PPD": "APL",
  "Final": "Final",
  "Win": "Victoria",
  "Loss": "Derrota",
  "Draw": "Empate",
  "Time TBD": "Hora por definir",
  "TBD": "Por definir",
  "FT": "Final",

  // ---- Tournament rounds (shown inside "TBD (...)" opponents) ----
  "Finals": "Final",
  "Semi-Finals": "Semifinales",
  "Quarter-Finals": "Cuartos de final",
  "Round of 16": "Octavos de final",
  "Consolation": "Consolación",

  // ---- Weather ----
  "Clear": "Despejado",
  "Mostly clear": "Mayormente despejado",
  "Partly cloudy": "Parcialmente nublado",
  "Cloudy": "Nublado",
  "Fog": "Niebla",
  "Drizzle": "Llovizna",
  "Heavy rain": "Lluvia fuerte",
  "Rain": "Lluvia",
  "Snow": "Nieve",
  "Showers": "Chubascos",
  "Snow showers": "Nevadas",
  "Thunderstorms": "Tormentas eléctricas",
  "Kickoff": "Al inicio",
  "Day forecast": "Pronóstico del día",
  "{n}% rain": "{n}% lluvia",
  "Wind {n} mph": "Viento {n} mph",
  "Forecast available closer to game day": "Pronóstico disponible cerca del día del partido",

  // ---- Fixtures page ----
  "Filter by competition": "Filtrar por competición",
  "All": "Todos",
  "No games in this competition yet.": "Aún no hay partidos en esta competición.",
  "Highlights": "Resumen",
  "Watch full match": "Ver partido completo",
  "Watch clip": "Ver clip",
  "(opp)": "(rival)",
  "PK": "Penal",

  // ---- Roster page ----
  "Team Roster": "Plantel del equipo",
  "{name} player profile": "Perfil de {name}",
  "Roster data couldn't be loaded.": "No se pudo cargar el plantel.",
  "GK": "POR",
  "DF": "DEF",
  "MF": "MED",
  "FW": "DEL",

  // ---- Player page ----
  "Loading…": "Cargando…",
  "Goalkeeper": "Portero",
  "Defender": "Defensa",
  "Midfielder": "Mediocampista",
  "Forward": "Delantero",
  "Games": "Partidos",
  "Goals": "Goles",
  "Assists": "Asistencias",
  "Goals Against": "Goles en contra",
  "Goals Against Avg": "Promedio de goles en contra",
  "Shots on Target Against": "Tiros al arco en contra",
  "Saves": "Atajadas",
  "Full game": "Partido completo",
  "1st half": "1er tiempo",
  "2nd half": "2do tiempo",
  "{spells} in goal": "{spells} en el arco",
  "1 save": "1 atajada",
  "{n} saves": "{n} atajadas",
  "Clean sheet": "Valla invicta",
  "{n} clean sheets": "{n} vallas invictas",
  "Clean sheet vs {opp}": "Valla invicta vs {opp}",
  "Goal": "Gol",
  "Assist": "Asistencia",
  "{n} assists": "{n} asistencias",
  "Did not play": "No jugó",
  "DNP": "NJ",
  "Played": "Jugó",
  "{n} G": "{n} G",
  "{n} A": "{n} A",
  "{n} GA": "{n} GC",
  "Class": "Promoción",
  "Height": "Estatura",
  "Weight": "Peso",
  "lbs": "lb",
  "High School": "Escuela secundaria",
  "This Season": "Esta temporada",
  "Game Log": "Registro de partidos",
  "No games played yet.": "Aún no hay partidos jugados.",
  "Back to roster": "Volver al plantel",
  "No profile for this player yet.": "Este jugador aún no tiene perfil.",
  "Player data couldn't be loaded.": "No se pudieron cargar los datos del jugador.",
};

// Translate one phrase. vars fills {placeholders}: t("{n} saves", {n: 3}).
function t(key, vars) {
  let s = (LANG === "es" && Object.prototype.hasOwnProperty.call(ES, key)) ? ES[key] : key.split("|")[0];
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

// Result letter from schedule.csv (W/L/T) -> what to show (Spanish G/P/E).
function resultLetter(r) {
  r = (r || "").trim().toUpperCase();
  if (LANG !== "es") return r;
  return { W: "G", L: "P", T: "E" }[r] || r;
}

// Opponent name for display. Real team names never change; the bracket
// placeholders do: "TBD (Finals)" -> "Por definir (Final)". Logo lookups
// keep using the raw schedule.csv name.
function oppName(name) {
  const m = /^TBD(?:\s*\((.+)\))?$/.exec((name || "").trim());
  if (!m) return name;
  return m[1] ? `${t("TBD")} (${t(m[1])})` : t("TBD");
}

// Game note: schedule.csv's note_es when it's filled in, else the English note.
function gameNote(g) {
  return (LANG === "es" && (g.note_es || "").trim()) ? g.note_es : (g.note || "");
}

// Small free-text tags in events.csv's detail column (e.g. "PK").
function eventDetail(d) {
  return d ? t(d) : d;
}

// Translate static HTML marked with data-i18n / data-i18n-alt / data-i18n-aria.
// The English text is the key; it's remembered so this can run more than once.
function applyI18n(root) {
  if (LANG === "en") return;
  (root || document).querySelectorAll("[data-i18n]").forEach(el => {
    if (!el.dataset.i18nKey) el.dataset.i18nKey = el.dataset.i18n || el.textContent.trim();
    el.textContent = t(el.dataset.i18nKey);
  });
  (root || document).querySelectorAll("[data-i18n-alt]").forEach(el => { el.alt = t(el.dataset.i18nAlt); });
  (root || document).querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
}

// Switch language: save it, set ?lang= in the address (so a copied link opens
// in the same language), and reload so everything re-renders.
function setLang(lang) {
  if (!LANGS.includes(lang) || lang === LANG) return;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  const url = new URL(location.href);
  if (lang === "en") url.searchParams.delete("lang"); else url.searchParams.set("lang", lang);
  location.replace(url.toString());
}

// If this browser can't save the choice (some private modes), carry it on
// links to the other pages instead, so it still sticks while clicking around.
document.addEventListener("click", e => {
  if (LANG === "en") return;
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a || a.target === "_blank") return;
  const href = a.getAttribute("href");
  if (!/^[\w-]+\.html(\?|#|$)/.test(href)) return; // only links to our own pages
  const url = new URL(href, location.href);
  url.searchParams.set("lang", LANG);
  a.href = url.toString();
}, true);

// EN | ES switch in a slim bar above the card.
function mountLangToggle() {
  const page = document.querySelector(".page");
  if (!page || document.getElementById("lang-bar")) return;
  const style = document.createElement("style");
  style.textContent = `
    .lang-bar{ display:flex; justify-content:flex-end; margin: -6px 2px 10px; }
    .lang-switch{ display:inline-flex; align-items:center; gap:2px; padding:3px;
      border:1px solid var(--line); border-radius:999px; background:var(--card); }
    .lang-switch svg{ width:14px; height:14px; margin:0 3px 0 5px; color:var(--ink-soft); flex:none; }
    .lang-switch button{ font: 600 12px/1 Inter, system-ui, sans-serif; letter-spacing:.04em;
      border:0; background:transparent; color:var(--ink-soft); padding:6px 10px;
      border-radius:999px; cursor:pointer; }
    .lang-switch button.is-active{ background:var(--navy-2); color:#fff; }
    @media (prefers-color-scheme: dark){
      :root:not([data-theme="light"]) .lang-switch button.is-active{ background:var(--blue); }
    }
    :root[data-theme="dark"] .lang-switch button.is-active{ background:var(--blue); }
  `;
  document.head.appendChild(style);
  const bar = document.createElement("div");
  bar.className = "lang-bar";
  bar.id = "lang-bar";
  bar.innerHTML = `<div class="lang-switch" role="group" aria-label="${t("Language")}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></svg>
      ${LANGS.map(l => `<button type="button" lang="${l}" data-lang="${l}" class="${l === LANG ? "is-active" : ""}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join("")}
    </div>`;
  bar.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  page.insertBefore(bar, page.firstChild);
}

mountLangToggle();
applyI18n();
