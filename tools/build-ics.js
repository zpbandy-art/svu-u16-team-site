// build-ics.js - builds schedule.ics (the calendar people subscribe to on
// their phones) from schedule.csv + kits.csv.
//
// Runs automatically: the GitHub Pages workflow (.github/workflows/pages.yml)
// runs `node tools/build-ics.js` on every push, so the calendar is always
// rebuilt from whatever schedule.csv says - including score saves from
// admin.html. schedule.ics is never committed to the repo.
//
// To try it locally: `node tools/build-ics.js` from the repo root writes
// schedule.ics next to schedule.csv.
//
// Calendar rules (Zach's choices):
// - 90-minute events, Eastern time.
// - A game with no kickoff time yet is an all-day event that shows as Free.
// - Each game keeps the same event ID (its game number), so a time change or a
//   TBD opponent getting filled in updates the event instead of adding another.
// - Notes: arrive 1 hour early for warm-ups, which kit to wear, competition,
//   the final score once played, and the VEO link.
//
// isAway / svuKit below mirror the same rules in shared.js. If those change
// there, change them here too.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://zpbandy-art.github.io/svu-u16-team-site/";
const TZ = "America/New_York";
const GAME_MINUTES = 90;
const WARMUP_MINUTES = 60;
const HOME_VENUE = "Rockingham Park";
const KIT_TEXT = {
  home: "Home kit (white with green hoops)",
  away: "Away kit (navy with green hoops)",
};

// ---------- CSV (same parsing rules as parseCSV in shared.js) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  text = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(v => v.trim() !== "")).map(r => {
    const o = {};
    headers.forEach((h, k) => { o[h] = (r[k] ?? "").trim(); });
    return o;
  });
}

function readCSV(name, required) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) {
    if (required) throw new Error(`${name} not found`);
    return [];
  }
  return parseCSV(fs.readFileSync(file, "utf8"));
}

// ---------- Game rules (mirrors shared.js) ----------
function isAway(g) {
  return g.competition === "VCSL Regular Season" && !(g.location || "").includes(HOME_VENUE);
}

function svuKit(g, kits) {
  if (kits[g.game]) return kits[g.game].toLowerCase();
  if (g.competition === "VCSL Regular Season") return isAway(g) ? "away" : "home";
  return null;
}

function isPostponed(g) {
  return (g.status || "").toLowerCase() === "postponed" && !g.result;
}

// ---------- Dates ----------
// Works on wall-clock Eastern time throughout; the calendar app does the
// time zone math from TZID.
function parseDate(s) {
  const [m, d, y] = (s || "").split("/").map(n => parseInt(n, 10));
  return m && d && y ? { y, m, d } : null;
}

function parseTime(s) {
  const t = (s || "").match(/^(\d{1,2}):(\d{2})\s*([AaPp])[Mm]$/);
  if (!t) return null;
  return (parseInt(t[1], 10) % 12 + (/p/i.test(t[3]) ? 12 : 0)) * 60 + parseInt(t[2], 10);
}

const pad = n => String(n).padStart(2, "0");

// Date + minutes-after-midnight -> "YYYYMMDDTHHMMSS" (rolls past midnight if needed)
function stamp(date, minutes) {
  const dt = new Date(Date.UTC(date.y, date.m - 1, date.d, 0, minutes));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00`;
}

function dayStamp(date, addDays = 0) {
  const dt = new Date(Date.UTC(date.y, date.m - 1, date.d + addDays));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

function clock(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${pad(m % 60)} ${h < 12 ? "AM" : "PM"}`;
}

// ---------- iCalendar text ----------
function icsText(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 bytes must wrap, with continuation lines starting
// with a space. Splits on bytes without cutting a multi-byte character.
function fold(line) {
  const out = [];
  let cur = "", bytes = 0, limit = 75;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, "utf8");
    if (bytes + b > limit) {
      out.push(cur);
      cur = " ";
      bytes = 1;
      limit = 75;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

// "Vinyard Park — Roanoke, VA" + 24012 -> "Vinyard Park, Roanoke, VA 24012"
// (Maps finds venues more reliably with a plain comma and the zip code.)
function mapsLocation(g) {
  let loc = (g.location || "").replace(/\s*—\s*/g, ", ");
  if (g.zipcode && !loc.includes(g.zipcode)) loc += ` ${g.zipcode}`;
  return loc;
}

// ---------- Events ----------
function summaryOf(g) {
  const opp = g.opponent || "TBD";
  let s = `SVU ${isAway(g) ? "@" : "vs"} ${opp}`;
  const r = (g.result || "").toUpperCase();
  if (r && g.svu_score !== "" && g.opp_score !== "") s += ` (${r} ${g.svu_score}-${g.opp_score})`;
  if (isPostponed(g)) s = `POSTPONED: ${s}`;
  return s;
}

function descriptionOf(g, kickoff, kit) {
  const lines = [];
  const r = (g.result || "").toUpperCase();
  const label = { W: "Win", L: "Loss", T: "Draw" }[r];

  if (label) {
    lines.push(`Final: SVU ${g.svu_score}, ${g.opponent} ${g.opp_score} (${label})`);
  } else if (isPostponed(g)) {
    lines.push("Postponed. New date to be announced.");
  } else {
    lines.push(kickoff != null
      ? `Arrive by ${clock(kickoff - WARMUP_MINUTES)} for warm-ups (1 hour before kickoff).`
      : "Arrive 1 hour before kickoff for warm-ups. Kickoff time to be announced.");
    lines.push(`Wear: ${kit ? KIT_TEXT[kit] : "kit to be announced, check the site closer to game day"}`);
  }

  lines.push("", g.competition);
  if (g.note) lines.push(g.note);
  if (g.veo_url) lines.push("", `Watch on VEO: ${g.veo_url}`);
  lines.push("", `Schedule: ${SITE}schedule.html`);
  return lines.join("\n");
}

function eventOf(g, kits, dtstamp) {
  const date = parseDate(g.date);
  if (!date) return null;
  const kickoff = parseTime(g.time);
  const kit = svuKit(g, kits);

  const lines = [
    "BEGIN:VEVENT",
    `UID:svu-u16-game-${g.game}@zpbandy-art.github.io`,
    `DTSTAMP:${dtstamp}`,
  ];
  if (kickoff != null) {
    lines.push(
      `DTSTART;TZID=${TZ}:${stamp(date, kickoff)}`,
      `DTEND;TZID=${TZ}:${stamp(date, kickoff + GAME_MINUTES)}`,
      "TRANSP:OPAQUE",
    );
  } else {
    // No kickoff time yet: all-day, shown as Free so it doesn't block the day.
    lines.push(
      `DTSTART;VALUE=DATE:${dayStamp(date)}`,
      `DTEND;VALUE=DATE:${dayStamp(date, 1)}`,
      "TRANSP:TRANSPARENT",
    );
  }
  lines.push(
    `SUMMARY:${icsText(summaryOf(g))}`,
    `LOCATION:${icsText(mapsLocation(g))}`,
    `DESCRIPTION:${icsText(descriptionOf(g, kickoff, kit))}`,
    `URL:${g.veo_url || SITE + "schedule.html"}`,
    `CATEGORIES:${icsText(g.competition)}`,
    "END:VEVENT",
  );
  return lines;
}

// Eastern time zone definition, so every calendar app reads TZID the same way.
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZ}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function build() {
  const games = readCSV("schedule.csv", true);
  const kits = {};
  readCSV("kits.csv", false).forEach(k => { if (k.game) kits[k.game] = k.svu_kit; });

  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shenandoah Valley United//SVU U16 Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SVU U16",
    "X-WR-CALDESC:Shenandoah Valley United U16 Boys game schedule",
    `X-WR-TIMEZONE:${TZ}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...VTIMEZONE,
  ];

  let count = 0;
  const seen = new Set();
  for (const g of games) {
    if (!g.game || seen.has(g.game)) {
      console.warn(`Skipping a row with a missing or repeated game number (${g.game || "blank"})`);
      continue;
    }
    seen.add(g.game);
    const ev = eventOf(g, kits, dtstamp);
    if (!ev) { console.warn(`Skipping game ${g.game}: no valid date`); continue; }
    lines.push(...ev);
    count++;
  }
  lines.push("END:VCALENDAR");

  const out = lines.map(fold).join("\r\n") + "\r\n";
  fs.writeFileSync(path.join(ROOT, "schedule.ics"), out, "utf8");
  console.log(`schedule.ics: ${count} games`);
}

build();
