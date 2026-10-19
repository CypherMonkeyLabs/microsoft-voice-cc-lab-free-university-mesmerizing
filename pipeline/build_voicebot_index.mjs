/* Build the offline Voice Lab chat index from this lab's own lessons.
   Usage: node pipeline/build_voicebot_index.mjs
   Writes campus/bot/voicebot-index.json. Do not edit that file by hand. */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokens } from "../shared/voicebot-chat/engine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "campus/bot/voicebot-index.json");

const SYN = {
  autoattendant: "attendant",
  callqueue: "queue",
  directrouting: "routing",
  operatorconnect: "operator",
  teamsphone: "teams",
  locationbased: "location",
  mediabypass: "bypass",
  cloudvoicemail: "voicemail",
  resourceaccount: "resource",
  azuread: "entra",
  aad: "entra",
  pstnusage: "usage",
  voiceroute: "route",
  dialplan: "dial",
  survivablebranch: "survivable",
  callanalytics: "analytics",
  copilotstudio: "copilot",
  contactcenter: "contact",
  unifiedrouting: "routing",
  sessionborder: "sbc",
  e164: "e164",
  normalisation: "normalization",
  licence: "license",
  licences: "license",
  licenses: "license",
  gateways: "gateway",
  queues: "queue",
  attendants: "attendant",
  codecs: "codec",
  certificates: "certificate",
  proxies: "proxy",
};

const VOLATILE = new Set(["t02", "t05", "t16"]);

function plain(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clip(text, max = 420) {
  const clean = plain(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  if (stop > 80) return cut.slice(0, stop + 1);
  return cut.trim();
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

const docs = [];
const seeds = [];

function add(doc) {
  const bodyText = [doc.ti, doc.body].filter(Boolean).join("\n");
  docs.push({
    i: doc.i,
    k: doc.k,
    ti: doc.ti,
    h: doc.h,
    s: doc.s || "",
    ex: clip(doc.ex || doc.body || doc.ti),
    eg: plain(doc.eg || "").slice(0, 180),
    fu: doc.fu || "",
    fq: doc.fq || "",
    act: doc.act || "",
    w: tokens(bodyText, SYN, 3),
    tw: tokens(doc.ti, SYN, 2),
  });
}

function seedFrom(doc, anyTerms) {
  const any = [...new Set(anyTerms.filter((term) => term && term.length >= 4))].slice(0, 4);
  if (!any.length) return;
  seeds.push({
    i: doc.i,
    h: doc.h,
    ti: doc.ti,
    k: doc.k,
    ex: doc.ex,
    eg: doc.eg || "",
    topic: any[0],
    any,
    allow: any,
    how: false,
    rank: 1,
  });
}

const tracks = [];
for (let n = 1; n <= 20; n += 1) {
  const id = `t${String(n).padStart(2, "0")}`;
  tracks.push(readJson(`campus/data/tracks/${id}.json`));
}
const manifest = readJson("campus/data/manifest.json");
const trackTitle = new Map((manifest.tracks || []).map((track) => [track.id, track.title]));

for (const track of tracks) {
  const title = trackTitle.get(track.id) || track.id;
  add({
    i: `track:${track.id}`,
    k: "level",
    ti: title,
    h: `#/track/${track.id}`,
    s: track.id,
    ex: `Track ${track.id} is ${title}. Open it to see the lessons in this world.`,
    body: `${title} ${track.id} track world`,
  });
  for (const lesson of track.lessons) {
    const accessed = (lesson.sources || []).map((source) => source.accessed).find(Boolean) || "2026-10-14";
    let excerpt = (lesson.body || []).join(" ");
    if (VOLATILE.has(track.id)) {
      excerpt += ` Checked ${accessed}. Product facts such as availability, limits, and exam status change. Treat this excerpt as unconfirmed until you re-open the cited vendor page.`;
    } else if ((lesson.sources || []).length) {
      excerpt += ` Checked ${accessed}.`;
    }
    const doc = {
      i: `lesson:${lesson.id}`,
      k: "lesson",
      ti: lesson.title,
      h: `#/lesson/${lesson.id}`,
      s: track.id,
      ex: excerpt,
      eg: lesson.say || "",
      body: [lesson.title, lesson.why, ...(lesson.body || []), lesson.say || "", lesson.fault || ""].join("\n"),
    };
    add(doc);
    const titleTerms = tokens(lesson.title, SYN, 2);
    seedFrom(docs[docs.length - 1], titleTerms);
  }
}

const glossary = readJson("campus/data/glossary.json");
for (const row of glossary) {
  const term = plain(row.term);
  if (!term) continue;
  const excerpt = `${plain(row.plain)} ${plain(row.why)} Checked ${row.accessed || "2026-10-14"}.`;
  add({
    i: `glossary:${term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    k: "glossary",
    ti: term,
    h: "#/glossary",
    s: row.track || "",
    ex: excerpt,
    eg: plain(row.config),
    body: [term, row.plain, row.why, row.config, row.fault].join("\n"),
  });
}

add({
  i: "page:downloads",
  k: "download",
  ti: "Downloads",
  h: "#/downloads",
  ex: "Cheat sheets, flashcards, and the offline zip are on the downloads page. Each file carries the lab footer.",
  body: "downloads cheat sheet sheets flashcards zip",
});
add({
  i: "page:labs",
  k: "simulator",
  ti: "Studios",
  h: "#/labs",
  ex: "The studios are simulations in this browser. They do not sign in to Microsoft 365.",
  body: "labs studios simulation powershell dial plan routing",
});
add({
  i: "sim:cert-match",
  k: "simulator",
  ti: "Certificate name match",
  h: "cert-match.html",
  ex: "A browser simulation. Type an SBC FQDN and a certificate name and see whether they match. It does not call Microsoft or a session border controller.",
  body: "certificate fqdn sbc san wildcard simulation match",
});

const index = { v: 2, syn: SYN, seeds, docs };
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(index)}\n`);
for (const name of ["engine.js", "ui.js", "chat.css"]) {
  copyFileSync(join(root, "shared/voicebot-chat", name), join(root, "campus/bot", name));
}
console.log(`voicebot index: ${docs.length} docs, ${seeds.length} seeds -> ${outPath}`);
