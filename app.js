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
async function loadBible(id) {
  if (!bibleCache[id]) {
    $("verse-list").innerHTML = '<li class="info">Loading the Bible…</li>';
    const res = await fetch(`data/${id}.json`);
    bibleCache[id] = await res.json();
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
function cleanText(t) {
  return (t || "").replace(/[\u0002\u0003\u001f]/g, "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ")
    .replace(/\s*@@\s*/g, "\n").trim();
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
function applyParaFind() {
  if (!state.sermon) return;
  const terms = markTerms();
  let shown = 0, total = 0;
  for (const li of $("para-list").children) {
    if (!li.dataset.n) continue;
    const text = li.dataset.text;
    const ok = paraMatches(Number(li.dataset.n), text);
    li.classList.toggle("hidden", !ok);
    li.querySelector(".t").innerHTML = markHtml(text, terms);
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
    snip.innerHTML = safe.replace(/\u0002/g, "<mark>").replace(/\u0003/g, "</mark>").replace(/[\u001f\r\n]+/g, " ").replace(/@@/g, " ");
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
      const edit = el("button", "del", "✎");
      edit.title = "Note on this passage";
      edit.onclick = () => editListNote(it);
      buttons.push(edit);
    }
    const del = el("button", "del", "✕");
    del.title = "Remove";
    del.onclick = () => {
      if (noteSession && noteSession.target === it) { noteSession = null; $("note-pane").classList.add("hidden"); }
      list.items.splice(i, 1); saveLists(); renderList();
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
const NOTE_TAGS = new Set(["DIV", "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "UL", "OL", "LI", "H1", "H2", "H3"]);
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

/** The note that is open in the editor on the left: {target, title, html, passage, save, remove}. */
let noteSession = null;
let noteRender = 0;
function openNoteEditor(s) {
  closeNoteEditor(true);
  noteSession = s;
  s.backMode = $("layout").dataset.mode;
  $("note-title").textContent = s.title;
  const ed = $("note-editor");
  ed.innerHTML = cleanNote(noteHtml(s.html)) || "<div><br></div>";
  showNotePassage(s);
  $("note-pane").classList.remove("hidden");
  setMode("browse");  // phones: the editor is on the left side
  ed.scrollTop = 0;
  if (s.focus) placeCaretAtEnd(ed);
  renderList();       // marks the note that is open
}
/** Done (or another note opened): an empty note is removed. */
function closeNoteEditor(switching) {
  const s = noteSession;
  if (!s) return;
  noteSession = null;
  if (!noteText($("note-editor").innerHTML)) s.remove();
  $("note-pane").classList.add("hidden");
  $("note-editor").blur();
  if (!switching) { setMode(s.backMode || "browse"); renderList(); }
}
function deleteOpenNote() {
  const s = noteSession;
  if (!s) return;
  if (noteText($("note-editor").innerHTML) && !confirm("Delete this note?")) return;
  s.remove();
  $("note-editor").innerHTML = "";
  closeNoteEditor();
}
function noteChanged() {
  if (!noteSession) return;
  noteSession.save(cleanNote($("note-editor").innerHTML));
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
  ed.focus();
  const r = document.createRange();
  r.selectNodeContents(ed);
  r.collapse(false);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

// the toolbar
function editorBlock() {
  const sel = getSelection(), ed = $("note-editor");
  let n = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
  const found = {};
  while (n && n !== ed) {
    if (n.nodeType === 1) {
      if (!found.block && /^(DIV|P|H1|H2|H3|LI)$/.test(n.tagName)) found.block = n;
      if (!found.list && /^(UL|OL)$/.test(n.tagName)) found.list = n;
    }
    n = n.parentNode;
  }
  return n === ed ? found : {};
}
function applyList(kind) {
  const { list } = editorBlock();
  if (kind === "check") {
    if (list && list.classList.contains("checklist")) { document.execCommand("insertUnorderedList"); return; }  // off
    if (!list || list.tagName === "OL") document.execCommand("insertUnorderedList");
    const now = editorBlock().list;
    if (now) now.classList.add("checklist");
  } else if (kind === "ul" && list && list.classList.contains("checklist")) list.classList.remove("checklist");
  else document.execCommand(kind === "ol" ? "insertOrderedList" : "insertUnorderedList");
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
  for (const b of $("note-tools").querySelectorAll("button")) {
    let on = false;
    if (b.dataset.cmd) { try { on = document.queryCommandState(b.dataset.cmd); } catch { } }
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
  const sel = getSelection(), node = sel.anchorNode, ed = $("note-editor");
  if (!node || node.nodeType !== 3 || node.previousSibling) return;
  const m = node.data.replace(/ /g, " ").match(/^(?:([-*•])|(1[.)])|(\[\]))\s$/);
  const parent = node.parentNode;
  if (!m || parent === ed || !ed.contains(parent) || !/^(DIV|P)$/.test(parent.tagName) || parent.closest("ul, ol")) return;
  if (node.nextSibling && !(node.nextSibling.tagName === "BR" && !node.nextSibling.nextSibling)) return;
  const list = document.createElement(m[2] ? "ol" : "ul");
  if (m[3]) list.className = "checklist";
  const li = document.createElement("li");
  li.innerHTML = "<br>";
  list.append(li);
  parent.replaceWith(list);
  const r = document.createRange();
  r.setStart(li, 0);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}
function initNoteEditor() {
  const ed = $("note-editor");
  try { document.execCommand("defaultParagraphSeparator", false, "div"); document.execCommand("styleWithCSS", false, false); } catch { }
  ed.addEventListener("input", (e) => { autoList(e); noteChanged(); updateToolbar(); });
  ed.addEventListener("paste", (e) => {  // pasted text comes in as text (no fonts or colours from elsewhere)
    e.preventDefault();
    document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
  });
  ed.addEventListener("click", (e) => {  // tap the circle of a checklist item: done / not done
    const li = e.target.closest && e.target.closest("ul.checklist > li");
    if (li && e.clientX - li.getBoundingClientRect().left < 30) { li.classList.toggle("checked"); noteChanged(); }
  });
  document.addEventListener("selectionchange", updateToolbar);
  for (const b of $("note-tools").querySelectorAll("button")) {
    b.addEventListener("pointerdown", (e) => e.preventDefault());  // keep the cursor (and keyboard) in the note
    b.onclick = () => {
      if (!ed.contains(getSelection().anchorNode)) placeCaretAtEnd(ed);
      if (b.dataset.cmd) document.execCommand(b.dataset.cmd);
      else if (b.dataset.block) applyBlock(b.dataset.block);
      else applyList(b.dataset.list);
      noteChanged();
      updateToolbar();
    };
  }
  $("note-done").onclick = () => closeNoteEditor();
  $("note-delete").onclick = deleteOpenNote;
}

/** A free note (kind "note") or the note on a passage of the list being prepared. */
function editListNote(it) {
  const list = currentList(), free = isNote(it);
  const html = free ? it.text : it.note;
  openNoteEditor({
    target: it, title: free ? "Note" : itemLabel(it), html, passage: free ? null : it, focus: !html,
    save: (h) => { if (free) it.text = h; else it.note = h; saveLists(); },
    remove: () => {
      if (!free) delete it.note;
      else if (list.items.includes(it)) list.items.splice(list.items.indexOf(it), 1);
      saveLists();
    },
  });
}
function addFreeNote() {
  const it = { kind: "note", text: "" };
  currentList().items.push(it);
  saveLists(); renderList();
  $("list-items").scrollTop = $("list-items").scrollHeight;
  editListNote(it);
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
  const file = listAsFile(list);
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: list.name || "Bible Present list" });
      return;
    }
  } catch (e) { if (e.name === "AbortError") return; }
  const a = el("a"); // fallback: download the file
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
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

function showOutline() {
  const list = currentList();
  if (!list.items.length) return toast("The list is empty.");
  showDialog(`<h2>${esc(list.name || "Outline")}</h2>
    <div class="outline" id="outline"></div>
    <div class="buttons"><button id="o-print" class="ghost">Print</button>
      <button id="o-share" class="ghost">Share</button><button id="o-close" class="primary">Close</button></div>`, (d) => {
    d.classList.add("wide");
    d.querySelector("#o-close").onclick = closeDialog;
    d.querySelector("#o-share").onclick = () =>
      sendText(outlineText(list), list.name || "Outline", "Copied the outline.");
    d.querySelector("#o-print").onclick = () => {
      document.body.classList.add("printing");
      window.print();
      setTimeout(() => document.body.classList.remove("printing"), 500);
    };
    renderOutline(list);
  });
  // sermon texts that are not here yet: load them, then show them
  const missing = passages(list.items).filter((it) => !passageParas(it));
  Promise.all(missing.map(loadSermonParas)).then(() => { if (missing.length) renderOutline(list); });
}
async function loadSermonParas(it) {
  if (it.kind !== "sermon") return;
  try {
    const data = await api(`${sermonLang(it)}/sermons/${it.code}/blocks`);
    paraCache[`${sermonLang(it)}/${it.code}`] = (data.blocks || []).map((b) => [b.blockNumber, cleanText(b.blockText)]);
  } catch { /* offline: the short preview stays */ }
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
    sec.append(el("div", "o-ref", itemLabel(it)));
    const paras = passageParas(it);
    if (paras) for (const [n, t] of paras) { const p = el("p", "o-text"); p.append(el("span", "n", n), " " + t); sec.append(p); }
    else sec.append(el("p", "o-text", it.snippet || ""));
    if (it.note) sec.append(noteBlock(it.note));
    box.append(sec);
  }
}
function outlineText(list) {
  const lines = [list.name || "Outline", ""];
  for (const it of list.items) {
    if (isNote(it)) { lines.push(noteText(it.text), ""); continue; }
    lines.push(itemLabel(it));
    const paras = passageParas(it);
    if (paras) for (const [n, t] of paras) lines.push(`${n} ${t}`);
    else if (it.snippet) lines.push(it.snippet);
    if (it.note) lines.push(noteText(it.note));
    lines.push("");
  }
  return lines.join("\n").trim();
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
  $("dialog").innerHTML = html;
  $("overlay").classList.remove("hidden");
  if (onMount) onMount($("dialog"));
}
function closeDialog() { $("overlay").classList.add("hidden"); $("dialog").innerHTML = ""; $("dialog").className = "dialog"; }

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
  location.href = `${conn.ret}#return=${b64enc({ id: list.id, name: list.name, items, woven: true })}`;
}
const consolePlan = () => (conn.retList && conn.retList.plan) || [];
/** Notes in the console: edited here, kept on this iPad until going back to the lists. */
function editConsoleNote(w) {
  const plan = consolePlan(), free = !w.item && !w.orphan, n = w.item ? w.planned : w.note;
  const keep = () => store.set("returnList", conn.retList);
  openNoteEditor({
    target: n, title: free ? "Note" : w.item ? w.item.label : w.orphan, html: free ? n.text : n.note,
    passage: free ? null : w.item ? fromService(w.item) : n,
    save: (h) => { if (free) n.text = h; else n.note = h; keep(); },
    remove: () => {
      if (!free) delete n.note;
      else if (plan.includes(n)) plan.splice(plan.indexOf(n), 1);
      keep();
    },
  });
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
function connectDialog() {
  const list = currentList();
  const saved = store.get("laptop", "biblepresent.local:8080");
  showDialog(`<h2>Connect to the laptop</h2>
    <p>The iPad and the laptop must be on the <b>same Wi-Fi</b>, and on the laptop
       Bible Present → <b>iPad</b> must be switched on.</p>
    <input id="addr" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" value="${esc(saved)}">
    <p>The laptop shows this address (and a QR code you can also scan with the camera).</p>
    ${list.items.length ? `<p><label><input type="checkbox" id="take" checked> Take “${esc(list.name || "this list")}” along
      (${countText(list.items)})</label></p>` : ""}
    <div class="buttons"><button id="c-cancel" class="ghost">Cancel</button>
      <button id="c-go" class="primary">Connect</button></div>`, (d) => {
    d.querySelector("#c-cancel").onclick = closeDialog;
    d.querySelector("#c-go").onclick = () => {
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
      location.href = `http://${addr}/#${params}`;
    };
  });
}

/** Back from the laptop: the list comes back as it is on the laptop now. */
function handleReturn() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (!h.get("return")) return;
  history.replaceState(null, "", location.pathname);
  let data;
  try { data = b64dec(h.get("return")); } catch { return; }
  let list = state.lists.find((l) => l.id === data.id);
  if (!list) { list = newList(data.name || "From the laptop"); state.lists.push(list); }
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
    if (!BIBLES.find((b) => b.id === state.bibleId)) state.bibleId = BIBLES[0].id;
  }
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
    state.lists = state.lists.filter((x) => x.id !== l.id);
    if (!state.lists.length) state.lists.push(newList());
    state.current = state.lists[0].id;
    saveLists(); renderList();
  };
  $("list-note").onclick = addFreeNote;
  $("list-outline").onclick = showOutline;
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
  handleReturn();
  loadSermonIndex();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
init();
