/* Bible Present Lists — prepare a list of Bible passages and sermon quotes on an iPad (or any
   device) and send it to Bible Present on the computer. Works offline for the Bible; sermons
   come from Message Hub (search.messagehub.info). */
"use strict";

// ---------------------------------------------------------------- book names & references
const BOOKS_NL = ["Genesis", "Exodus", "Leviticus", "Numeri", "Deuteronomium", "Jozua", "Richteren", "Ruth",
  "1 Samuël", "2 Samuël", "1 Koningen", "2 Koningen", "1 Kronieken", "2 Kronieken", "Ezra", "Nehemia",
  "Esther", "Job", "Psalmen", "Spreuken", "Prediker", "Hooglied", "Jesaja", "Jeremia", "Klaagliederen",
  "Ezechiël", "Daniël", "Hosea", "Joël", "Amos", "Obadja", "Jona", "Micha", "Nahum", "Habakuk", "Sefanja",
  "Haggaï", "Zacharia", "Maleachi", "Mattheüs", "Markus", "Lukas", "Johannes", "Handelingen", "Romeinen",
  "1 Korinthe", "2 Korinthe", "Galaten", "Efeze", "Filippenzen", "Kolossenzen", "1 Thessalonicenzen",
  "2 Thessalonicenzen", "1 Timotheüs", "2 Timotheüs", "Titus", "Filemon", "Hebreeën", "Jakobus", "1 Petrus",
  "2 Petrus", "1 Johannes", "2 Johannes", "3 Johannes", "Judas", "Openbaring"];
const BOOKS_EN = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther",
  "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation"];
const BOOKS_FR = ["Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome", "Josué", "Juges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Rois", "2 Rois", "1 Chroniques", "2 Chroniques", "Esdras", "Néhémie", "Esther",
  "Job", "Psaumes", "Proverbes", "Ecclésiaste", "Cantique des cantiques", "Ésaïe", "Jérémie", "Lamentations",
  "Ézéchiel", "Daniel", "Osée", "Joël", "Amos", "Abdias", "Jonas", "Michée", "Nahum", "Habacuc", "Sophonie",
  "Aggée", "Zacharie", "Malachie", "Matthieu", "Marc", "Luc", "Jean", "Actes", "Romains", "1 Corinthiens",
  "2 Corinthiens", "Galates", "Éphésiens", "Philippiens", "Colossiens", "1 Thessaloniciens",
  "2 Thessaloniciens", "1 Timothée", "2 Timothée", "Tite", "Philémon", "Hébreux", "Jacques", "1 Pierre",
  "2 Pierre", "1 Jean", "2 Jean", "3 Jean", "Jude", "Apocalypse"];
const NAMES = { nl: BOOKS_NL, en: BOOKS_EN, fr: BOOKS_FR };
const EXTRA_ALIASES = { revelationofjohn: 65, openbaringen: 65, apocalyps: 65, songofsongs: 21, canticles: 21,
  qohelet: 20, psalm: 18, ps: 18, mattheus: 39, matteus: 39, mat: 39, efeziers: 48, korintiers: 45,
  handelingenderapostelen: 43 };

function fold(text) {
  return (text || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function normalizeBook(text) {
  let t = fold(text).trim();
  const m = t.match(/^(iii|ii|i)\s+(.*)$/);
  if (m) t = { iii: "3", ii: "2", i: "1" }[m[1]] + m[2];
  return t.replace(/[\s.\-_']/g, "");
}
const LOOKUP = [];
for (let i = 0; i < 66; i++) for (const n of [BOOKS_NL[i], BOOKS_EN[i], BOOKS_FR[i]]) LOOKUP.push([normalizeBook(n), i]);
for (const [alias, i] of Object.entries(EXTRA_ALIASES)) LOOKUP.push([alias, i]);
const LOOKUP_BY_BOOK = [...LOOKUP].sort((a, b) => a[1] - b[1]);

function findBook(name) {
  if (/^\s*\d+\s*$/.test(name)) { const n = +name; return n >= 1 && n <= 66 ? n - 1 : null; }
  const key = normalizeBook(name);
  if (!key) return null;
  for (const [norm, i] of LOOKUP) if (norm === key) return i;
  for (const [norm, i] of LOOKUP_BY_BOOK) if (norm.startsWith(key)) return i;
  return null;
}
/** "joh 3:16-18" -> {b: 42, c: 3, v1: 16, v2: 18};  "ps 23" -> whole chapter (v2 null) */
function parsePassage(text) {
  const m = text.match(/^\s*([1-3]?\s*[^\d:]+?)\s*(\d+)?\s*(?:[:.,\s]\s*(\d+))?\s*(?:[-–]\s*(\d+))?\s*$/);
  if (!m) return null;
  const b = findBook(m[1]);
  if (b === null) return null;
  const c = +(m[2] || 1);
  if (m[3]) { const v1 = +m[3]; return { b, c, v1, v2: m[4] ? Math.max(v1, +m[4]) : v1 }; }
  return { b, c, v1: 1, v2: null };
}
const SERMON_RE = /^\s*(\d{2}-\d{4}[A-Za-z]?|CAB-\d+)\s*(?:[¶:,]?\s*(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/i;

// ---------------------------------------------------------------- state & storage
const MH_API = "https://search.messagehub.info/api/languages/";
let API = MH_API;  // when connected, sermons go through the laptop (works without internet too)
let BIBLES = [{ id: "SV", name: "Statenvertaling", lang: "nl" },
              { id: "KJV", name: "King James Version", lang: "en" },
              { id: "LSG", name: "Louis Segond 1910", lang: "fr" }];
/* Connected mode: when this page is opened from a laptop running Bible Present (on the same
   Wi-Fi), it becomes the presenting console for that laptop. */
const conn = { info: null, token: null, remote: null, events: null, ret: null, retList: null, handoff: null };
const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback) { try { const v = localStorage.getItem("bp." + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("bp." + key, JSON.stringify(value)); } catch { /* full or blocked */ } },
};

const state = {
  bibleId: store.get("bible", "SV"),
  bible: null,             // {books: [...]} of the selected Bible
  book: 42, chapter: 3,
  tab: "bible",
  sel: null,               // {kind: "bible", b, c, start, end} or {kind: "sermon", code, lang, start, end}
  sermonIndex: {},         // code -> {nl: [title, place, date], en: [...]}
  sermon: null,            // {code, lang, paras: [[num, text], ...]}
  sermonLang: "nl",
  hits: null,              // current search results
  lists: store.get("lists", null),
  current: store.get("current", null),
};
if (!state.lists || !state.lists.length) state.lists = [newList()];
if (!state.lists.find((l) => l.id === state.current)) state.current = state.lists[0].id;

function newList(name) {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name || "", items: [] };
}
const currentList = () => state.lists.find((l) => l.id === state.current);
function saveLists() { store.set("lists", state.lists); store.set("current", state.current); }

function toast(text) {
  const t = $("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}
/** A small × inside a text field that empties it (shown while there is text). Safari's own one
    only appears now and then. */
function addClearButton(input) {
  const wrap = el("span", "clearable");
  input.replaceWith(wrap);
  wrap.append(input);
  const btn = el("button", "clear-btn", "×");
  btn.type = "button";
  btn.tabIndex = -1;
  btn.setAttribute("aria-label", "Clear");
  wrap.append(btn);
  input.syncClear = () => wrap.classList.toggle("has-text", Boolean(input.value));
  input.addEventListener("input", input.syncClear);
  btn.addEventListener("pointerdown", (e) => e.preventDefault());  // keeps the keyboard as it is
  btn.onclick = () => {
    input.value = "";
    input.syncClear();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("search"));
    input.focus();
  };
  input.syncClear();
}
/** Set a field's text from code (keeps its × right). */
function setField(id, value) {
  const input = $(id);
  input.value = value;
  if (input.syncClear) input.syncClear();
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const bibleLang = () => (BIBLES.find((b) => b.id === state.bibleId) || BIBLES[0]).lang;
const bookName = (b, lang) => NAMES[lang || bibleLang()][b];
const range = (v1, v2) => (v2 && v2 !== v1 ? `${v1}-${v2}` : `${v1}`);

// ---------------------------------------------------------------- Bible
const bibleCache = {};
/* Bibles added from a file on this iPad (e.g. the HSV from the laptop): kept in this device's own
   storage only, never uploaded or published. ownBibles: [{id, name, lang}]. */
const OWN_BIBLES = "bp-own-bibles";  // the Cache Storage that holds them (kept across versions, see sw.js)
const ownBibles = () => store.get("ownBibles", []);
async function loadBible(id) {
  if (!bibleCache[id]) {
    $("verse-list").innerHTML = '<li class="info">Loading the Bible…</li>';
    await loadBibleData(id);
  }
  state.bibleId = id;
  state.bible = bibleCache[id];
  store.set("bible", id);
}
const chapterCount = (b) => (state.bible ? state.bible.books[b].length : 0);
const verseCount = (b, c) => (state.bible && state.bible.books[b][c - 1] ? state.bible.books[b][c - 1].length : 0);
const verseText = (b, c, v) => (state.bible && state.bible.books[b][c - 1] ? state.bible.books[b][c - 1][v - 1] || "" : "");

function renderBooks() {
  const ul = $("book-list"), sel = $("book-select");
  ul.innerHTML = ""; sel.innerHTML = "";
  for (let b = 0; b < 66; b++) {
    if (b === 0 || b === 39) {
      const lang = bibleLang();
      const t = { nl: ["OUDE TESTAMENT", "NIEUWE TESTAMENT"], fr: ["ANCIEN TESTAMENT", "NOUVEAU TESTAMENT"] }[lang]
        || ["OLD TESTAMENT", "NEW TESTAMENT"];
      ul.appendChild(el("li", "group", t[b === 0 ? 0 : 1]));
    }
    const li = el("li", b === state.book ? "active" : "", bookName(b));
    li.onclick = () => openChapter(b, 1);
    ul.appendChild(li);
    const o = el("option", "", bookName(b)); o.value = b; sel.appendChild(o);
  }
  sel.value = state.book;
}
function renderChapters() {
  const grid = $("chapter-grid"), sel = $("chapter-select");
  grid.innerHTML = ""; sel.innerHTML = "";
  for (let c = 1; c <= chapterCount(state.book); c++) {
    const btn = el("button", c === state.chapter ? "active" : "", c);
    btn.onclick = () => openChapter(state.book, c);
    grid.appendChild(btn);
    const o = el("option", "", `${bookName(state.book)} ${c}`); o.value = c; sel.appendChild(o);
  }
  sel.value = state.chapter;
}
function renderVerses() {
  const ol = $("verse-list");
  ol.innerHTML = "";
  $("verse-title").textContent = `${bookName(state.book).toUpperCase()} ${state.chapter}`;
  for (let v = 1; v <= verseCount(state.book, state.chapter); v++) {
    const li = el("li");
    li.dataset.n = v;
    li.append(el("span", "n", v), el("span", "t", verseText(state.book, state.chapter, v)));
    li.onclick = () => tapItem({ kind: "bible", b: state.book, c: state.chapter }, v);
    ol.appendChild(li);
  }
  paintSelection();
}
function openChapter(b, c, selectRange) {
  state.book = b;
  state.chapter = Math.max(1, Math.min(c, chapterCount(b) || 1));
  if (selectRange) state.sel = { kind: "bible", b, c: state.chapter, ...selectRange };
  else if (state.sel && state.sel.kind === "bible") state.sel = null;
  renderBooks(); renderChapters(); renderVerses();
  const ul = $("book-list").querySelector("li.active");
  if (ul) ul.scrollIntoView({ block: "nearest" });
  const g = $("chapter-grid").querySelector("button.active");
  if (g) g.scrollIntoView({ block: "nearest" });
  if (selectRange) scrollToItem("verse-list", selectRange.start);
  else $("verse-list").scrollTop = 0;
}
function scrollToItem(listId, n) {
  const li = $(listId).querySelector(`li[data-n="${n}"]`);
  if (li) li.scrollIntoView({ block: "center" });
}

// ---------------------------------------------------------------- selection (verses & paragraphs)
/** Tap once: that verse. Tap another: the range between them. Tap the single selected one: clear. */
function tapItem(ctx, n) {
  const s = state.sel;
  const same = s && s.kind === ctx.kind && (ctx.kind === "bible" ? s.b === ctx.b && s.c === ctx.c : s.code === ctx.code);
  if (!same || s.start !== s.end) state.sel = { ...ctx, start: n, end: n };
  else if (s.start === n) state.sel = null;
  else state.sel = { ...ctx, start: Math.min(s.start, n), end: Math.max(s.start, n) };
  paintSelection();
}
function paintSelection() {
  const s = state.sel;
  for (const [listId, kind] of [["verse-list", "bible"], ["para-list", "sermon"]]) {
    for (const li of $(listId).children) {
      const n = +li.dataset.n;
      const on = s && s.kind === kind && n >= s.start && n <= s.end &&
        (kind === "bible" ? s.b === state.book && s.c === state.chapter : state.sermon && s.code === state.sermon.code);
      li.classList.toggle("sel", !!on);
      li.classList.toggle("edge", !!on && (n === s.start || n === s.end));
    }
  }
  if (conn.info) paintLive();  // connected: also the coral frame on what is live
  const bar = $("addbar");
  if (!s) { bar.classList.add("hidden"); return; }
  bar.classList.remove("hidden");
  $("addbar-label").textContent = s.kind === "bible"
    ? `${bookName(s.b)} ${s.c}:${range(s.start, s.end)}`
    : `${s.code} ¶${range(s.start, s.end)}  ${sermonTitle(s.code, s.lang)}`;
}
function addSelection() {
  const s = state.sel;
  if (!s) return;
  if (s.kind === "bible") addItem({ kind: "bible", b: s.b, c: s.c, v1: s.start, v2: s.end });
  else addItem({ kind: "sermon", code: s.code, v1: s.start, v2: s.end, lang: s.lang });
  state.sel = null;
  paintSelection();
}
/** Connected: put the selected verse / paragraph on the screen right away. */
function presentSelection() {
  const s = state.sel;
  if (!s) return;
  const ref = s.kind === "bible" ? { kind: "bible", b: s.b, c: s.c, v1: s.start }
                                 : { kind: "sermon", code: s.code, v1: s.start };
  cmd("present", { ref });
  toast(`Live: ${$("addbar-label").textContent}`);
}

// ---------------------------------------------------------------- sermons
async function api(path) {
  const res = await fetch(API + path, conn.info ? { headers: { "X-BP-Token": conn.token || "" } } : undefined);
  if (!res.ok) throw new Error(`Message Hub: ${res.status}`);
  return res.json();
}
/** Message Hub's markup out of a paragraph: "@@" starts a Scripture line and "%#" / "%%" a song line
    (both become a new line), "^^word^^" marks the KJV's italics, and a stray "\" is a typo in the source. */
function cleanText(t) {
  return (t || "").replace(/[\u0002\u0003\u001f]/g, "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ")
    .replace(/\^\^/g, "").replace(/\\/g, "").replace(/\s*(@@|%[#%])\s*/g, "\n").replace(/ {2,}/g, " ").trim();
}
function sermonTitle(code, lang) {
  const info = state.sermonIndex[code] || {};
  return ((lang && info[lang]) || info.nl || info.en || [""])[0];
}
async function loadSermonIndex() {
  if (conn.info) {  // the laptop's own list
    try { state.sermonIndex = await (await fetch("data/sermons-index.json", { cache: "no-store" })).json(); } catch { }
    renderSermonList();
    return;
  }
  const cached = store.get("sermonIndex", null);
  if (cached) state.sermonIndex = cached.data;
  else {
    try { state.sermonIndex = await (await fetch("data/sermons-index.json")).json(); } catch { /* offline first start */ }
  }
  renderSermonList();
  renderList();  // the list shows sermon titles
  const week = 7 * 24 * 3600 * 1000;
  if (!cached || Date.now() - cached.t > week) refreshSermonIndex();
}
async function refreshSermonIndex() {
  try {
    const [nl, en] = await Promise.all([api("nl/sermons"), api("en/sermons")]);
    const index = {};
    for (const [lang, list] of [["nl", nl], ["en", en]]) {
      for (const s of list) (index[s.dateCode.toUpperCase()] ||= {})[lang] = [s.title, s.location, s.date];
    }
    state.sermonIndex = index;
    store.set("sermonIndex", { t: Date.now(), data: index });
    if (!state.hits) renderSermonList();
  } catch { /* offline or slow server: keep the copy we have */ }
}
// ---------------------------------------------------------------- sermon years, finding and marking words
/** 1947 for 47-0412; 9999 for codes without a year (CAB-01), which Message Hub also sorts last. */
const yearOf = (code) => (/^\d\d-/.test(code) ? 1900 + Number(code.slice(0, 2)) : 9999);
const wantedYear = () => Number($("year-select").value) || 0;  // 0 = all years

function fillYearSelect() {
  const sel = $("year-select");
  const years = [...new Set(Object.keys(state.sermonIndex).map(yearOf))].sort((a, b) => a - b);
  const want = ["", ...years.map(String)];
  if ([...sel.options].map((o) => o.value).join() === want.join()) return;
  const cur = sel.value;
  sel.innerHTML = "";
  for (const y of want) sel.add(new Option(y === "" ? "All years" : y === "9999" ? "Other" : y, y));
  sel.value = want.includes(cur) ? cur : "";
}

/** "Find in this sermon": all the words, or a paragraph number ("14", "¶14"; 140-149 … while typing). */
function paraMatches(n, text) {
  const q = fold($("para-find").value).trim();
  if (!q) return true;
  const hay = fold(text);
  const m = q.match(/^¶?\s*(\d+)$/);
  if (m) return String(n).startsWith(m[1]) || new RegExp(`\\b${m[1]}\\b`).test(hay);
  return q.split(/\s+/).every((w) => hay.includes(w));
}
/** The words to mark: from "Find in this sermon", otherwise from the text search the sermon was opened from. */
function markTerms() {
  const q = fold($("para-find").value).trim();
  const m = q.match(/^¶?\s*(\d+)$/);
  if (m) return [m[1]];
  const src = q || fold((state.sermon && state.sermon.searchText) || "");
  return src.replace(/["“”„]/g, " ").split(/\s+/).filter((w) => w.length > 1);
}
/** The text as HTML with the terms in <mark> (accents and case ignored). */
function markHtml(text, terms) {
  if (!terms.length) return esc(text);
  let folded = "";
  const at = [];  // index in text for each character of folded
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i]);
    for (let k = 0; k < f.length; k++) at.push(i);
    folded += f;
  }
  const ranges = [];
  for (const t of terms) {
    for (let i = folded.indexOf(t); i >= 0; i = folded.indexOf(t, i + t.length)) {
      ranges.push([at[i], at[i + t.length - 1] + 1]);
    }
  }
  if (!ranges.length) return esc(text);
  ranges.sort((a, b) => a[0] - b[0]);
  let out = "", pos = 0;
  for (const [s, e] of ranges) {
    if (e <= pos) continue;
    const from = Math.max(s, pos);
    out += esc(text.slice(pos, from)) + "<mark>" + esc(text.slice(from, e)) + "</mark>";
    pos = e;
  }
  return out + esc(text.slice(pos));
}
/** The same sermon in the other language (same paragraph numbers): Find in this sermon looks there too. */
const otherLang = (lang) => (lang === "nl" ? "en" : "nl");
function otherParas() {
  const s = state.sermon, paras = s && paraCache[`${otherLang(s.lang)}/${s.code}`];
  return paras ? new Map(paras) : null;
}
async function loadOtherLang(code, lang) {
  const other = otherLang(lang), key = `${other}/${code}`;
  if (paraCache[key] || !(state.sermonIndex[code] || {})[other]) return;
  try {
    const data = await api(`${other}/sermons/${code}/blocks`);
    paraCache[key] = (data.blocks || []).map((b) => [b.blockNumber, cleanText(b.blockText)]);
  } catch { return; }
  if (state.sermon && state.sermon.code === code && $("para-find").value.trim()) applyParaFind();
}
function applyParaFind() {
  if (!state.sermon) return;
  const terms = markTerms(), other = otherParas();
  const otherTag = otherLang(state.sermon.lang).toUpperCase();
  let shown = 0, total = 0;
  for (const li of $("para-list").children) {
    if (!li.dataset.n) continue;
    const text = li.dataset.text, n = Number(li.dataset.n);
    let ok = paraMatches(n, text);
    const there = !ok && other && other.has(n) && paraMatches(n, other.get(n));  // found in the other language
    ok = ok || there;
    li.classList.toggle("hidden", !ok);
    li.querySelector(".t").innerHTML = markHtml(text, terms) + (there ? ` <span class="found-in">found in ${otherTag}</span>` : "");
    total++;
    shown += ok;
  }
  $("para-count").textContent = $("para-find").value.trim() && total ? `${shown} of ${total}` : "";
}
/** Enter in "Find in this sermon": select the first match. */
function firstParaMatch() {
  const li = [...$("para-list").children].find((x) => x.dataset.n && !x.classList.contains("hidden"));
  if (!li || !state.sermon) return;
  const n = Number(li.dataset.n);
  state.sel = { kind: "sermon", code: state.sermon.code, lang: state.sermon.lang, start: n, end: n };
  paintSelection();
  li.scrollIntoView({ block: "center" });
}

function renderSermonList() {
  state.hits = null;
  fillYearSelect();
  const ul = $("sermon-list");
  const words = fold($("sermon-find").value).split(/\s+/).filter(Boolean);
  const year = wantedYear();
  const codes = Object.keys(state.sermonIndex).sort((a, b) => (a.startsWith("CAB") - b.startsWith("CAB")) || a.localeCompare(b));
  ul.innerHTML = "";
  let shown = 0;
  for (const code of codes) {
    const info = state.sermonIndex[code];
    if (year && yearOf(code) !== year) continue;
    if (words.length) {
      const hay = fold([code, ...Object.values(info).flat()].join(" "));
      if (!words.every((w) => hay.includes(w))) continue;
    }
    if (++shown > 400) continue;  // keep the list light; filtering narrows it down
    const [title, place, date] = info.nl || info.en;
    const li = el("li", state.sermon && state.sermon.code === code ? "active" : "");
    const l1 = el("div", "line1"); l1.append(el("span", "code", code), el("span", "name", title));
    const meta = el("div", "meta"); meta.append(el("span", "place", [place, date].filter(Boolean).join(" · ")));
    for (const lang of ["nl", "en"]) if (info[lang]) meta.append(el("span", "tag", lang.toUpperCase()));
    li.append(l1, meta);
    li.onclick = () => openSermon(code);
    ul.appendChild(li);
  }
  $("sermon-list-title").textContent = `SERMONS · ${shown}` + (shown > 400 ? " (type to narrow down)" : "");
  if (!codes.length) ul.innerHTML = '<li class="info">The sermon list is loading…</li>';
}
const paraCache = {};
async function openSermon(code, num, lang, searchText = null) {
  code = code.toUpperCase();
  const info = state.sermonIndex[code] || {};
  lang = lang || (info[state.sermonLang] ? state.sermonLang : info.nl ? "nl" : "en");
  for (const li of $("sermon-list").querySelectorAll("li.active")) li.classList.remove("active");
  $("para-title").textContent = `${code} · ${sermonTitle(code, lang) || ""}`.toUpperCase();
  renderParaLangs(code, lang);
  const ol = $("para-list");
  ol.innerHTML = '<li class="info">Loading…</li>';
  const key = `${lang}/${code}`;
  try {
    if (!paraCache[key]) {
      const data = await api(`${lang}/sermons/${code}/blocks`);
      paraCache[key] = (data.blocks || []).map((b) => [b.blockNumber, cleanText(b.blockText)]);
    }
  } catch (e) {
    ol.innerHTML = `<li class="info">Could not load this sermon (${navigator.onLine ? e.message : "no internet"}).</li>`;
    return;
  }
  state.sermon = { code, lang, paras: paraCache[key], searchText };
  if (state.sel && state.sel.kind === "sermon" && (state.sel.code !== code || state.sel.lang !== lang)) state.sel = null;
  if (num) state.sel = { kind: "sermon", code, lang, start: num, end: num };
  ol.innerHTML = "";
  for (const [n, text] of state.sermon.paras) {
    const li = el("li");
    li.dataset.n = n;
    li.dataset.text = text;
    li.append(el("span", "n", n), el("span", "t", text));
    li.onclick = () => tapItem({ kind: "sermon", code, lang }, n);
    ol.appendChild(li);
  }
  applyParaFind();
  loadOtherLang(code, lang);
  // a paragraph asked for by number must be visible
  if (num && ol.querySelector(`li[data-n="${num}"].hidden`)) { setField("para-find", ""); applyParaFind(); }
  paintSelection();
  if (num) {
    scrollToItem("para-list", num);
    const li = ol.querySelector(`li[data-n="${num}"]`);
    if (li) { li.classList.add("flash"); setTimeout(() => li.classList.remove("flash"), 1600); }
  } else ol.scrollTop = 0;
}
function renderParaLangs(code, lang) {
  const box = $("para-lang");
  box.innerHTML = "";
  const info = state.sermonIndex[code] || {};
  for (const l of ["nl", "en"]) {
    if (!info[l]) continue;
    const b = el("button", l === lang ? "active" : "", l.toUpperCase());
    b.onclick = () => {
      state.sermonLang = l;
      openSermon(code, state.sel && state.sel.code === code ? state.sel.start : null, l, state.sermon && state.sermon.searchText);
    };
    box.appendChild(b);
  }
}

// full-text search on the Message Hub server (all sermons, no download needed)
const SEARCH_LANGS = ["nl", "en"];
const hitYear = (hit) => yearOf((hit.dateCode || "").toUpperCase());

/** Message Hub cannot filter on a year, but it sorts the hits by date. Find the first page that
    reaches the year by looking at several pages at once: about 4 rounds instead of 10 one by one. */
async function seekYear(fetchPage, year, first, pages) {
  const lastYear = (r) => { const qs = r.quotes || []; return qs.length ? hitYear(qs[qs.length - 1]) : 9999; };
  const seen = new Map([[1, first]]);
  let lo = 1, hi = pages;  // the answer is in [lo, hi]
  while (lo < hi) {
    const n = Math.min(6, hi - lo), probes = [];
    for (let k = 0; k < n; k++) probes.push(lo + Math.floor(((hi - lo) * k) / n));
    const res = await Promise.all(probes.map((p) => seen.get(p) || fetchPage(p)));
    probes.forEach((p, i) => seen.set(p, res[i]));
    for (let i = 0; i < probes.length; i++) {
      if (lastYear(res[i]) < year) lo = probes[i] + 1;
      else { hi = probes[i]; break; }
    }
  }
  return { page: lo, pages, cached: seen.get(lo) };
}

// full-text search on the Message Hub server (all sermons, no download needed)
async function searchSermons(text, more = false) {
  const year = wantedYear();
  const q = (lang, match, page) => api(`${lang}/sermons/search?` + new URLSearchParams({
    searchText: text, fullText: "false", languageCode: lang, filter: 0, match, pageNumber: page, sermonId: 0 }));
  const ul = $("sermon-list");
  if (!more) {
    ul.innerHTML = `<li class="info">Searching${year ? ` in ${year === 9999 ? "the other items" : year}` : ""}…</li>`;
    state.hits = { text, year, items: [], total: 0, next: {} };
  }
  const h = state.hits;
  try {
    if (!more) {
      let match = 1;  // exact phrase first …
      let first = await Promise.all(SEARCH_LANGS.map((l) => q(l, match, 1)));
      if (first.every((r) => !r.pageInfo || !r.pageInfo.totalHits)) {
        match = 0;    // … otherwise all the words
        first = await Promise.all(SEARCH_LANGS.map((l) => q(l, match, 1)));
      }
      h.match = match;
      h.total = first.reduce((n, r) => n + ((r.pageInfo && r.pageInfo.totalHits) || 0), 0);
      await Promise.all(SEARCH_LANGS.map(async (l, i) => {
        const pages = (first[i].pageInfo && first[i].pageInfo.pageCount) || 0;
        h.next[l] = !pages ? null : year ? await seekYear((p) => q(l, match, p), year, first[i], pages)
                                         : { page: 1, pages, cached: first[i] };
      }));
    }
    // one page per language
    const got = await Promise.all(SEARCH_LANGS.map(async (l) => {
      const n = h.next[l];
      if (!n) return [];
      const r = n.cached || await q(l, h.match, n.page);
      const quotes = r.quotes || [];
      const past = year && quotes.length && hitYear(quotes[quotes.length - 1]) > year;
      h.next[l] = n.page < n.pages && !past ? { page: n.page + 1, pages: n.pages } : null;
      return year ? quotes.filter((x) => hitYear(x) === year) : quotes;
    }));
    for (const g of got) h.items.push(...g);
    h.more = SEARCH_LANGS.some((l) => h.next[l]);
  } catch (e) {
    ul.innerHTML = `<li class="info">${navigator.onLine ? "Search failed: " + e.message : "Searching needs internet."}</li>`;
    return;
  }
  // with a year, a page can hold few hits of that year: read on until there is something to show
  if (h.year && h.more && h.items.length < 20) return searchSermons(text, true);
  renderHits();
}
function renderHits() {
  const h = state.hits, ul = $("sermon-list");
  ul.innerHTML = "";
  const count = h.year ? `${h.items.length}${h.more ? "+" : ""}` : `${h.total}`;
  const n = h.year ? h.items.length : h.total;
  $("sermon-list-title").textContent = `FOUND · ${count} paragraph${n === 1 ? "" : "s"}` +
    (h.year ? ` in ${h.year === 9999 ? "other" : h.year}` : "") + (h.match === 0 && n ? " (all words)" : "");
  for (const q of h.items) {
    const li = el("li");
    const code = q.dateCode.toUpperCase();
    const l1 = el("div", "line1");
    l1.append(el("span", "code", `${code} ¶${q.blockNumber}`), el("span", "name", q.title), el("span", "tag", q.languageCode.toUpperCase()));
    const snip = el("div", "snippet");
    const safe = (q.blockText || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    snip.innerHTML = safe.replace(/\u0002/g, "<mark>").replace(/\u0003/g, "</mark>").replace(/[\u001f\r\n]+/g, " ")
      .replace(/@@|%[#%]/g, " ").replace(/\^\^|\\/g, "");
    li.append(l1, snip);
    li.onclick = () => {
      for (const x of ul.querySelectorAll("li.active")) x.classList.remove("active");
      li.classList.add("active");
      openSermon(code, q.blockNumber, q.languageCode, h.text);
    };
    ul.appendChild(li);
  }
  if (!h.items.length) ul.innerHTML = '<li class="info">Nothing found.</li>';
  if (h.more) {
    const more = el("li", "more", "More results…");
    more.onclick = () => { more.textContent = "Loading…"; searchSermons(h.text, true); };
    ul.appendChild(more);
  }
}

// ---------------------------------------------------------------- the list
/* A list holds passages ({kind: "bible" | "sermon", …, note?}) and free notes ({kind: "note", text})
   that sit between them. Notes stay on the iPad: the laptop only ever gets the passages. */
const isNote = (it) => it.kind === "note";
const passages = (items) => items.filter((it) => !isNote(it));
const withNote = (it, note) => (note ? { ...it, note } : it);

function itemLabel(it) {
  if (it.kind === "sermon") return `${it.code} ¶${range(it.v1, it.v2)}  ${sermonTitle(it.code, it.lang)}`;
  return `${bookName(it.b)} ${it.c}:${range(it.v1, it.v2)}`;
}
function itemSnippet(it) {
  if (it.kind === "sermon") return it.snippet || "";
  return verseText(it.b, it.c, it.v1);
}
function addItem(it) {
  if (conn.info) {  // connected: straight into the laptop's service list
    cmd("list", { mode: "append", service: [toService(it)] });
    toast(`Added to the laptop: ${itemLabel(it)}`);
    return;
  }
  if (it.kind === "sermon") {
    const p = state.sermon && state.sermon.code === it.code ? state.sermon.paras.find(([n]) => n === it.v1) : null;
    it.snippet = p ? p[1].slice(0, 160) : "";
    if (!p) fillSnippet(it);
  }
  currentList().items.push(it);
  saveLists(); renderList();
  toast(`Added ${itemLabel(it)}`);
}
/** Sermon added by typing its code: fetch the first paragraph's text for the preview line. */
async function fillSnippet(it) {
  const info = state.sermonIndex[it.code] || {};
  const lang = it.lang || (info.nl ? "nl" : "en");
  try {
    const key = `${lang}/${it.code}`;
    if (!paraCache[key]) {
      const data = await api(`${lang}/sermons/${it.code}/blocks`);
      paraCache[key] = (data.blocks || []).map((b) => [b.blockNumber, cleanText(b.blockText)]);
    }
    const p = paraCache[key].find(([n]) => n === it.v1);
    if (p) { it.snippet = p[1].slice(0, 160); it.lang = lang; saveLists(); renderList(); }
  } catch { /* offline: no preview text */ }
}
fillSnippet.tried = new WeakSet();
function renderLists() {
  const sel = $("list-select");
  sel.innerHTML = "";
  state.lists.forEach((l, i) => {
    const o = el("option", "", `${l.name || "List " + (i + 1)}  (${passages(l.items).length})`);
    o.value = l.id;
    sel.appendChild(o);
  });
  sel.value = state.current;
  $("list-name").value = currentList().name;
}
function renderList() {
  if (conn.info) return renderRemote();
  const list = currentList(), ul = $("list-items");
  ul.innerHTML = "";
  let num = 0;
  list.items.forEach((it, i) => {
    if (it.kind === "sermon" && !it.snippet && !fillSnippet.tried.has(it)) {
      fillSnippet.tried.add(it);  // one try per item and session (e.g. offline)
      fillSnippet(it);
    }
    const li = el("li", isNote(it) ? "note" : "");
    li.classList.toggle("editing", !!noteSession && noteSession.target === it);
    const grip = el("span", "grip", "⠿");
    grip.title = "Drag to change the order";
    grip.addEventListener("pointerdown", (e) => startDrag(e, li, grip, (from, to) => {
      list.items.splice(to, 0, list.items.splice(from, 1)[0]);
      saveLists();
      if (noteSession && noteSession.all) setTimeout(openAllNotes, 200);  // the document follows the list
    }));
    const body = el("div", "body");
    const buttons = [];
    if (isNote(it)) {
      body.append(el("div", "note-text", noteText(it.text) || "Empty note"));
      body.onclick = () => editListNote(it);
    } else {
      body.append(el("div", "label", itemLabel(it)), el("div", "snip", itemSnippet(it)));
      if (it.note) body.append(noteLine(it.note, () => editListNote(it)));
      body.onclick = () => showItem(it);
      const edit = el("button", "del note-btn", "✎");
      edit.title = "Note on this passage";
      edit.onclick = () => editListNote(it);
      buttons.push(edit);
    }
    const del = el("button", "del", "✕");
    del.title = "Remove";
    del.onclick = () => {
      if (noteSession && noteSession.target === it) { noteSession = null; $("note-pane").classList.add("hidden"); }
      if (noteText(isNote(it) ? it.text : it.note)) trashPut({ type: "item", listId: list.id, listName: list.name, item: it, index: i });
      list.items.splice(i, 1); saveLists(); renderList();
      if (noteSession && noteSession.all) openAllNotes();  // the document follows the list
    };
    li.append(grip, el("span", "num", isNote(it) ? "" : ++num), body, ...buttons, del);
    ul.appendChild(li);
  });
  $("list-empty").classList.toggle("hidden", list.items.length > 0);
  $("mode-count").textContent = num || "";
  renderLists();
}
/** The note on a passage, shown under it; tapping it opens the note. */
function noteLine(html, onEdit) {
  const line = el("div", "att-note", noteText(html));
  line.onclick = (e) => { e.stopPropagation(); onEdit(); };
  return line;
}

// ---------------------------------------------------------------- notes: formatted text, like Apple Notes
/* A note is HTML with a few kinds of formatting (titles, bold…, lists, checklists). Notes written
   before formatting existed are plain text. */
const NOTE_TAGS = new Set(["DIV", "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "MARK", "UL", "OL", "LI", "H1", "H2", "H3"]);
/* The marker, in colours as in Apple Notes: in the editor a coloured background (so Safari can switch
   it off again), saved as <mark> (yellow) or <mark class="m-green"> etc. */
const MARKERS = { yellow: [255, 204, 0, 0.45], green: [52, 199, 89, 0.38], blue: [10, 132, 255, 0.32],
                  pink: [255, 45, 145, 0.3], orange: [255, 149, 0, 0.42] };
const markerCss = (name, alpha) => { const [r, g, b, a] = MARKERS[name]; return `rgba(${r}, ${g}, ${b}, ${alpha ?? a})`; };
function markerName(color) {
  const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(color || "");
  if (!m) return null;
  const hit = Object.entries(MARKERS).find(([, [r, g, b]]) => +m[1] === r && +m[2] === g && +m[3] === b);
  return hit ? hit[0] : null;
}
/* Text colours and fonts, the same way: inline styles in the editor, saved as classes (c-red, f-serif). */
const TEXT_COLORS = { red: [255, 59, 48], orange: [255, 149, 0], green: [52, 199, 89], blue: [10, 132, 255],
                      purple: [175, 82, 222], gray: [142, 142, 147] };
const FONTS = { serif: 'ui-serif, Georgia, "Times New Roman", serif',
                rounded: 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif',
                mono: 'ui-monospace, Menlo, Consolas, "Courier New", monospace',
                hand: 'Noteworthy, "Bradley Hand", "Segoe Print", cursive' };
const FONT_LABELS = { "": "Standard", serif: "Serif", rounded: "Rounded", mono: "Typewriter", hand: "Handwriting" };
const colorCss = (name) => `rgb(${TEXT_COLORS[name].join(", ")})`;
function colorName(color) {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color || "");
  const m = hex ? [0, ...hex.slice(1).map((h) => parseInt(h, 16))] : /(\d+),\s*(\d+),\s*(\d+)/.exec(color || "");
  const hit = m && Object.entries(TEXT_COLORS).find(([, [r, g, b]]) => +m[1] === r && +m[2] === g && +m[3] === b);
  return hit ? hit[0] : null;
}
const firstFamily = (f) => String(f || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
function fontKey(family) {
  const first = firstFamily(family);
  return (first && Object.keys(FONTS).find((k) => firstFamily(FONTS[k]) === first)) || null;
}
const classOf = (c, prefix, known) => {
  const x = [...c.classList].find((k) => k.startsWith(prefix) && known[k.slice(prefix.length)]);
  return x ? x.slice(prefix.length) : null;
};
/** The marker, text colour and font of an element: from its style (the editor) or its classes (saved). */
function inlineStyle(c) {
  let marker = markerName(c.style.backgroundColor) || classOf(c, "m-", MARKERS);
  if (!marker && c.tagName === "MARK") marker = "yellow";
  return { marker, color: colorName(c.style.color || c.getAttribute("color")) || classOf(c, "c-", TEXT_COLORS),
           font: fontKey(c.style.fontFamily || c.getAttribute("face")) || classOf(c, "f-", FONTS) };
}
/** A saved note made ready for the editor: <mark> and the coloured spans become inline styles again. */
function editableNote(html) {
  const t = document.createElement("template");
  t.innerHTML = cleanNote(noteHtml(html));
  for (const m of t.content.querySelectorAll("mark, span")) {
    const s = document.createElement("span"), st = inlineStyle(m);
    if (st.marker) s.style.backgroundColor = markerCss(st.marker);
    if (st.color) s.style.color = colorCss(st.color);
    if (st.font) s.style.fontFamily = FONTS[st.font];
    s.append(...m.childNodes);
    m.replaceWith(s);
  }
  return t.innerHTML;
}
const noteHtml = (s) => (!s ? "" : /^\s*</.test(s) ? s
  : s.split("\n").map((l) => `<div>${l ? esc(l) : "<br>"}</div>`).join(""));
/** Only the formatting a note can have: no scripts, links, pictures or styles (e.g. from pasting). */
function cleanNote(html) {
  const t = document.createElement("template");
  t.innerHTML = html;
  const walk = (n) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 3) continue;
      if (c.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|SVG|MATH)$/i.test(c.tagName)) { c.remove(); continue; }
      walk(c);
      if (/^(SPAN|FONT|MARK)$/.test(c.tagName)) {  // marker, colour, font: <mark class="m-green c-red f-serif">
        const st = inlineStyle(c);
        if (!st.marker && !st.color && !st.font) { c.replaceWith(...c.childNodes); continue; }
        const m = document.createElement(st.marker ? "mark" : "span");
        const cls = [st.marker && st.marker !== "yellow" && `m-${st.marker}`, st.color && `c-${st.color}`, st.font && `f-${st.font}`];
        if (cls.some(Boolean)) m.className = cls.filter(Boolean).join(" ");
        m.append(...c.childNodes);
        c.replaceWith(m);
        continue;
      }
      if (!NOTE_TAGS.has(c.tagName)) { c.replaceWith(...c.childNodes); continue; }
      for (const a of [...c.attributes]) {
        if (a.name !== "class") c.removeAttribute(a.name);
      }
      if (c.hasAttribute("class")) {
        const keep = [...c.classList].filter((x) => x === "checklist" || x === "checked");
        if (keep.length) c.className = keep.join(" "); else c.removeAttribute("class");
      }
    }
  };
  walk(t.content);
  return t.innerHTML;
}
/** The note as plain text (list previews, sharing): bullets, numbers and ☐/☑ in front of list items. */
function noteText(s) {
  const t = document.createElement("template");
  t.innerHTML = cleanNote(noteHtml(s));
  const out = [];
  let cur = "";
  const flush = () => { out.push(cur); cur = ""; };
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) { cur += c.textContent; continue; }
      if (c.tagName === "BR") { flush(); continue; }
      if (c.tagName === "LI") {
        if (cur) flush();
        const list = c.parentElement;
        cur = list.classList.contains("checklist") ? (c.classList.contains("checked") ? "☑ " : "☐ ")
          : list.tagName === "OL" ? `${[...list.children].indexOf(c) + 1}. ` : "• ";
        walk(c);
        flush();
        continue;
      }
      const block = /^(DIV|P|H1|H2|H3|UL|OL)$/.test(c.tagName);
      if (block && cur) flush();
      walk(c);
      if (block && cur) flush();
    }
  };
  walk(t.content);
  if (cur) flush();
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* What is open on the left: one note, or all notes of the list as one document (noteSession.all).
   A note: {target, title, html, passage, heading, sub, save, remove, trash}; every editor element
   on the left carries its own note as ._note. */
let noteSession = null;
let noteRender = 0;
let lastEditor = null;
function makeEditor(n) {
  const ed = el("div", "note-editor note-doc");
  ed.contentEditable = "true";
  ed.spellcheck = true;
  ed.innerHTML = editableNote(n.html) || "<div><br></div>";
  ed._note = n;
  markEmpty(ed);
  return ed;
}
const markEmpty = (ed) => ed.classList.toggle("empty", !noteText(ed.innerHTML));
function openNoteEditor(s) {
  const back = noteSession ? noteSession.backMode : $("layout").dataset.mode;
  closeNoteEditor(true);
  noteSession = s;
  s.backMode = back;
  $("note-title").textContent = s.title;
  $("note-delete").classList.toggle("hidden", !!s.all);
  for (const id of ["note-word", "note-pdf"]) $(id).classList.toggle("hidden", !s.all);
  if (s.all && s.exportList) prepareExport(s.exportList());  // the Bible texts etc. ready for Word / PDF
  const body = $("note-body");
  body.innerHTML = "";
  body.classList.toggle("all", !!s.all);
  if (s.all) {
    for (const n of s.sessions) {
      const ed = n.save ? makeEditor(n) : null;
      if (n.heading) {
        const h = el("div", "all-ref");
        h.append(el("span", "ref", n.heading), el("span", "sub", n.sub || ""));
        if (ed) h.onclick = () => placeCaretAtEnd(ed);
        body.append(h);
      }
      if (ed && !n.heading) ed.classList.add("free");  // a note of its own, not under a passage
      if (ed) body.append(ed);
    }
  } else body.append(makeEditor(s));
  showNotePassage(s.all ? {} : s);
  $("note-pane").classList.remove("hidden");
  setMode("browse");  // phones: the editor is on the left side
  body.scrollTop = 0;
  if (s.focus) placeCaretAtEnd(body.querySelector(".note-editor"));
  renderList();       // marks the note that is open
}
/** Done (or another note opened): empty notes are removed. */
function closeNoteEditor(switching) {
  const s = noteSession;
  if (!s) return;
  noteSession = null;
  for (const ed of $("note-body").querySelectorAll(".note-editor")) if (!noteText(ed.innerHTML)) ed._note.remove();
  $("note-pane").classList.add("hidden");
  if (document.activeElement) document.activeElement.blur();
  $("note-body").innerHTML = "";
  lastEditor = null;
  if (!switching) { setMode(s.backMode || "browse"); renderList(); }
}
function deleteOpenNote() {
  const s = noteSession, ed = $("note-body").querySelector(".note-editor");
  if (!s || s.all || !ed) return;
  const html = cleanNote(ed.innerHTML);
  if (noteText(html)) {
    if (!confirm("Delete this note? You can get it back from ⋯ → Recently deleted.")) return;
    if (s.trash) s.trash(html);
  }
  s.remove();
  ed.innerHTML = "";
  closeNoteEditor();
}
function noteChanged(ed) {
  if (!noteSession || !ed || !ed._note) return;
  ed._note.save(cleanNote(ed.innerHTML));
  markEmpty(ed);
  clearTimeout(noteRender);
  noteRender = setTimeout(renderList, 400);  // the preview in the list
}
/** A note on a passage: the passage's text stays visible above the note. */
function showNotePassage(s) {
  const box = $("note-passage"), it = s.passage;
  box.classList.toggle("hidden", !it);
  if (!it) return;
  $("note-passage-ref").textContent = it.kind === "sermon" ? "QUOTE" : "BIBLE TEXT";
  const text = $("note-passage-text");
  const fill = () => {
    text.innerHTML = "";
    const paras = passageParas(it);
    if (paras) for (const [n, t] of paras) { const p = el("p"); p.append(el("span", "n", n), " " + t); text.append(p); }
    else text.append(el("p", "", it.snippet || "Loading…"));
  };
  fill();
  if (!passageParas(it)) loadSermonParas(it).then(() => { if (noteSession === s) fill(); });
}
function placeCaretAtEnd(ed) {
  if (!ed) return;
  ed.focus();
  const r = document.createRange();
  r.selectNodeContents(ed);
  r.collapse(false);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

// the toolbar
/** Where the cursor is: its editor, block (paragraph, heading, list item) and list. */
function editorBlock() {
  const sel = getSelection();
  let n = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
  const found = {};
  while (n && !(n.nodeType === 1 && n.classList.contains("note-editor"))) {
    if (n.nodeType === 1) {
      if (!found.block && /^(DIV|P|H1|H2|H3|LI)$/.test(n.tagName)) found.block = n;
      if (!found.list && /^(UL|OL)$/.test(n.tagName)) found.list = n;
    }
    n = n.parentNode;
  }
  return n ? { ...found, ed: n } : {};
}
const listKind = (list) => (list.tagName === "OL" ? "ol" : list.classList.contains("checklist") ? "check" : "ul");
function applyList(kind) {
  const { list, ed } = editorBlock();
  if (!ed) return;
  const was = new Map([...ed.querySelectorAll("li")].map((li) => [li, listKind(li.parentElement)]));
  if (kind === "check") {
    if (list && list.classList.contains("checklist")) { document.execCommand("insertUnorderedList"); return; }  // off
    if (!list || list.tagName === "OL") document.execCommand("insertUnorderedList");
    const now = editorBlock().list;
    if (now) now.classList.add("checklist");
  } else if (kind === "ul" && list && list.classList.contains("checklist")) list.classList.remove("checklist");
  else document.execCommand(kind === "ol" ? "insertOrderedList" : "insertUnorderedList");
  // A new list right below or above another one gets joined to it: keep bullets and checklists apart
  if (!list) for (const l of [...ed.querySelectorAll("ul")]) splitByKind(l, was, kind);
}
function splitByKind(list, was, fresh) {
  const items = [...list.children];
  const kinds = items.map((li) => was.get(li) || fresh);
  if (new Set(kinds).size < 2) { if (kinds.length) list.classList.toggle("checklist", kinds[0] === "check"); return; }
  const sel = getSelection(), r = sel.rangeCount ? sel.getRangeAt(0) : null;
  const caret = r && [r.startContainer, r.startOffset];
  let anchor = list, cur = null, curKind = null;
  items.forEach((li, i) => {
    if (kinds[i] !== curKind) {
      cur = document.createElement("ul");
      if (kinds[i] === "check") cur.className = "checklist";
      anchor.after(cur);
      anchor = cur;
      curKind = kinds[i];
    }
    cur.append(li);
  });
  list.remove();
  if (caret) { const nr = document.createRange(); nr.setStart(...caret); nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr); }
}
function applyBlock(tag) {
  const { block, list } = editorBlock();
  if (list) applyList(list.tagName === "OL" ? "ol" : list.classList.contains("checklist") ? "check" : "ul");  // out of the list first
  const same = block && block.tagName === tag.toUpperCase();
  document.execCommand("formatBlock", false, `<${same ? "div" : tag}>`);
}
function updateToolbar() {
  if (!noteSession) return;
  const { block, list } = editorBlock();
  const tag = block ? block.tagName : "";
  const marker = currentMarker(), color = currentColor(), font = currentFont();
  for (const b of $("note-tools").querySelectorAll("button")) {
    let on = false;
    if (b.dataset.cmd === "hilite") on = !!marker;
    else if (b.dataset.cmd === "textstyle") on = !!(color || font);
    else if (b.dataset.marker) on = b.dataset.marker === (marker || "none");
    else if (b.dataset.color !== undefined) on = b.dataset.color === (color || "");
    else if (b.dataset.font !== undefined) on = b.dataset.font === (font || "");
    else if (b.dataset.cmd) { try { on = document.queryCommandState(b.dataset.cmd); } catch { } }
    else if (b.dataset.block === "div") on = !list && /^(DIV|P|)$/.test(tag);
    else if (b.dataset.block) on = tag === b.dataset.block.toUpperCase();
    else if (b.dataset.list) {
      on = !!list && (b.dataset.list === "check" ? list.classList.contains("checklist")
        : b.dataset.list === "ol" ? list.tagName === "OL" : list.tagName === "UL" && !list.classList.contains("checklist"));
    }
    b.classList.toggle("active", on);
  }
}
/** "- " or "* " starts a bullet list, "1. " a numbered list and "[] " a checklist, as in Notes. */
function autoList(e) {
  if (e.inputType !== "insertText" || e.data !== " ") return;
  const sel = getSelection(), node = sel.anchorNode, { ed } = editorBlock();
  if (!ed || !node || node.nodeType !== 3 || node.previousSibling) return;
  const m = node.data.replace(/ /g, " ").match(/^(?:([-*•])|(1[.)])|(\[\]))\s$/);
  const parent = node.parentNode;
  if (!m || parent === ed || !ed.contains(parent) || !/^(DIV|P)$/.test(parent.tagName) || parent.closest("ul, ol")) return;
  if (node.nextSibling && !(node.nextSibling.tagName === "BR" && !node.nextSibling.nextSibling)) return;
  // through the editing commands, so that Undo takes it back step by step
  const r = document.createRange();
  r.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(r);
  document.execCommand("delete");
  applyList(m[1] ? "ul" : m[2] ? "ol" : "check");
}
/** The marker colour under the cursor (or null). */
function currentMarker() {
  try { return markerName(document.queryCommandValue("hiliteColor")) || markerName(document.queryCommandValue("backColor")); }
  catch { return null; }
}
function applyMarker(name) {
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("hiliteColor", false, name === "none" ? "transparent" : markerCss(name));
  document.execCommand("styleWithCSS", false, false);
  if (name !== "none") { store.set("marker", name); paintMarkerButton(); }
}
function currentColor() {
  try { return colorName(document.queryCommandValue("foreColor")); } catch { return null; }
}
function currentFont() {
  try { return fontKey(document.queryCommandValue("fontName")); } catch { return null; }
}
/** Text colour or font of the selection; "" goes back to the normal one (the editor's own). */
function applyTextStyle(kind, name, ed) {
  const own = getComputedStyle(ed);
  document.execCommand("styleWithCSS", false, true);
  if (kind === "color") document.execCommand("foreColor", false, name ? colorCss(name) : own.color);
  else document.execCommand("fontName", false, name ? FONTS[name] : own.fontFamily);
  document.execCommand("styleWithCSS", false, false);
}
function paintMarkerButton() {
  document.querySelector(".marker-icon").style.background = markerCss(store.get("marker", "yellow"), 0.8);
}
function initNoteEditor() {
  const body = $("note-body");
  try { document.execCommand("defaultParagraphSeparator", false, "div"); document.execCommand("styleWithCSS", false, false); } catch { }
  body.addEventListener("input", (e) => { autoList(e); noteChanged(e.target.closest(".note-editor")); updateToolbar(); });
  body.addEventListener("focusin", (e) => { if (e.target.classList.contains("note-editor")) lastEditor = e.target; });
  body.addEventListener("paste", (e) => {  // pasted text comes in as text (no fonts or colours from elsewhere)
    e.preventDefault();
    document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
  });
  body.addEventListener("click", (e) => {  // tap the circle of a checklist item: done / not done
    const li = e.target.closest && e.target.closest("ul.checklist > li");
    if (li && e.clientX - li.getBoundingClientRect().left < 30) { li.classList.toggle("checked"); noteChanged(li.closest(".note-editor")); }
  });
  document.addEventListener("selectionchange", updateToolbar);
  paintMarkerButton();
  for (const b of $("note-tools").querySelectorAll("button")) {
    b.addEventListener("pointerdown", (e) => e.preventDefault());  // keep the cursor (and keyboard) in the note
    b.onclick = () => {
      const panel = { hilite: "marker-colors", textstyle: "text-styles" }[b.dataset.cmd];
      if (panel) {  // the colours (and fonts) to choose from
        for (const id of ["marker-colors", "text-styles"]) $(id).classList.toggle("hidden", id !== panel || !$(id).classList.contains("hidden"));
        return;
      }
      let { ed } = editorBlock();
      if (!ed) { ed = (lastEditor && body.contains(lastEditor)) ? lastEditor : body.querySelector(".note-editor"); placeCaretAtEnd(ed); }
      if (b.dataset.marker) { applyMarker(b.dataset.marker); $("marker-colors").classList.add("hidden"); }
      else if (b.dataset.color !== undefined) applyTextStyle("color", b.dataset.color, ed);
      else if (b.dataset.font !== undefined) applyTextStyle("font", b.dataset.font, ed);
      else if (b.dataset.cmd) document.execCommand(b.dataset.cmd);
      else if (b.dataset.block) applyBlock(b.dataset.block);
      else applyList(b.dataset.list);
      noteChanged(editorBlock().ed || ed);
      updateToolbar();
    };
  }
  $("note-done").onclick = () => closeNoteEditor();
  $("note-delete").onclick = deleteOpenNote;
}

/** The note of an item of the list being prepared: a free note (kind "note") or the note on a passage. */
function listNote(it, list) {
  const free = isNote(it);
  return {
    target: it, title: free ? "Note" : itemLabel(it), html: free ? it.text : it.note, passage: free ? null : it,
    heading: free ? null : itemLabel(it), sub: free ? "" : itemSnippet(it),
    save: (h) => { if (free) it.text = h; else it.note = h; saveLists(); },
    trash: (h) => trashPut(free ? { type: "item", listId: list.id, listName: list.name, item: { kind: "note", text: h } }
                                : { type: "note", listId: list.id, listName: list.name, label: itemLabel(it), html: h }),
    remove: () => {
      if (!free) delete it.note;
      else if (list.items.includes(it)) list.items.splice(list.items.indexOf(it), 1);
      saveLists();
    },
  };
}
function editListNote(it) {
  const n = listNote(it, currentList());
  n.focus = !n.html;
  openNoteEditor(n);
}
/** All notes of the list as one document, in the order of the list; the passages are headings in it. */
function openAllNotes() {
  const list = currentList();
  if (!list.items.length) return toast("The list is empty.");
  openNoteEditor({ all: true, title: `All notes · ${list.name || "this list"}`, sessions: list.items.map((it) => listNote(it, list)),
                   exportList: () => list });
}
/** All notes as a Word document or a PDF: the references and the notes, without the texts. */
function exportAllNotes(kind) {
  if (!noteSession || !noteSession.exportList) return;
  const list = noteSession.exportList();
  if (kind === "pdf") {
    showOutline(list, false);
    window.print();  // the outline is on screen and is what gets printed (see @media print)
    return;
  }
  textsOverride = false;
  const file = outlineDocx(list);
  textsOverride = null;
  sendFile(file, list.name || "Notes");
}
function addFreeNote() {
  const it = { kind: "note", text: "" };
  currentList().items.push(it);
  saveLists(); renderList();
  $("list-items").scrollTop = $("list-items").scrollHeight;
  editListNote(it);
}

// ---------------------------------------------------------------- keeping lists and notes safe
/* Everything is saved on this device straight away (a note after every letter). What can still go
   wrong: deleting something by mistake (Recently deleted, 30 days), and Safari clearing the data of
   a website that is not on the Home Screen (a backup file, and the advice to add it there). */
const TRASH_DAYS = 30;
const trashGet = () => store.get("trash", []).filter((x) => Date.now() - x.t < TRASH_DAYS * 864e5);
function trashPut(entry) {
  store.set("trash", [{ t: Date.now(), ...JSON.parse(JSON.stringify(entry)) }, ...trashGet()].slice(0, 300));
}
function trashLabel(x) {
  if (x.type === "list") return [`List “${x.list.name || "unnamed"}”`, countText(x.list.items) + (x.why ? ` · ${x.why}` : "")];
  if (x.type === "note") return [`Note on ${x.label}`, noteText(x.html)];
  const it = x.item;
  return [isNote(it) ? "Note" : itemLabel(it), noteText(isNote(it) ? it.text : it.note)];
}
function restoreTrash(x) {
  if (x.type === "list") {
    const taken = state.lists.some((l) => l.id === x.list.id);
    const list = { ...x.list, id: taken ? newList().id : x.list.id, name: taken ? `${x.list.name || "List"} (restored)` : x.list.name };
    state.lists.push(list);
    state.current = list.id;
  } else {
    const list = state.lists.find((l) => l.id === x.listId) || currentList();
    state.current = list.id;
    if (x.type === "note") {  // back on its passage, or as a note of its own if the passage has another note now
      const p = list.items.find((it) => !isNote(it) && itemLabel(it) === x.label && !it.note);
      if (p) p.note = x.html;
      else list.items.push({ kind: "note", text: `<h3>${esc(x.label)}</h3>${noteHtml(x.html)}` });
    } else list.items.splice(x.index ?? list.items.length, 0, x.item);  // where it was, if it can
  }
  store.set("trash", trashGet().filter((y) => y.t !== x.t));
  saveLists(); renderList();
}
function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago`
    : `${Math.round(m / 1440)} day${Math.round(m / 1440) === 1 ? "" : "s"} ago`;
}
function showTrash() {
  const items = trashGet();
  showDialog(`<h2>Recently deleted</h2>
    <p>Deleted notes, passages with a note, and lists stay here for ${TRASH_DAYS} days.</p>
    <ul class="trash" id="trash"></ul>
    <div class="buttons"><button id="t-close" class="primary">Close</button></div>`, (d) => {
    d.classList.add("wide");
    const ul = d.querySelector("#trash");
    if (!items.length) ul.append(el("li", "info", "Nothing was deleted recently."));
    for (const x of items) {
      const [title, sub] = trashLabel(x);
      const li = el("li"), body = el("div", "body");
      body.append(el("div", "label", title), el("div", "snip", sub), el("div", "when", `Deleted ${ago(x.t)}`));
      const b = el("button", "ghost small", "Restore");
      b.onclick = () => { restoreTrash(x); li.remove(); toast(`Restored: ${title}`); };
      li.append(body, b);
      ul.append(li);
    }
    d.querySelector("#t-close").onclick = closeDialog;
  });
}

/** All lists with their notes in one file, to keep in Files, iCloud Drive, mail… */
async function backupLists() {
  const date = new Date().toISOString().slice(0, 10);
  const data = { app: "bible-present-mobile", saved: new Date().toISOString(), lists: state.lists };
  const file = new File([JSON.stringify(data, null, 1)], `Bible Present backup ${date}.json`, { type: "application/json" });
  if (await sendFile(file, "Bible Present backup")) store.set("lastBackup", Date.now());
}
/** Lists from a backup file are added; a list that is here already is never overwritten. */
function restoreBackup() {
  const input = el("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch { return toast("That file is not a backup."); }
    if (!data || !Array.isArray(data.lists)) return toast("That file is not a Bible Present Mobile backup.");
    importLists(data.lists);
  };
  input.click();
}
function importLists(lists) {
  const valid = (it) => it && (it.kind === "note" || (it.kind === "sermon" && it.code) || Number.isInteger(it.b));
  let added = 0, same = 0;
  for (const l of lists) {
    if (!l || !Array.isArray(l.items)) continue;
    const items = l.items.filter(valid);
    const mine = state.lists.find((x) => x.id === l.id);
    if (mine && mine.name === l.name && JSON.stringify(mine.items) === JSON.stringify(items)) { same++; continue; }
    state.lists.push({ id: mine || !l.id ? newList().id : String(l.id),
                       name: mine ? `${l.name || "List"} (from backup)` : String(l.name || ""), items });
    added++;
  }
  saveLists(); renderList(); closeDialog();
  toast(added ? `Added ${added} list${added === 1 ? "" : "s"} from the backup` + (same ? `; ${same} already here` : "")
              : "Everything in this backup is here already.");
}

/* Automatic backups on the laptop: every time the iPad connects, all lists and notes go along and
   the laptop keeps them (its data folder, the last 30 per iPad). An iPad cannot save files by itself. */
function deviceId() {
  let id = store.get("device", null);
  if (!id) { id = Math.random().toString(36).slice(2, 10); store.set("device", id); }
  return id;
}
const hasLists = () => state.lists.some((l) => l.items.length);
/** Data for in an address (#…=): gzipped when the browser can, marked with a leading "z". */
async function pack(obj) {
  if (!window.CompressionStream) return b64enc(obj);
  const stream = new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return "z" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function unpack(s) {
  if (s[0] !== "z") return b64dec(s);
  const bin = atob(s.slice(1).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}
/** Once a week at most: a reminder when there has been no backup for two weeks. */
function remindBackup() {
  const last = Math.max(store.get("lastBackup", 0), store.get("laptopBackup", 0));
  const asked = store.get("backupAsked", 0);
  if (!state.lists.some((l) => l.items.some((it) => isNote(it) || it.note))) return;
  if (!asked) { store.set("backupAsked", Date.now()); return; }  // the first reminder comes a week later
  if (Date.now() - last < 14 * 864e5 || Date.now() - asked < 7 * 864e5) return;
  store.set("backupAsked", Date.now());
  showDialog(`<h2>Time for a backup?</h2>
    <p>${last ? `Your last backup was ${ago(last)}.` : "Your lists and notes have not been backed up yet."}
       Save a backup in Files or iCloud Drive, or connect to the laptop once: it keeps a backup by itself.</p>
    <div class="buttons"><button id="r-later" class="ghost">Later</button>
      <button id="r-now" class="primary">Back up now</button></div>`, (d) => {
    d.querySelector("#r-later").onclick = closeDialog;
    d.querySelector("#r-now").onclick = () => { closeDialog(); backupLists(); };
  });
}
const installed = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;

function showMenu() {
  const last = store.get("lastBackup", 0), onLaptop = store.get("laptopBackup", 0), n = trashGet().length;
  showDialog(`<h2>Lists and notes</h2>
    <p>Everything is saved on this device straight away, a note after every letter you type.
       <span id="m-persist"></span></p>
    ${installed() ? "" : `<p class="warn">Add Bible Present to the Home Screen (Share <b>⎙</b> → <b>Add to Home Screen</b>).
      Safari may clear the data of a website you have not opened for a while; an app on the Home Screen is kept.</p>`}
    <div class="menu">
      <button id="m-trash">Recently deleted${n ? ` (${n})` : ""}</button>
      <button id="m-backup">Back up all lists and notes</button>
      <button id="m-restore">Restore from a backup file…</button>
      <button id="m-laptop">Restore from the laptop…</button>
      <button id="m-bible">Add a Bible from a file…</button>
      ${ownBibles().map((b) => `<button class="m-own" data-id="${esc(b.id)}">Remove ${esc(b.id)} (${esc(b.name)}) from this iPad</button>`).join("")}
      <button id="m-help">Help</button>
    </div>
    <p class="hint">Last backup file: ${last ? ago(last) : "never"} (save it in Files or iCloud Drive).<br>
      Last automatic backup on the laptop: ${onLaptop ? ago(onLaptop) : "never"} (made every time you connect).</p>
    <div class="buttons"><button id="m-close" class="primary">Close</button></div>`, (d) => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((kept) => {
        const p = d.querySelector("#m-persist");
        if (p && kept) p.textContent = "This device keeps the data permanently: it is not cleared to make room.";
      }).catch(() => {});
    }
    d.querySelector("#m-trash").onclick = showTrash;
    d.querySelector("#m-backup").onclick = () => { closeDialog(); backupLists(); };
    d.querySelector("#m-restore").onclick = restoreBackup;
    d.querySelector("#m-laptop").onclick = () => connectDialog(true);
    d.querySelector("#m-bible").onclick = addBibleFromFile;
    for (const b of d.querySelectorAll(".m-own")) b.onclick = () => removeOwnBible(b.dataset.id);
    d.querySelector("#m-help").onclick = showHelp;
    d.querySelector("#m-close").onclick = closeDialog;
  });
}

// ---------------------------------------------------------------- help
const HELP = [
  ["Getting started", `
    <p>Bible Present Mobile prepares lists of Bible passages and sermon quotes for Bible Present on the laptop.
       It works without internet, except for searching and loading sermons.</p>
    <p><b>Add it to the Home Screen</b> (Safari: Share → Add to Home Screen). It then opens as an app, works offline,
       and Safari keeps your lists and notes.</p>`],
  ["Finding Bible verses", `
    <ul><li>Choose a book, a chapter and a verse. Tap a second verse to select the verses in between; tap the selected verse again to clear it.</li>
    <li>Or type in <b>Go to…</b>: <code>joh 3:16-18</code>, <code>ps 23</code>, <code>1 kor 13</code>. Dutch, English and French book names work.</li>
    <li>The box next to it switches the Bible (SV, KJV, LSG). That is only for reading on the iPad.</li>
    <li>Another Bible, such as the HSV, can be added: see <i>Adding a Bible (e.g. the HSV)</i> below.</li></ul>
    <p class="note-box"><b>Two languages on the screen?</b> That happens on the laptop, by itself: Bible Present shows every passage
       in the laptop's two Bibles (for example Dutch on top, English below), whichever Bible you read on the iPad.
       They are chosen on the laptop: Settings → Presentation → Top half / Bottom half → Bible.</p>`],
  ["Adding a Bible (e.g. the HSV)", `
    <p>SV, KJV and LSG are built in. A Bible you have as a file (for example the HSV) can be added to this iPad.
       It stays on this iPad only: it is never uploaded or shared.</p>
    <ol><li><b>Put the file on the iPad.</b> That is the Bible file you have (an <code>.xml</code> file, e.g. <i>HSV.xml</i>).
        If it was added to Bible Present on the laptop, the laptop also has a copy: in Windows Explorer, type
        <code>%APPDATA%\\BiblePresent\\bibles</code> in the address bar and press Enter; the file is <i>HSV.json</i>.
        To get it on the iPad, the easiest way is to <b>mail it to yourself</b>: open the mail on the iPad, tap and hold the attachment,
        then <b>Save to Files</b>. iCloud Drive or OneDrive work too.</li>
    <li>In Bible Present, tap <b>⋯</b> at the top of the list (next to <i>Delete</i>) → <b>Add a Bible from a file…</b></li>
    <li>Find the file (in <i>Downloads</i>, <i>iCloud Drive</i> or <i>On My iPad</i>; <b>Browse</b> at the bottom shows all places) and tap it.</li>
    <li>Check the short name (e.g. <b>HSV</b>), the full name and the language, and tap <b>Add</b>.</li>
    <li>The app opens again with the new Bible. The box next to <i>Go to…</i> switches between the Bibles.</li></ol>
    <p>Each iPad needs it added once. To remove it: ⋯ → <b>Remove … from this iPad</b>.
       Connected to the laptop, the console uses the laptop's Bibles anyway.</p>`],
  ["Sermon quotes", `
    <ul><li><b>Find sermon</b>: a code (<code>56-0401M</code>), words from the title or the place. The year box shows one year.</li>
    <li><b>Search the text</b> of all sermons and tap a result to open the sermon at that paragraph. The words are marked.</li>
    <li><b>Find in this sermon</b>: words or a paragraph number (<code>14</code>). It also looks in the other language:
        English words find the paragraph while you read Dutch (marked “found in EN”), and the other way round.</li>
    <li>NL / EN above the paragraphs switches the language you read on the iPad. Tap paragraphs to select them, like verses.</li></ul>
    <p class="note-box">On the screen the laptop shows the paragraph in its own two languages, whichever language you read here
       (Settings → App → Sermons on the laptop). Paragraph numbers are the same in every language.</p>`],
  ["Making a list", `
    <ul><li>Select verses or paragraphs and tap <b>＋ Add to list</b>. Typing several in Go to… adds them all: <code>joh 3:16; ps 23:1-4; 56-0401M 12</code>.</li>
    <li>Drag <b>⠿</b> to change the order, <b>✕</b> removes. Tap an item to see it on the left.</li>
    <li>The list box at the top switches between lists; <b>New list</b> starts one.</li></ul>
    <img class="help-anim" data-src="help/add-passage.webp" alt="Selecting John 3:16 to 18 and adding it to the list">
    <img class="help-anim" data-src="help/reorder.webp" alt="Dragging Psalm 23:4 higher up in the list">`],
  ["Notes", `
    <ul><li><b>＋ Note</b> adds a note between the passages, for an introduction, a bridge or a reminder. Drag it into place.</li>
    <li><b>✎</b> on a passage gives that passage its own note; the verse or quote is shown above it while you write.</li>
    <li>A note opens on the left. Tap another note in the list to switch; <b>Done</b> closes it. An empty note is removed.</li>
    <li><b>All notes</b> (under the list) shows every note of the list as one document, in the order of the list, with the passages as headings in between. Write anywhere: under a passage that has no note yet too (“Add a note…”).
        <b>Word</b> and <b>PDF</b> at the top make a document of it (the references and your notes; for the full texts too, use Outline).</li>
    <li>The toolbar: Title, Heading, Subheading and Body; <b>B</b> <i>I</i> <u>U</u> <s>S</s>; the marker (tap <b>A</b>, then a colour; ✕ removes it);
        <b>Aa</b> for the colour of the text and the font (Serif, Rounded, Typewriter, Handwriting); bullets, numbers and a checklist (tap the circle to tick it off).
        Select text first, or choose before you type.</li>
    <li>Quicker: start a line with <code>- </code> for bullets, <code>1. </code> for numbers or <code>[] </code> for a checklist. Return on an empty line ends the list.</li>
    <li><b>Undo</b>: ↶ and ↷ in the toolbar, the undo key above the keyboard, or swipe left with three fingers (right to redo).</li></ul>
    <img class="help-anim" data-src="help/note.webp" alt="Writing a note on John 3:16 to 18 with a title, bullets, a checklist and a green marker">
    <img class="help-anim" data-src="help/all-notes.webp" alt="All notes of the list as one document, and writing under Hebrews 11:1">`],
  ["Outline, Word and PDF", `
    <p><b>Outline</b> (under the list) shows the whole list as you will go through it: your notes, the references and the full texts.
       Switch off <i>With the Bible and sermon texts</i> for just the references and your notes.</p>
    <p><b>Language</b> puts the book names, the Bible text (SV, KJV or LSG) and the sermon texts in that language; your notes stay as you wrote them.
       Verse numbers are converted where Bibles count differently (SV Psalm 51:3 is Psalm 51:1 in the KJV).
       A sermon that Message Hub does not have in that language keeps its own language.</p>
    <ul><li><b>Word</b> makes a Word document (.docx) with the formatting of your notes; save it in Files or open it in Word or Pages.</li>
    <li><b>PDF / Print</b> opens the print screen: print it, or tap Share (top right) → Save to Files for a PDF.</li>
    <li><b>Share</b> sends it as plain text (mail, messages…).</li></ul>`],
  ["Getting the list to the laptop", `
    <ul><li><b>Connect to laptop</b> (same Wi-Fi): on the laptop, Bible Present → <b>iPad</b> → switch it on, then enter the address and the 4-digit code.
       Your list goes along, and the iPad becomes the presenting console: tap an item to put it on the screen, Next/Previous, Blank, languages.</li>
    <li>The languages on the screen are the laptop's (see <i>Finding Bible verses</i>). The three language buttons in the console choose
       whether the screen shows both, or only the top or the bottom one.</li>
    <li>Your notes stay on the iPad: the console shows them in their places in the service list, only for you.</li>
    <li><b>Back to my lists</b> brings the list back, with the changes and your notes.</li>
    <li>Without Wi-Fi: <b>Send as file</b> (AirDrop, mail) and open it on the laptop with Service list ⋯ → Open list, or <b>Share as text</b> and Paste list.</li></ul>`],
  ["Keeping your notes safe", `
    <ul><li>Everything is saved straight away, a note after every letter you type.</li>
    <li>Deleted notes, passages with a note and lists go to <b>⋯ → Recently deleted</b> for 30 days.</li>
    <li><b>Automatic backup on the laptop:</b> every time you connect, the laptop keeps a copy of all your lists and notes (the last 30).
        <b>⋯ → Restore from the laptop</b> brings a backup back. The laptop needs Bible Present 1.6.2 or later.</li>
    <li><b>⋯ → Back up all lists and notes</b> makes one file; save it in Files or iCloud Drive. <b>Restore from a backup file</b> adds the lists from such a file again (nothing is overwritten).
        If there has been no backup for two weeks, the app reminds you.</li>
    <li>Keep the app on the Home Screen: Safari may clear the data of websites you have not opened for a while.</li></ul>`],
];
function showHelp() {
  showDialog(`<h2>Help</h2><div class="help" id="help"></div>
    <div class="buttons"><button id="h-close" class="primary">Close</button></div>`, (d) => {
    d.classList.add("wide");
    const box = d.querySelector("#help");
    for (const [title, html] of HELP) {
      const sec = el("details");
      const sum = el("summary", "", title);
      const body = el("div", "help-body");
      body.innerHTML = html;
      sec.append(sum, body);
      sec.addEventListener("toggle", () => {  // the animations load only when their part is opened
        if (sec.open) for (const img of body.querySelectorAll("img[data-src]")) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
      });
      box.append(sec);
    }
    d.querySelector("#h-close").onclick = closeDialog;
  });
}
/** Drag an item by its grip. The item lifts and follows the finger (it is only moved visually,
    so iPadOS keeps tracking the finger); the other items glide out of the way; on release it
    settles into its new place. Near the top/bottom edge the list scrolls along. */
let dragging = false;
function startDrag(e, li, grip, onDrop) {
  if (dragging) return;
  e.preventDefault();
  dragging = true;
  const ul = $("list-items");
  const items = [...ul.children];
  const from = items.indexOf(li);
  // positions inside the list (independent of scrolling and of the transforms we set)
  const tops = items.map((x) => x.offsetTop);
  const heights = items.map((x) => x.offsetHeight);
  const step = from + 1 < items.length ? tops[from + 1] - tops[from] : heights[from] + 4;
  const startY = e.clientY, startScroll = ul.scrollTop;
  let lastY = startY, to = from, frame = 0;
  ul.classList.add("sorting");
  li.classList.add("dragging");

  const offset = () => lastY - startY + (ul.scrollTop - startScroll);
  const render = () => {
    frame = 0;
    const dy = offset();
    li.style.transform = `translateY(${dy}px) scale(1.02)`;
    const center = tops[from] + heights[from] / 2 + dy;
    to = 0;
    items.forEach((x, i) => { if (i !== from && tops[i] + heights[i] / 2 < center) to++; });
    items.forEach((x, i) => {
      if (i === from) return;
      const shift = from < to && i > from && i <= to ? -step : from > to && i >= to && i < from ? step : 0;
      x.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  const scroller = setInterval(() => {
    const r = ul.getBoundingClientRect();
    const s = lastY < r.top + 50 ? -12 : lastY > r.bottom - 50 ? 12 : 0;
    if (s) { ul.scrollTop += s; schedule(); }
  }, 16);
  const move = (ev) => { if (ev.pointerId === e.pointerId) { lastY = ev.clientY; schedule(); } };
  const end = (ev) => {
    if (ev && ev.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    clearInterval(scroller);
    cancelAnimationFrame(frame);
    render();
    // settle: glide into the new slot, then rebuild the list in the new order
    const target = to === from ? 0 : (tops[to] - tops[from]) + (to > from ? heights[to] - heights[from] : 0);
    li.style.transition = "transform .18s ease";
    li.style.transform = `translateY(${target}px)`;
    setTimeout(() => {
      for (const x of items) { x.style.transform = ""; x.style.transition = ""; }
      li.classList.remove("dragging");
      ul.classList.remove("sorting");
      dragging = false;
      if (to !== from) onDrop(from, to);
      renderList();
    }, 190);
  };
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  schedule();
}
function showItem(it) {
  closeNoteEditor();
  setMode("browse");
  if (it.kind === "sermon") { setTab("sermons"); openSermon(it.code, it.v1, it.lang); }
  else { setTab("bible"); openChapter(it.b, it.c, { start: it.v1, end: it.v2 }); }
}

// ---------------------------------------------------------------- sending to the computer
/** Text the Windows app understands (Service list ⋯ → Paste list): one passage per line. */
function listAsText(list) {
  const lines = [`# ${list.name || "Bible Present list"}`];
  for (const it of passages(list.items)) {
    lines.push(it.kind === "sermon" ? `${it.code} ${range(it.v1, it.v2)}` : `${BOOKS_NL[it.b]} ${it.c}:${range(it.v1, it.v2)}`);
  }
  return lines.join("\n");
}
/** The same file format as the Windows app's Save list / Open list. */
function listAsFile(list) {
  const service = passages(list.items).map((it) => it.kind === "sermon"
    ? { ref: itemLabel(it), kind: "sermon", code: it.code, v1: it.v1, v2: it.v2 }
    : { ref: `${BOOKS_NL[it.b]} ${it.c}:${range(it.v1, it.v2)}`, b: it.b, c: it.c, v1: it.v1, v2: it.v2 });
  const name = (list.name || "Bible Present list").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return new File([JSON.stringify({ name: list.name, service }, null, 2)], `${name}.json`, { type: "application/json" });
}
async function shareFile() {
  const list = currentList();
  if (!passages(list.items).length) return toast("The list has no passages.");
  await sendFile(listAsFile(list), list.name || "Bible Present list");
}
/** The share sheet (AirDrop, Files, mail…), or a download. False when cancelled. */
async function sendFile(file, title) {
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return true;
    }
  } catch (e) { if (e.name === "AbortError") return false; }
  // No share sheet (or it refused the file). A download started from code does nothing in an app on
  // the iPad's Home Screen, so offer a link to tap: that opens the file, with Share at the top.
  const url = URL.createObjectURL(file);
  showDialog(`<h2>${esc(file.name)}</h2>
    <p>Tap the file to open it. Then use <b>Share</b> (⎙) to save it in Files, open it in Word or send it.</p>
    <p><a class="file-link" href="${url}" download="${esc(file.name)}" target="_blank">📄 ${esc(file.name)}</a></p>
    <div class="buttons"><button id="f-close" class="primary">Close</button></div>`, (d) => {
    d.querySelector("#f-close").onclick = () => { closeDialog(); URL.revokeObjectURL(url); };
  });
  return true;
}
async function shareText() {
  const list = currentList();
  if (!passages(list.items).length) return toast("The list has no passages.");
  await sendText(listAsText(list), list.name || "Bible Present list", "Copied: paste it in Bible Present (Paste list).");
}
async function sendText(text, title, copied) {
  try {
    if (navigator.share) { await navigator.share({ text, title }); return; }
  } catch (e) { if (e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast(copied); }
  catch { prompt("Copy this text:", text); }
}

// ---------------------------------------------------------------- the outline: the whole list to read through
/** [[number, text]] of a passage, or null for a sermon that is not loaded yet. */
function passageParas(it) {
  if (it.kind === "sermon") {
    const paras = paraCache[`${sermonLang(it)}/${it.code}`];
    return paras ? paras.filter(([n]) => n >= it.v1 && n <= (it.v2 || it.v1)) : null;
  }
  const out = [];
  for (let v = it.v1; v <= (it.v2 || it.v1); v++) out.push([v, verseText(it.b, it.c, v)]);
  return out;
}
const sermonLang = (it) => it.lang || ((state.sermonIndex[it.code] || {}).nl ? "nl" : "en");

/** The outline of a list (the list being prepared, or the console's); texts: false = notes only (from All notes). */
function showOutline(list = currentList(), texts = null) {
  if (!list.items.length) return toast("The list is empty.");
  textsOverride = texts;
  showDialog(`<h2>${esc(list.name || "Outline")}</h2>
    <div class="o-options"><label class="o-texts"><input type="checkbox" id="o-texts" ${withTexts() ? "checked" : ""}> With the Bible and sermon texts</label>
      <label class="o-lang">Language <select id="o-lang">${Object.entries(EXPORT_LANGS).map(([k, v]) =>
        `<option value="${k}" ${k === exportLang() ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
    <div class="outline" id="outline"></div>
    <div class="buttons"><button id="o-word" class="ghost">Word</button><button id="o-print" class="ghost">PDF / Print</button>
      <button id="o-share" class="ghost">Share</button><button id="o-close" class="primary">Close</button></div>`, (d) => {
    d.classList.add("wide");
    d.querySelector("#o-close").onclick = closeDialog;
    d.querySelector("#o-texts").onchange = (e) => {
      if (texts === null) store.set("outlineTexts", e.target.checked); else textsOverride = e.target.checked;
      renderOutline(list);
    };
    d.querySelector("#o-lang").onchange = (e) => {
      store.set("outlineLang", e.target.value);
      renderOutline(list);
      prepareExport(list).then(() => renderOutline(list));
    };
    d.querySelector("#o-share").onclick = () =>
      sendText(outlineText(list), list.name || "Outline", "Copied the outline.");
    d.querySelector("#o-word").onclick = () => sendFile(outlineDocx(list), list.name || "Outline");
    // the print screen can also save it as a PDF (Share → Save to Files); what is printed: see @media print
    d.querySelector("#o-print").onclick = () => window.print();
    document.body.classList.add("outline-open");
    renderOutline(list);
  });
  // sermon texts that are not here yet (and the other Bible for another language): load them, then show them
  prepareExport(list).then(() => renderOutline(list));
}
async function loadSermonParas(it, lang = sermonLang(it)) {
  if (it.kind !== "sermon" || paraCache[`${lang}/${it.code}`]) return;
  try {
    const data = await api(`${lang}/sermons/${it.code}/blocks`);
    paraCache[`${lang}/${it.code}`] = (data.blocks || []).map((b) => [b.blockNumber, cleanText(b.blockText)]);
  } catch { /* offline (or not in that language): the short preview stays */ }
}

/* The outline in another language: the book names, the Bible of that language and the sermon text in
   that language. Bibles number some verses differently (SV Psalm 51:3 = KJV Psalm 51:1: the Dutch
   count a psalm's heading as verse 1), so the passage is converted with the standard tables. */
const EXPORT_LANGS = { "": "As on the iPad", nl: "Nederlands", en: "English", fr: "Français" };
const exportLang = () => store.get("outlineLang", "");
let verseTables = null;
async function loadVerseTables() {
  if (verseTables) return;
  try {
    const d = await (await fetch("data/versification.json")).json();
    const engToOrg = new Map(), orgToEng = new Map();
    for (const [b1, c1, v1, b2, c2, v2] of d.eng_to_org) {
      const e = `${b1}.${c1}.${v1}`, o = `${b2}.${c2}.${v2}`;
      if (!engToOrg.has(e)) engToOrg.set(e, []);
      engToOrg.get(e).push([b2, c2, v2]);
      if (!orgToEng.has(o)) orgToEng.set(o, []);
      orgToEng.get(o).push([b1, c1, v1]);
    }
    verseTables = { eng: d.eng, org: d.org, engToOrg, orgToEng };
  } catch { verseTables = { eng: [], org: [], engToOrg: new Map(), orgToEng: new Map() }; }  // then: the same numbers
}
/** The Bible to export in a language: the one in use when it is in that language (e.g. the HSV), else the first. */
const bibleFor = (lang) => (bibleLang() === lang && BIBLES.find((b) => b.id === state.bibleId)) || BIBLES.find((b) => b.lang === lang);
async function loadBibleData(id) {
  if (!bibleCache[id]) {
    const own = !conn.info && ownBibles().some((b) => b.id === id);
    const res = own ? await (await caches.open(OWN_BIBLES)).match(`own/${id}.json`) : await fetch(`data/${id}.json`);
    if (!res) throw new Error(`Bible ${id} is not on this device`);
    bibleCache[id] = await res.json();
  }
  return bibleCache[id];
}

/* Reading a Bible file, as the laptop does (bible_data.py): its own JSON, Zefania XML, and XML laid out
   as <bible>/<book number>/<chapter number>/<verse number>. Result: 66 books x chapters x verses. */
function cleanVerse(t) {
  return String(t).replace(/\]\s*\[\([^)]*\)\s*/g, " ").replace(/[[\]¶]/g, "").replace(/[֐-׿]/g, "")
    .replace(/\s+/g, " ").trim();
}
function putVerse(books, b, c, v, text) {
  if (!(b >= 0 && b < 66 && c > 0 && v > 0)) return;
  const chapters = books[b];
  while (chapters.length < c) chapters.push([]);
  const verses = chapters[c - 1];
  while (verses.length < v) verses.push("");
  verses[v - 1] = cleanVerse(text);
}
const LANG_CODES = { nl: "nl", nld: "nl", dut: "nl", dutch: "nl", nederlands: "nl", en: "en", eng: "en", english: "en",
                     fr: "fr", fra: "fr", fre: "fr", french: "fr", "français": "fr", francais: "fr" };
function bibleFromXml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("This file is not valid XML.");
  const books = Array.from({ length: 66 }, () => []);
  const tag = (el, name) => [...el.getElementsByTagName(name)];
  const meta = (name) => { const x = doc.getElementsByTagName(name)[0]; return x ? x.textContent.trim() : ""; };
  let info;
  if (doc.getElementsByTagName("BIBLEBOOK").length) {  // Zefania
    for (const bk of tag(doc, "BIBLEBOOK")) {
      const b = Number(bk.getAttribute("bnumber")) - 1;
      for (const ch of tag(bk, "CHAPTER")) {
        const c = Number(ch.getAttribute("cnumber"));
        for (const vs of tag(ch, "VERS")) {
          // verses squeezed into the previous one: "... [ (Psalms 3:9) Het heil ... ]" are split out again
          const pieces = vs.textContent.split(/\[\s*\([^)]*?\s+\d+:(\d+)\)/);
          putVerse(books, b, c, Number(vs.getAttribute("vnumber")), pieces[0]);
          for (let i = 1; i < pieces.length; i += 2) putVerse(books, b, c, Number(pieces[i]), pieces[i + 1]);
        }
      }
    }
    info = { id: meta("identifier"), name: meta("title") || doc.documentElement.getAttribute("biblename"), lang: meta("language") };
  } else if (tag(doc, "book").some((x) => x.hasAttribute("number"))) {
    for (const bk of tag(doc, "book")) {
      const b = Number(bk.getAttribute("number")) - 1;
      for (const ch of tag(bk, "chapter")) {
        for (const vs of tag(ch, "verse")) putVerse(books, b, Number(ch.getAttribute("number")), Number(vs.getAttribute("number")), vs.textContent);
      }
    }
    const root = doc.documentElement;
    info = { id: root.getAttribute("abbreviation") || root.getAttribute("id"), name: root.getAttribute("translation") || root.getAttribute("name"),
             lang: root.getAttribute("language") || root.getAttribute("lang") };
  } else {
    throw new Error("This XML layout is not supported. Supported: Zefania XML, and <bible>/<book number>/<chapter number>/<verse number>.");
  }
  return { books, ...info };
}
function bibleFromJson(text) {
  const data = JSON.parse(text);
  const ok = data && Array.isArray(data.books) && data.books.length === 66 &&
    data.books.every((b) => Array.isArray(b) && b.every((c) => Array.isArray(c)));
  if (!ok) throw new Error("This JSON file is not a Bible in Bible Present's format.");
  return { books: data.books, id: data.id, name: data.name, lang: data.language };
}

/** A Bible from a file (XML, or the laptop's JSON), kept on this device only. */
function addBibleFromFile() {
  const input = el("input");
  input.type = "file";
  input.accept = ".xml,.json,application/xml,text/xml,application/json";
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    let bible;
    try {
      const text = await f.text();
      bible = /^\s*</.test(text) ? bibleFromXml(text) : bibleFromJson(text);
    } catch (e) { return showDialog(`<h2>Could not read this file</h2><p>${esc(e.message || "Unknown file type.")}</p>
      <div class="buttons"><button class="primary" id="x-ok">OK</button></div>`, (d) => { d.querySelector("#x-ok").onclick = closeDialog; }); }
    const verses = bible.books.reduce((s, b) => s + b.reduce((t, c) => t + c.filter(Boolean).length, 0), 0);
    if (!verses) return toast("No verses found in this file.");
    confirmOwnBible(bible, f.name, verses);
  };
  input.click();
}
/** Check the short name, the full name and the language, then keep the Bible. */
function confirmOwnBible(bible, fileName, verses) {
  const guess = String(bible.id || fileName.replace(/\.(xml|json)$/i, "")).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12).toUpperCase();
  const lang = LANG_CODES[String(bible.lang || "").toLowerCase()] || "nl";
  showDialog(`<h2>Add a Bible</h2>
    <p>${verses.toLocaleString()} verses found in “${esc(fileName)}”. It is kept on this iPad only.</p>
    <label class="field">Short name (shown in the Bible box)<input id="ob-id" type="text" maxlength="12" autocapitalize="characters" value="${esc(guess)}"></label>
    <label class="field">Full name<input id="ob-name" type="text" value="${esc(bible.name || guess)}"></label>
    <label class="field">Language (for the book names)<select id="ob-lang">${["nl", "en", "fr"].map((l) =>
      `<option value="${l}" ${l === lang ? "selected" : ""}>${EXPORT_LANGS[l]}</option>`).join("")}</select></label>
    <div class="error" id="ob-err"></div>
    <div class="buttons"><button id="ob-cancel" class="ghost">Cancel</button><button id="ob-add" class="primary">Add</button></div>`, (d) => {
    d.querySelector("#ob-cancel").onclick = closeDialog;
    d.querySelector("#ob-add").onclick = async () => {
      const id = d.querySelector("#ob-id").value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12);
      const name = d.querySelector("#ob-name").value.trim() || id;
      const lng = d.querySelector("#ob-lang").value;
      if (!id) { d.querySelector("#ob-err").textContent = "Give it a short name, e.g. HSV."; return; }
      if (["SV", "KJV", "LSG"].includes(id.toUpperCase())) { d.querySelector("#ob-err").textContent = `${id} is already in the app; choose another short name.`; return; }
      const body = JSON.stringify({ id, name, language: lng, books: bible.books });
      await (await caches.open(OWN_BIBLES)).put(`own/${id}.json`, new Response(body, { headers: { "Content-Type": "application/json" } }));
      store.set("ownBibles", [...ownBibles().filter((b) => b.id !== id), { id, name, lang: lng }]);
      store.set("bible", id);  // use it straight away
      delete bibleCache[id];
      closeDialog();
      toast(`${id} added`);
      setTimeout(() => location.reload(), 1000);  // the Bible box is filled at the start
    };
  });
}
async function removeOwnBible(id) {
  if (!confirm(`Remove ${id} from this iPad? You can add it again from the file.`)) return;
  await (await caches.open(OWN_BIBLES)).delete(`own/${id}.json`);
  store.set("ownBibles", ownBibles().filter((b) => b.id !== id));
  if (state.bibleId === id) store.set("bible", "SV");
  location.reload();
}
/** Does this Bible number this chapter the English way ("eng"), the original way ("org"), or are they the same? */
function numbering(bible, b, c) {
  const n = (bible.books[b][c - 1] || []).length, e = (verseTables.eng[b] || [])[c - 1], o = (verseTables.org[b] || [])[c - 1];
  return e === o ? "same" : n === o ? "org" : n === e ? "eng" : "same";
}
/** The verses [[c, v]] in Bible `to` of verses v1-v2 of chapter c in Bible `from`. */
function convertVerses(from, to, b, c, v1, v2) {
  const out = [], seen = new Set();
  for (let v = v1; v <= (v2 || v1); v++) {
    const orgs = numbering(from, b, c) === "eng" ? verseTables.engToOrg.get(`${b}.${c}.${v}`) || [[b, c, v]] : [[b, c, v]];
    for (const [ob, oc, ov] of orgs) {
      const targets = numbering(to, ob, oc) === "eng" || (to.books[ob][oc - 1] || []).length < ov
        ? verseTables.orgToEng.get(`${ob}.${oc}.${ov}`) || [[ob, oc, ov]] : [[ob, oc, ov]];
      for (const [, tc, tv] of targets) {
        const key = `${tc}.${tv}`;
        if (tv > 0 && !seen.has(key) && to.books[b][tc - 1] && to.books[b][tc - 1][tv - 1]) { seen.add(key); out.push([tc, tv]); }
      }
    }
  }
  return out;
}
/** A passage as exported: {label, paras: [[number, text]] or null}, in the chosen language. */
function exportItem(it) {
  const lang = exportLang();
  if (!lang) return { label: itemLabel(it), paras: passageParas(it) };
  if (it.kind === "sermon") {
    const own = paraCache[`${lang}/${it.code}`];
    const paras = own && own.length ? own.filter(([n]) => n >= it.v1 && n <= (it.v2 || it.v1)) : passageParas(it);
    return { label: `${it.code} ¶${range(it.v1, it.v2)}  ${sermonTitle(it.code, own && own.length ? lang : it.lang)}`, paras };
  }
  const target = bibleFor(lang), to = target && bibleCache[target.id];
  if (!to || !verseTables) return { label: `${bookName(it.b, lang)} ${it.c}:${range(it.v1, it.v2)}`, paras: passageParas(it) };
  const refs = convertVerses(state.bible, to, it.b, it.c, it.v1, it.v2);
  if (!refs.length) return { label: `${bookName(it.b, lang)} ${it.c}:${range(it.v1, it.v2)}`, paras: [] };
  const [c1, v1] = refs[0], [c2, v2] = refs[refs.length - 1];
  const label = `${bookName(it.b, lang)} ${c1}:${c1 === c2 ? range(v1, v2) : `${v1}-${c2}:${v2}`}`;
  return { label, paras: refs.map(([c, v]) => [c1 === c2 ? v : `${c}:${v}`, to.books[it.b][c - 1][v - 1]]) };
}
/** Loads what the export needs (the other Bible, the tables, sermon texts). */
async function prepareExport(list) {
  const lang = exportLang(), jobs = [];
  for (const it of passages(list.items)) {
    if (it.kind === "sermon") jobs.push(loadSermonParas(it), lang ? loadSermonParas(it, lang) : null);
  }
  if (lang && bibleFor(lang)) jobs.push(loadVerseTables(), loadBibleData(bibleFor(lang).id).catch(() => null));
  await Promise.all(jobs);
}
/** A note as formatted text in the outline. */
function noteBlock(html) {
  const box = el("div", "o-note note-doc");
  box.innerHTML = cleanNote(noteHtml(html));
  return box;
}
function renderOutline(list) {
  const box = $("outline");
  if (!box) return;
  box.innerHTML = "";
  for (const it of list.items) {
    if (isNote(it)) { box.append(noteBlock(it.text)); continue; }
    const sec = el("div", "o-item");
    const { label, paras } = exportItem(it);
    sec.append(el("div", "o-ref", label));
    if (!withTexts()) { /* the references and notes only */ }
    else if (paras) for (const [n, t] of paras) { const p = el("p", "o-text"); p.append(el("span", "n", n), " " + t); sec.append(p); }
    else sec.append(el("p", "o-text", it.snippet || ""));
    if (it.note) sec.append(noteBlock(it.note));
    box.append(sec);
  }
}
function outlineText(list) {
  const lines = [list.name || "Outline", ""];
  for (const it of list.items) {
    if (isNote(it)) { lines.push(noteText(it.text), ""); continue; }
    const { label, paras } = exportItem(it);
    lines.push(label);
    if (!withTexts()) { /* the references and notes only */ }
    else if (paras) for (const [n, t] of paras) lines.push(`${n} ${t}`);
    else if (it.snippet) lines.push(it.snippet);
    if (it.note) lines.push(noteText(it.note));
    lines.push("");
  }
  return lines.join("\n").trim();
}
let textsOverride = null;  // for the open outline: with or without the texts (null: as last time)
function withTexts() {
  if (textsOverride !== null) return textsOverride;
  return store.get("outlineTexts", true);
}

// ---------------------------------------------------------------- the outline as a Word document (.docx)
/* A .docx is a zip of a few XML files. Made here, without a library: titles and headings become
   Word's own styles, so the document has a navigation pane; the formatting of the notes comes along. */
const WORD_FONTS = { serif: "Georgia", rounded: "Arial Rounded MT Bold", mono: "Courier New", hand: "Segoe Print" };
const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
const markerHex = (name) => { const [r, g, b, a] = MARKERS[name]; return [r, g, b].map((c) => hex2(c * a + 255 * (1 - a))).join(""); };
const xml = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** A note as Word paragraphs: [{style, runs: [{text, fmt} | {br}]}]. */
function noteParas(html) {
  const t = document.createElement("template");
  t.innerHTML = cleanNote(noteHtml(html));
  const out = [];
  let cur = null;
  const para = (style, prefix) => { cur = { style, runs: prefix ? [{ text: prefix, fmt: {} }] : [] }; out.push(cur); };
  const walk = (node, fmt) => {
    for (const c of node.childNodes) {
      if (c.nodeType === 3) { if (!cur) para("Normal"); cur.runs.push({ text: c.data, fmt }); continue; }
      const tag = c.tagName;
      if (tag === "BR") { if (!cur) para("Normal"); else if (c.nextSibling) cur.runs.push({ br: true }); continue; }
      if (tag === "UL" || tag === "OL" || (/^(DIV|P|H1|H2|H3)$/.test(tag) && c.querySelector("div, p, h1, h2, h3, ul, ol"))) {
        cur = null; walk(c, fmt); cur = null; continue;  // holds blocks of its own
      }
      if (/^(DIV|P|H1|H2|H3)$/.test(tag)) { para({ H1: "Heading1", H2: "Heading2", H3: "Heading3" }[tag] || "Normal"); walk(c, fmt); cur = null; continue; }
      if (tag === "LI") {
        const list = c.parentElement;
        para("ListItem", list.classList.contains("checklist") ? (c.classList.contains("checked") ? "☑\t" : "☐\t")
          : list.tagName === "OL" ? `${[...list.children].indexOf(c) + 1}.\t` : "•\t");
        walk(c, fmt); cur = null; continue;
      }
      const f = { ...fmt };
      if (/^(B|STRONG)$/.test(tag)) f.b = true;
      if (/^(I|EM)$/.test(tag)) f.i = true;
      if (tag === "U") f.u = true;
      if (/^(S|STRIKE)$/.test(tag)) f.s = true;
      if (tag === "MARK" || tag === "SPAN") {
        const st = inlineStyle(c);
        if (st.marker) f.fill = markerHex(st.marker);
        if (st.color) f.color = TEXT_COLORS[st.color].map(hex2).join("");
        if (st.font) f.font = WORD_FONTS[st.font];
      }
      walk(c, f);
    }
  };
  walk(t.content, {});
  return out;
}
function runXml(r) {
  if (r.br) return "<w:r><w:br/></w:r>";
  const f = r.fmt || {};
  const pr = (f.font ? `<w:rFonts w:ascii="${f.font}" w:hAnsi="${f.font}" w:cs="${f.font}"/>` : "") + (f.b ? "<w:b/>" : "") +
    (f.i ? "<w:i/>" : "") + (f.s ? "<w:strike/>" : "") + (f.color ? `<w:color w:val="${f.color}"/>` : "") +
    (f.u ? '<w:u w:val="single"/>' : "") + (f.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${f.fill}"/>` : "");
  const body = String(r.text).split("\n").map((line) => line.split("\t")
    .map((s) => (s ? `<w:t xml:space="preserve">${xml(s)}</w:t>` : "")).join("<w:tab/>")).join("<w:br/>");
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}${body}</w:r>`;
}
const paraXml = (p) => `<w:p><w:pPr><w:pStyle w:val="${p.style}"/></w:pPr>${p.runs.map(runXml).join("")}</w:p>`;

function outlineDocx(list) {
  const paras = [{ style: "Title", runs: [{ text: list.name || "Outline" }] }];
  for (const it of list.items) {
    if (isNote(it)) { paras.push(...noteParas(it.text)); continue; }
    const { label, paras: texts } = exportItem(it);
    paras.push({ style: "Reference", runs: [{ text: label }] });
    if (!withTexts()) { /* the references and notes only */ }
    else if (texts) for (const [n, t] of texts) paras.push({ style: "Passage", runs: [{ text: `${n} `, fmt: { b: true, color: "E3815F", font: "Calibri" } }, { text: t }] });
    else if (it.snippet) paras.push({ style: "Passage", runs: [{ text: it.snippet }] });
    if (it.note) paras.push(...noteParas(it.note));
  }
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${paras.map(paraXml).join("")}` +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
  const style = (id, name, ppr, rpr, extra = "") => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>` +
    `<w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>${extra}<w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}>` +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/>' +
    `<w:sz w:val="23"/><w:szCs w:val="23"/><w:lang w:val="${{ nl: "nl-NL", en: "en-GB", fr: "fr-FR" }[exportLang() || bibleLang()]}"/></w:rPr></w:rPrDefault>` +
    '<w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    style("Title", "Title", '<w:spacing w:after="240"/>', '<w:b/><w:color w:val="324158"/><w:sz w:val="48"/><w:szCs w:val="48"/>') +
    style("Heading1", "heading 1", '<w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="0"/>', '<w:b/><w:sz w:val="36"/><w:szCs w:val="36"/>') +
    style("Heading2", "heading 2", '<w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/>', '<w:b/><w:sz w:val="30"/><w:szCs w:val="30"/>') +
    style("Heading3", "heading 3", '<w:keepNext/><w:spacing w:before="160" w:after="40"/><w:outlineLvl w:val="2"/>', '<w:b/><w:sz w:val="26"/><w:szCs w:val="26"/>') +
    style("Reference", "Reference", '<w:keepNext/><w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="D5DCE4"/></w:pBdr><w:spacing w:before="280" w:after="80"/>',
          '<w:b/><w:color w:val="324158"/><w:sz w:val="26"/><w:szCs w:val="26"/>') +
    style("Passage", "Passage", '<w:pBdr><w:left w:val="single" w:sz="8" w:space="8" w:color="D5DCE4"/></w:pBdr><w:spacing w:after="60"/><w:ind w:left="200"/>',
          '<w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/><w:color w:val="404B5A"/>') +
    style("ListItem", "List item", '<w:tabs><w:tab w:val="left" w:pos="567"/></w:tabs><w:ind w:left="567" w:hanging="283"/><w:spacing w:after="40"/>', "") +
    "</w:styles>";
  const files = {
    "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    "_rels/.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/_rels/document.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "word/document.xml": doc,
    "word/styles.xml": styles,
  };
  const name = (list.name || "Outline").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return new File([zipFiles(files)], `${name}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/** A zip file (stored, not compressed) of {name: text}. */
let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  }
  let c = 0xFFFFFFFF;
  for (const b of bytes) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipFiles(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = enc.encode(name), data = enc.encode(text), crc = crc32(data);
    const head = (sig, extra) => {
      const h = new DataView(new ArrayBuffer(extra ? 46 : 30));
      let i = 0;
      const u32 = (v) => { h.setUint32(i, v, true); i += 4; }, u16 = (v) => { h.setUint16(i, v, true); i += 2; };
      u32(sig);
      if (extra) u16(20);  // made by
      u16(20); u16(0x0800); u16(0); u16(time); u16(date); u32(crc); u32(data.length); u32(data.length); u16(nameBytes.length); u16(0);
      if (extra) { u16(0); u16(0); u16(0); u32(0); u32(offset); }
      return new Uint8Array(h.buffer);
    };
    const local = head(0x04034B50, false);
    parts.push(local, nameBytes, data);
    central.push(head(0x02014B50, true), nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const size = central.reduce((s, p) => s + p.length, 0), n = Object.keys(files).length;
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true); end.setUint16(8, n, true); end.setUint16(10, n, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)]);
}

// ---------------------------------------------------------------- the Go to / add box
async function onRefInput() {
  const text = $("ref-input").value.trim();
  if (!text) return;
  const parts = text.split(/[;\n]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {  // several at once: add them all
    const bad = parts.filter((p) => !addFromText(p));
    toast(bad.length ? `Added ${parts.length - bad.length}; could not add: ${bad.join(", ")}`
                     : `Added ${parts.length} to the list`);
    setField("ref-input", bad.join("; "));   // keep only what could not be added
    return;
  }
  const m = text.match(SERMON_RE);
  if (m) { setTab("sermons"); openSermon(m[1], m[2] ? +m[2] : null); return; }
  const r = parsePassage(text);
  if (!r) return toast(`Could not understand “${text}”`);
  const vc = verseCount(r.b, r.c);
  openChapter(r.b, r.c, { start: Math.min(r.v1, vc || 1), end: Math.min(r.v2 || vc || 1, vc || 1) });
  $("ref-input").blur();
}
function addFromText(p) {
  const m = p.match(SERMON_RE);
  if (m) {
    if (!m[2]) return false;  // a sermon needs paragraph numbers
    const v1 = +m[2];
    addItem({ kind: "sermon", code: m[1].toUpperCase(), v1, v2: Math.max(v1, +(m[3] || v1)) });
    return true;
  }
  const r = parsePassage(p);
  if (!r || !verseCount(r.b, r.c)) return false;
  const vc = verseCount(r.b, r.c);
  addItem({ kind: "bible", b: r.b, c: r.c, v1: Math.min(r.v1, vc), v2: Math.min(r.v2 || vc, vc) });
  return true;
}

// ---------------------------------------------------------------- connecting to a laptop
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const b64enc = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64dec = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
const toService = (it) => it.kind === "sermon" ? { kind: "sermon", code: it.code, v1: it.v1, v2: it.v2 }
                                               : { kind: "bible", b: it.b, c: it.c, v1: it.v1, v2: it.v2 };
const fromService = (d) => d.kind === "sermon" ? { kind: "sermon", code: d.code, v1: d.v1, v2: d.v2 }
                                               : { kind: "bible", b: d.b, c: d.c, v1: d.v1, v2: d.v2 };
/** A list item with its notes (what travels to the console and back). */
const toPlan = (it) => (isNote(it) ? { kind: "note", text: it.text || "" } : withNote(toService(it), it.note));
const fromPlan = (d) => (isNote(d) ? { kind: "note", text: d.text || "" } : withNote(fromService(d), d.note));

/** The laptop's service list with the notes of the prepared list (plan) in their places. A free note
    follows the passage it followed in the plan; a note on a passage stays on that passage (a passage
    in the list twice: counted in order). Notes whose passage is no longer there come last.
    Returns [{item, planned}] for passages (planned: the plan's passage with its note) and [{note}]. */
const refKey = (it) => it.kind === "sermon" ? `S ${String(it.code).toUpperCase()} ${it.v1}-${it.v2 || it.v1}`
                                           : `B ${it.b} ${it.c} ${it.v1}-${it.v2 || it.v1}`;
function weave(service, plan) {
  const counter = () => { const seen = {}; return (it) => { const k = refKey(it); seen[k] = (seen[k] || 0) + 1; return `${k}#${seen[k]}`; }; };
  const free = new Map(), planned = new Map();
  let anchor = "^", anchorOf = counter();
  for (const it of plan) {
    if (isNote(it)) { if (!free.has(anchor)) free.set(anchor, []); free.get(anchor).push(it); }
    else { anchor = anchorOf(it); planned.set(anchor, it); }
  }
  const out = [], used = new Set();
  const notesAt = (a) => { used.add(a); for (const n of free.get(a) || []) out.push({ note: n }); };
  anchorOf = counter();
  notesAt("^");
  for (const it of service) {
    const a = anchorOf(it);
    out.push({ item: it, planned: planned.get(a) });
    planned.delete(a);
    notesAt(a);
  }
  for (const [a, notes] of free) if (!used.has(a)) for (const n of notes) out.push({ note: n });
  for (const p of planned.values()) if (p.note) out.push({ note: p, orphan: itemLabel(p) });
  return out;
}
/** The woven list as list items again (a note whose passage is gone becomes a free note). */
const wovenItems = (service, plan) => weave(service, plan).map((w) =>
  w.item ? withNote(fromService(w.item), w.planned && w.planned.note)
    : w.orphan ? { kind: "note", text: `<h3>${esc(w.orphan)}</h3>${noteHtml(w.note.note)}` } : { kind: "note", text: w.note.text });

function showDialog(html, onMount) {
  document.body.classList.remove("outline-open");
  $("dialog").innerHTML = html;
  $("overlay").classList.remove("hidden");
  if (onMount) onMount($("dialog"));
}
function closeDialog() {
  $("overlay").classList.add("hidden"); $("dialog").innerHTML = ""; $("dialog").className = "dialog";
  document.body.classList.remove("outline-open");
}

/** Is this page served by Bible Present on a laptop? (Then it has an /api/info.) */
async function detectLaptop() {
  if (location.protocol !== "http:") return null;  // the GitHub version is https
  try {
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 4000);
    const res = await fetch("api/info", { cache: "no-store", signal: ctl.signal });
    const info = res.ok ? await res.json() : null;
    return info && info.app === "biblepresent" ? info : null;
  } catch { return null; }
}

async function answers(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 2000);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctl.signal });
    const info = res.ok ? await res.json() : null;
    return Boolean(info && info.app === "biblepresent");
  } catch { return false; } finally { clearTimeout(timer); }
}

async function initConnected(info) {
  // Reached by name (biblepresent.local)? Continue on the laptop's IP address: an iPad looks the
  // name up again every few minutes, which can hold commands up for seconds.
  // Only to an address that answers: a laptop can also have VPN or VMware addresses the iPad cannot reach.
  if (location.hostname.endsWith(".local") && info.ips && info.ips.length) {
    const port = info.port || location.port;
    for (const ip of info.ips.slice(0, 3)) {
      if (await answers(`http://${ip}:${port}/api/info`)) {
        location.replace(`http://${ip}:${port}/${location.hash}`);
        return new Promise(() => {});  // the page is being replaced
      }
    }
  }
  conn.info = info;
  document.body.classList.add("connected");
  API = "mh/";
  $("conn-name").textContent = info.name || "Laptop";
  $("brand-sub").textContent = "PRESENTING";
  $("addbar-add").textContent = "＋ Add to service list";
  $("list-empty").innerHTML = "The laptop's service list is empty. Choose verses or sermon paragraphs on the left " +
    "and tap <b>Add to service list</b>, or <b>Go live</b> to show them right away.";
  // what the list app sent along: #handoff=…&ret=…&pin=…
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("ret")) { conn.ret = h.get("ret"); store.set("return", conn.ret); } else conn.ret = store.get("return", null);
  if (h.get("handoff")) { try { conn.handoff = b64dec(h.get("handoff")); } catch { } }
  if (conn.handoff && conn.handoff.id) {  // the list with its notes, for the console and the way back
    store.set("returnList", { id: conn.handoff.id, name: conn.handoff.name, plan: conn.handoff.plan || conn.handoff.items });
  }
  conn.backup = h.get("backup");    // all lists, for the laptop to keep
  conn.restore = h.get("restore");  // asked for a backup from the laptop (this iPad's id)
  conn.retList = store.get("returnList", null);
  $("back-btn").classList.toggle("hidden", !conn.ret);
  history.replaceState(null, "", location.pathname);  // keep the code etc. out of the address bar
  conn.token = store.get("token", null);
  if (conn.token && (await fetch("api/state", { headers: { "X-BP-Token": conn.token } })).ok) startConnected();
  else askCode(h.get("pin") || "");
}

function askCode(prefill, error) {
  showDialog(`<h2>Connect to ${esc(conn.info.name)}</h2>
    <p>Enter the 4-digit code shown on the laptop (Bible Present → <b>iPad</b>).</p>
    <input id="pin" class="pin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4"
           autocomplete="one-time-code" value="${esc(prefill)}">
    <p>You only need to do this once for this laptop.</p>
    <div class="error">${esc(error || "")}</div>
    <div class="buttons"><button id="pin-ok" class="primary">Connect</button></div>`, (d) => {
    const input = d.querySelector("#pin");
    const go = async () => {
      const pin = input.value.trim();
      const res = await fetch("api/pair", { method: "POST", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ pin }) }).catch(() => null);
      if (res && res.ok) {
        conn.token = (await res.json()).token;
        store.set("token", conn.token);
        closeDialog();
        startConnected();
      } else askCode("", res ? "That code is not right. Look at the laptop: Bible Present → iPad." : "The laptop does not answer.");
    };
    d.querySelector("#pin-ok").onclick = go;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    if (prefill.length === 4 && !error) go(); else input.focus();
  });
}

/** Live updates from the laptop. iPadOS can silently stop such a stream (screen dimmed, app in the
    background, Wi-Fi power saving), so the laptop sends a heartbeat every few seconds and a
    watchdog reconnects as soon as it stays away. */
function applyState(s) {
  if (!s || (conn.remote && s.version < conn.remote.version)) return;  // never go back to older news
  const first = !conn.remote;
  conn.remote = s;
  conn.lastNews = Date.now();
  $("conn").classList.remove("lost");
  renderRemote();
  if (first && conn.handoff) offerHandoff();
}
function openStream() {
  if (conn.events) conn.events.close();
  conn.events = new EventSource(`api/events?token=${encodeURIComponent(conn.token)}`);
  conn.events.onmessage = (e) => applyState(JSON.parse(e.data));
  conn.events.addEventListener("ping", () => { conn.lastNews = Date.now(); $("conn").classList.remove("lost"); });
  conn.events.onerror = () => { $("conn").classList.add("lost"); refreshState(); };
}
async function refreshState() {
  try {
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 4000);
    const res = await fetch("api/state", { headers: { "X-BP-Token": conn.token }, cache: "no-store", signal: ctl.signal });
    if (res.status === 401) {  // the laptop made a new code
      if (conn.events) conn.events.close();
      store.set("token", null);
      askCode("", "The code on the laptop was changed. Enter the new code.");
      return;
    }
    if (res.ok) applyState(await res.json());
  } catch { $("conn").classList.add("lost"); }
}
function startConnected() {
  conn.lastNews = Date.now();
  openStream();
  refreshState();
  clearInterval(conn.watchdog);
  conn.watchdog = setInterval(() => {  // no news for 9 s: the stream is stale, reconnect
    if (document.visibilityState === "visible" && Date.now() - conn.lastNews > 9000) {
      $("conn").classList.add("lost");
      openStream();
      refreshState();
      conn.lastNews = Date.now() - 5000;  // try again in a few seconds if this does not help
    }
  }, 3000);
  if (!conn.visibilityHooked) {
    conn.visibilityHooked = true;
    document.addEventListener("visibilitychange", () => {  // back in the app: catch up at once
      if (document.visibilityState === "visible" && conn.token) { openStream(); refreshState(); }
    });
  }
  loadSermonIndex();
  if (conn.backup) sendBackup();
  if (conn.restore) showLaptopBackups();
}

async function sendBackup() {
  const packed = conn.backup;
  conn.backup = null;
  try {
    const res = await fetch("api/backup", { method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-BP-Token": conn.token || "" },
      body: JSON.stringify(await unpack(packed)) });
    if (res.ok) store.set("backedUp", Date.now());
  } catch { /* the console works without it */ }
}
const authGet = (path) => fetch(path, { headers: { "X-BP-Token": conn.token || "" }, cache: "no-store" });
async function showLaptopBackups() {
  const mine = conn.restore;
  conn.restore = null;
  let backups;
  try {
    const res = await authGet("api/backups");
    if (res.status === 404) return toast("This laptop needs Bible Present 1.6.2 or later for backups.");
    backups = await res.json();
  } catch { return toast("The laptop does not answer."); }
  showDialog(`<h2>Backups on this laptop</h2>
    <p>Choose a backup: its lists are added to your lists on the iPad. Nothing is overwritten.</p>
    <div class="menu" id="bk"></div>
    <div class="buttons"><button id="bk-close" class="ghost">Cancel</button></div>`, (d) => {
    d.classList.add("wide");
    const box = d.querySelector("#bk");
    if (!backups.length) box.append(el("p", "", "There are no backups on this laptop yet."));
    for (const b of backups) {
      const btn = el("button", "backup-row");
      const when = new Date(b.saved).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      const names = b.lists.map((l) => l.name || "List").join(", ");
      btn.innerHTML = `<b>${esc(when)}</b>${b.device === mine ? " · this iPad" : ""} · ${b.lists.length} list${b.lists.length === 1 ? "" : "s"}
        <span class="hint">${esc(names.length > 140 ? names.slice(0, 140) + "…" : names)}</span>`;
      btn.onclick = async () => {
        try {
          const data = await (await authGet(`api/backup?device=${encodeURIComponent(b.device)}&name=${encodeURIComponent(b.name)}`)).json();
          location.href = `${conn.ret}#restore=${await pack({ lists: data.lists })}`;
        } catch { toast("That backup could not be read."); }
      };
      box.append(btn);
    }
    d.querySelector("#bk-close").onclick = closeDialog;
  });
}

/** A command for the laptop. Never waits long (a slow request must not hold up the next one),
    and checks the result straight away instead of relying on the live stream alone. */
async function cmd(action, extra = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    const res = await fetch("api/cmd", { method: "POST", signal: ctl.signal, cache: "no-store",
      headers: { "Content-Type": "application/json", "X-BP-Token": conn.token || "" },
      body: JSON.stringify({ action, ...extra }) });
    if (res.status === 401) askCode("", "Enter the code shown on the laptop.");
    else if (!res.ok) toast("The laptop did not accept that.");
    else setTimeout(refreshState, 150);
  } catch {
    toast("The laptop does not answer. Same Wi-Fi?");
    openStream();
  } finally { clearTimeout(timer); }
}

function offerHandoff() {
  const h = conn.handoff;
  conn.handoff = null;
  if (!h || !h.items || !h.items.length) return;
  showDialog(`<h2>Send your list to the laptop?</h2>
    <p>“${esc(h.name || "List")}” — ${h.items.length} item${h.items.length === 1 ? "" : "s"}.
       The laptop's service list now has ${conn.remote.service.length}.</p>
    <div class="buttons stacked">
      <button id="h-no" class="ghost">Not now</button>
      <button id="h-replace" class="ghost">Replace the laptop's list</button>
      <button id="h-add" class="primary">Add to the end of the laptop's list</button></div>`, (d) => {
    const send = (mode) => { cmd("list", { mode, name: h.name, service: h.items.map(toService) }); closeDialog(); toast("List sent to the laptop"); };
    d.querySelector("#h-add").onclick = () => send("append");
    d.querySelector("#h-replace").onclick = () => send("replace");
    d.querySelector("#h-no").onclick = closeDialog;
  });
}

/** Back to the list app (on GitHub), taking the laptop's service list along, with the notes. */
function backToLists() {
  const list = conn.retList || {};
  const items = wovenItems(conn.remote ? conn.remote.service : [], consolePlan());
  location.href = `${conn.ret}#return=${b64enc({ id: list.id, name: list.name, items, woven: true,
                                                 backedUp: store.get("backedUp", 0) })}`;
}
const consolePlan = () => (conn.retList && conn.retList.plan) || [];
/** Notes in the console: edited here, kept on this iPad until going back to the lists. */
function consoleNote(w) {
  if (w.item && !w.planned) return { heading: w.item.label, sub: w.item.snippet || "" };  // added on the laptop: no note
  const plan = consolePlan(), free = !w.item && !w.orphan, n = w.item ? w.planned : w.note;
  const keep = () => store.set("returnList", conn.retList);
  const label = w.item ? w.item.label : w.orphan;
  return {
    target: n, title: free ? "Note" : label, html: free ? n.text : n.note,
    heading: free ? null : label, sub: w.item ? w.item.snippet || "" : "",
    passage: free ? null : w.item ? fromService(w.item) : n,
    save: (h) => { if (free) n.text = h; else n.note = h; keep(); },
    remove: () => {
      if (!free) delete n.note;
      else if (plan.includes(n)) plan.splice(plan.indexOf(n), 1);
      keep();
    },
  };
}
const editConsoleNote = (w) => openNoteEditor(consoleNote(w));
function openAllConsoleNotes() {
  if (!conn.remote) return;
  openNoteEditor({ all: true, title: "All notes", sessions: weave(conn.remote.service, consolePlan()).map(consoleNote),
                   exportList: () => ({ name: (conn.retList && conn.retList.name) || "Service list",
                                        items: wovenItems(conn.remote.service, consolePlan()).map(fromPlan) }) });
}

function renderRemote() {
  const r = conn.remote, ul = $("list-items");
  if (!r) return;
  paintLive();
  // The iPad asked for this (item, Next, Previous): show it on the left too, once the laptop has moved
  const f = conn.follow;
  if (f && r.live.pos && (JSON.stringify(r.live.pos) !== f.before || Date.now() > f.until)) {
    conn.follow = null;
    followLive(r.live.pos);
  }
  if (dragging) return;  // the list is redrawn when the drag ends
  ul.innerHTML = "";
  let i = 0;
  for (const w of weave(r.service, consolePlan())) {
    if (!w.item) {  // a note between the passages: only on this iPad, never on the laptop
      const li = el("li", "note");
      li.classList.toggle("editing", !!noteSession && noteSession.target === w.note);
      const body = el("div", "body");
      body.append(el("div", "note-text", w.orphan ? `${w.orphan}: ${noteText(w.note.note)}` : noteText(w.note.text) || "Empty note"));
      body.onclick = () => editConsoleNote(w);
      li.append(el("span", "grip ghost-grip", "⠿"), el("span", "num", ""), body);
      ul.appendChild(li);
      continue;
    }
    const it = w.item;
    i++;
    const li = el("li");
    li.dataset.id = it.id;
    li.classList.toggle("editing", !!noteSession && !!w.planned && noteSession.target === w.planned);
    li.classList.toggle("live", !!(r.live.on_air && r.live.item === it.id));
    li.classList.toggle("done", !!it.done);
    const grip = el("span", "grip", "⠿");
    grip.addEventListener("pointerdown", (e) => startDrag(e, li, grip, (from, to) => {
      const rows = [...ul.children];  // notes are rows too: take the new order of the passages
      rows.splice(to, 0, rows.splice(from, 1)[0]);
      const order = rows.filter((x) => x.dataset.id).map((x) => x.dataset.id);
      r.service.sort((a, b) => order.indexOf(String(a.id)) - order.indexOf(String(b.id)));  // show it at once, then tell the laptop
      cmd("reorder", { ids: r.service.map((x) => x.id) });
    }));
    const body = el("div", "body");
    body.append(el("div", "label", it.label), el("div", "snip", it.snippet || ""));
    if (w.planned && w.planned.note) body.append(noteLine(w.planned.note, () => editConsoleNote(w)));
    body.title = "Tap to put this on the screen";
    body.onclick = () => { followNext(); cmd("present_item", { id: it.id }); };
    const del = el("button", "del", "✕");
    del.title = "Remove from the service list";
    del.onclick = () => cmd("remove", { id: it.id });
    li.append(grip, el("span", "num", it.done && !li.classList.contains("live") ? "✓" : i), body, del);
    ul.appendChild(li);
  }
  $("list-empty").classList.toggle("hidden", r.service.length > 0);
  $("remote-count").textContent = r.service.length || "";
  $("mode-count").textContent = r.service.length || "";

  const L = r.live, card = $("live-card");
  card.classList.toggle("on", !!L.on_air);
  card.classList.toggle("blank", !!(L.ref && !L.on_air));
  $("live-badge").textContent = L.on_air ? "● LIVE" : L.blank ? "BLANK" : L.hidden ? "HIDDEN" : "NOT LIVE";
  $("live-ref").textContent = L.ref || "";
  $("live-text").textContent = L.on_air && L.parts.length ? L.parts[0].text
    : L.blank ? "The screen is blank. Tap Show text to bring it back."
    : L.hidden ? "The output screen on the laptop is hidden."
    : "Nothing on screen yet. Tap an item, or choose a verse and tap Go live.";
  const blank = $("ctl-blank");
  blank.textContent = L.blank ? "Show text" : "Blank";
  blank.classList.toggle("on", !!L.blank);
  const seg = $("ctl-show");
  seg.innerHTML = "";
  for (const mode of ["both", "top", "bottom"]) {
    const b = el("button", r.show === mode ? "active" : "", (r.show_labels || {})[mode] || mode);
    b.onclick = () => cmd("show", { mode });
    seg.appendChild(b);
  }
}

/** Remember where the screen is now; the left side follows when it changes (or within 2 s). */
function followNext() {
  const pos = conn.remote && conn.remote.live.pos;
  conn.follow = { before: JSON.stringify(pos || null), until: Date.now() + 2000 };
}

/** The coral frame on the verse / paragraph that is on the laptop's screen. */
function paintLive() {
  const r = conn.remote;
  const pos = r && r.live.on_air ? r.live.pos : null;
  for (const li of $("verse-list").children) {
    const n = +li.dataset.n;
    li.classList.toggle("live", !!(pos && pos.kind === "bible" && pos.b === state.book &&
      pos.verses.some(([c, v]) => c === state.chapter && v === n)));
  }
  for (const li of $("para-list").children) {
    li.classList.toggle("live", !!(pos && pos.kind === "sermon" && state.sermon &&
      state.sermon.code === pos.code && +li.dataset.n === pos.num));
  }
}
/** Show the live passage on the left (after tapping a list item, Next or Previous on the iPad). */
async function followLive(pos) {
  if (pos.kind === "bible") {
    const [c, v] = pos.verses[0];
    setTab("bible");
    if (state.book !== pos.b || state.chapter !== c) openChapter(pos.b, c);
    scrollToItem("verse-list", v);
  } else {
    setTab("sermons");
    if (!state.sermon || state.sermon.code !== pos.code) await openSermon(pos.code);
    scrollToItem("para-list", pos.num);
  }
  paintLive();
}

/* Preparing (GitHub version): open the laptop's page, taking the current list along. */
function connectDialog(restore = false) {
  const list = currentList();
  const saved = store.get("laptop", "biblepresent.local:8080");
  showDialog(`<h2>${restore ? "Restore from the laptop" : "Connect to the laptop"}</h2>
    ${restore ? `<p>The laptop keeps a backup of your lists and notes every time you connect.
       Choose one there; its lists are added to yours (nothing is overwritten).</p>` : ""}
    <p>The iPad and the laptop must be on the <b>same Wi-Fi</b>, and on the laptop
       Bible Present → <b>iPad</b> must be switched on.</p>
    <input id="addr" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" value="${esc(saved)}">
    <p>The laptop shows this address (and a QR code you can also scan with the camera).</p>
    ${list.items.length && !restore ? `<p><label><input type="checkbox" id="take" checked> Take “${esc(list.name || "this list")}” along
      (${countText(list.items)})</label></p>` : ""}
    <div class="buttons"><button id="c-cancel" class="ghost">Cancel</button>
      <button id="c-go" class="primary">Connect</button></div>`, (d) => {
    d.querySelector("#c-cancel").onclick = closeDialog;
    d.querySelector("#c-go").onclick = async () => {
      const addr = d.querySelector("#addr").value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!addr) return;
      store.set("laptop", addr);
      const params = new URLSearchParams({ ret: location.href.split("#")[0] });
      const take = d.querySelector("#take");
      if (take && take.checked) {
        // items: the passages (all a laptop up to 1.5.1 understands); plan: the whole list with the notes
        params.set("handoff", b64enc({ id: list.id, name: list.name, items: passages(list.items).map(toService),
                                       plan: list.items.map(toPlan) }));
      }
      if (restore) params.set("restore", deviceId());
      else if (hasLists()) {  // the automatic backup (a laptop up to 1.6 ignores it)
        try { params.set("backup", await pack({ device: deviceId(), saved: new Date().toISOString(), lists: state.lists })); } catch { }
      }
      location.href = `http://${addr}/#${params}`;
    };
  });
}

/** Back from the laptop: the list comes back as it is on the laptop now (or the lists of a backup). */
async function handleReturn() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("restore")) {
    history.replaceState(null, "", location.pathname);
    try { importLists((await unpack(h.get("restore"))).lists || []); } catch { toast("That backup could not be read."); }
    return;
  }
  if (!h.get("return")) return;
  history.replaceState(null, "", location.pathname);
  let data;
  try { data = b64dec(h.get("return")); } catch { return; }
  if (data.backedUp) store.set("laptopBackup", data.backedUp);
  let list = state.lists.find((l) => l.id === data.id);
  if (!list) { list = newList(data.name || "From the laptop"); state.lists.push(list); }
  if (list.items.some((it) => isNote(it) || it.note)) trashPut({ type: "list", list, why: "the version before the laptop" });
  // a console of a laptop up to 1.5.1 sends the passages only: put this list's notes back in between
  list.items = data.woven ? (data.items || []).map(fromPlan) : wovenItems(data.items || [], list.items);
  state.current = list.id;
  saveLists();
  renderList();
  toast(`“${list.name || "List"}” updated from the laptop (${countText(list.items)})`);
}
function countText(items) {
  const p = passages(items).length, n = items.length - p;
  return `${p} passage${p === 1 ? "" : "s"}` + (n ? `, ${n} note${n === 1 ? "" : "s"}` : "");
}

// ---------------------------------------------------------------- tabs & modes
function setTab(tab) {
  state.tab = tab;
  for (const b of document.querySelectorAll(".tabs button")) b.classList.toggle("active", b.dataset.tab === tab);
  $("bible-pane").classList.toggle("hidden", tab !== "bible");
  $("sermons-pane").classList.toggle("hidden", tab !== "sermons");
  paintSelection();
}
function setMode(mode) {
  $("layout").dataset.mode = mode;
  for (const b of document.querySelectorAll(".mode-switch button")) b.classList.toggle("active", b.dataset.mode === mode);
}

// ---------------------------------------------------------------- start
async function init() {
  const laptop = await detectLaptop();  // opened from a laptop running Bible Present?
  if (laptop && laptop.bibles && laptop.bibles.length) {
    BIBLES = laptop.bibles.map((b) => ({ id: b.id, name: b.name, lang: NAMES[b.lang] ? b.lang : "en" }));
  } else if (!laptop) BIBLES = [...BIBLES, ...ownBibles()];
  if (!BIBLES.find((b) => b.id === state.bibleId)) state.bibleId = BIBLES[0].id;
  const bs = $("bible-select");
  for (const b of BIBLES) { const o = el("option", "", b.id); o.value = b.id; o.title = b.name; bs.appendChild(o); }
  bs.value = state.bibleId;
  bs.onchange = async () => { await loadBible(bs.value); openChapter(state.book, state.chapter); renderList(); };
  $("book-select").onchange = (e) => openChapter(+e.target.value, 1);
  $("chapter-select").onchange = (e) => openChapter(state.book, +e.target.value);
  $("ref-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); onRefInput(); } });
  for (const id of ["ref-input", "sermon-find", "sermon-search", "para-find"]) addClearButton($(id));
  for (const b of document.querySelectorAll(".tabs button")) b.onclick = () => setTab(b.dataset.tab);
  for (const b of document.querySelectorAll(".mode-switch button")) b.onclick = () => setMode(b.dataset.mode);
  $("addbar-add").onclick = addSelection;
  $("addbar-clear").onclick = () => { state.sel = null; paintSelection(); };
  $("sermon-find").addEventListener("input", () => renderSermonList());
  $("sermon-search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = $("sermon-search").value.trim();
    if (t) { $("sermon-search").blur(); searchSermons(t); } else renderSermonList();
  });
  $("sermon-search").addEventListener("search", () => { if (!$("sermon-search").value.trim()) renderSermonList(); });
  $("year-select").onchange = () => {
    const t = $("sermon-search").value.trim();
    if (state.hits && t) searchSermons(t); else renderSermonList();
  };
  $("para-find").addEventListener("input", applyParaFind);
  $("para-find").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); $("para-find").blur(); firstParaMatch(); }
  });
  initNoteEditor();
  $("list-select").onchange = (e) => { closeNoteEditor(); state.current = e.target.value; saveLists(); renderList(); };
  $("list-name").addEventListener("input", (e) => { currentList().name = e.target.value; saveLists(); renderLists(); });
  $("list-new").onclick = () => { closeNoteEditor(); const l = newList(); state.lists.push(l); state.current = l.id; saveLists(); renderList(); $("list-name").focus(); };
  $("list-delete").onclick = () => {
    const l = currentList();
    if (l.items.length && !confirm(`Delete “${l.name || "this list"}” (${countText(l.items)})?`)) return;
    closeNoteEditor();
    if (l.items.length) trashPut({ type: "list", list: l });
    state.lists = state.lists.filter((x) => x.id !== l.id);
    if (!state.lists.length) state.lists.push(newList());
    state.current = state.lists[0].id;
    saveLists(); renderList();
  };
  $("list-note").onclick = addFreeNote;
  $("list-all-notes").onclick = openAllNotes;
  $("remote-notes").onclick = openAllConsoleNotes;
  $("list-menu").onclick = showMenu;
  $("help-btn").onclick = showHelp;
  $("list-outline").onclick = () => showOutline();
  $("note-word").onclick = () => exportAllNotes("word");
  $("note-pdf").onclick = () => exportAllNotes("pdf");
  $("share-file").onclick = shareFile;
  $("share-text").onclick = shareText;
  $("connect-btn").onclick = connectDialog;
  $("back-btn").onclick = backToLists;
  $("addbar-live").onclick = presentSelection;
  $("ctl-next").onclick = () => { followNext(); cmd("next"); };
  $("ctl-prev").onclick = () => { followNext(); cmd("prev"); };
  $("ctl-blank").onclick = () => cmd("blank");

  await loadBible(state.bibleId);
  openChapter(state.book, state.chapter);
  if (laptop) {
    await initConnected(laptop);  // becomes the presenting console of that laptop
    return;
  }
  renderList();
  if (/[#&](return|restore)=/.test(location.hash)) await handleReturn(); else remindBackup();
  loadSermonIndex();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
init();
