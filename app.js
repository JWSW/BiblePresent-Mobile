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
function renderSermonList() {
  state.hits = null;
  const ul = $("sermon-list");
  const words = fold($("sermon-find").value).split(/\s+/).filter(Boolean);
  const codes = Object.keys(state.sermonIndex).sort((a, b) => (a.startsWith("CAB") - b.startsWith("CAB")) || a.localeCompare(b));
  ul.innerHTML = "";
  let shown = 0;
  for (const code of codes) {
    const info = state.sermonIndex[code];
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
async function openSermon(code, num, lang) {
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
  state.sermon = { code, lang, paras: paraCache[key] };
  if (state.sel && state.sel.kind === "sermon" && (state.sel.code !== code || state.sel.lang !== lang)) state.sel = null;
  if (num) state.sel = { kind: "sermon", code, lang, start: num, end: num };
  ol.innerHTML = "";
  for (const [n, text] of state.sermon.paras) {
    const li = el("li");
    li.dataset.n = n;
    li.append(el("span", "n", n), el("span", "t", text));
    li.onclick = () => tapItem({ kind: "sermon", code, lang }, n);
    ol.appendChild(li);
  }
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
    b.onclick = () => { state.sermonLang = l; openSermon(code, state.sel && state.sel.code === code ? state.sel.start : null, l); };
    box.appendChild(b);
  }
}

// full-text search on the Message Hub server (all sermons, no download needed)
async function searchSermons(text, page = 1) {
  const q = (lang, match) => api(`${lang}/sermons/search?` + new URLSearchParams({
    searchText: text, fullText: "false", languageCode: lang, filter: 0, match, pageNumber: page, sermonId: 0 }));
  const ul = $("sermon-list");
  if (page === 1) { ul.innerHTML = '<li class="info">Searching…</li>'; state.hits = { text, page, items: [], total: 0 }; }
  try {
    let match = state.hits.match ?? 1;          // exact phrase first …
    let res = await Promise.all(["nl", "en"].map((l) => q(l, match)));
    if (page === 1 && res.every((r) => !r.pageInfo || !r.pageInfo.totalHits)) {
      match = 0;                                 // … otherwise all the words
      res = await Promise.all(["nl", "en"].map((l) => q(l, match)));
    }
    state.hits.match = match;
    state.hits.page = page;
    state.hits.total = res.reduce((n, r) => n + ((r.pageInfo && r.pageInfo.totalHits) || 0), 0);
    state.hits.more = res.some((r) => r.pageInfo && r.pageInfo.pageCount > page);
    for (const r of res) for (const h of r.quotes || []) state.hits.items.push(h);
  } catch (e) {
    ul.innerHTML = `<li class="info">${navigator.onLine ? "Search failed: " + e.message : "Searching needs internet."}</li>`;
    return;
  }
  renderHits();
}
function renderHits() {
  const h = state.hits, ul = $("sermon-list");
  ul.innerHTML = "";
  $("sermon-list-title").textContent = `FOUND · ${h.total} paragraph${h.total === 1 ? "" : "s"}` +
    (h.match === 0 && h.total ? " (all words)" : "");
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
      openSermon(code, q.blockNumber, q.languageCode);
    };
    ul.appendChild(li);
  }
  if (!h.items.length) ul.innerHTML = '<li class="info">Nothing found.</li>';
  if (h.more) {
    const more = el("li", "more", "More results…");
    more.onclick = () => { more.textContent = "Loading…"; searchSermons(h.text, h.page + 1); };
    ul.appendChild(more);
  }
}

// ---------------------------------------------------------------- the list
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
    const o = el("option", "", `${l.name || "List " + (i + 1)}  (${l.items.length})`);
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
  list.items.forEach((it, i) => {
    if (it.kind === "sermon" && !it.snippet && !fillSnippet.tried.has(it)) {
      fillSnippet.tried.add(it);  // one try per item and session (e.g. offline)
      fillSnippet(it);
    }
    const li = el("li");
    const grip = el("span", "grip", "⠿");
    grip.title = "Drag to change the order";
    grip.addEventListener("pointerdown", (e) => startDrag(e, li, grip, (from, to) => {
      list.items.splice(to, 0, list.items.splice(from, 1)[0]);
      saveLists();
    }));
    const body = el("div", "body");
    body.append(el("div", "label", itemLabel(it)), el("div", "snip", itemSnippet(it)));
    body.onclick = () => showItem(it);
    const del = el("button", "del", "✕");
    del.title = "Remove";
    del.onclick = () => { list.items.splice(i, 1); saveLists(); renderList(); };
    li.append(grip, el("span", "num", i + 1), body, del);
    ul.appendChild(li);
  });
  $("list-empty").classList.toggle("hidden", list.items.length > 0);
  $("mode-count").textContent = list.items.length || "";
  renderLists();
}
/** Drag an item by its grip: it moves through the list under the finger; the list scrolls
    along near its top and bottom edge. */
function startDrag(e, li, grip, onDrop) {
  e.preventDefault();
  const ul = $("list-items");
  const from = [...ul.children].indexOf(li);
  try { grip.setPointerCapture(e.pointerId); } catch { /* not all pointers can be captured */ }
  li.classList.add("dragging");
  let lastY = e.clientY, scroller = null;
  const place = () => {
    for (const sib of ul.children) {
      if (sib === li) continue;
      const r = sib.getBoundingClientRect();
      if (lastY < r.top + r.height / 2) {
        if (li.nextElementSibling !== sib) ul.insertBefore(li, sib);
        return;
      }
    }
    if (ul.lastElementChild !== li) ul.appendChild(li);
  };
  const autoscroll = () => {
    const r = ul.getBoundingClientRect();
    const step = lastY < r.top + 40 ? -10 : lastY > r.bottom - 40 ? 10 : 0;
    if (step) { ul.scrollTop += step; place(); }
  };
  const move = (ev) => { lastY = ev.clientY; place(); };
  const end = () => {
    grip.removeEventListener("pointermove", move);
    grip.removeEventListener("pointerup", end);
    grip.removeEventListener("pointercancel", end);
    clearInterval(scroller);
    li.classList.remove("dragging");
    const to = [...ul.children].indexOf(li);
    if (to !== from) onDrop(from, to);
    renderList();
  };
  scroller = setInterval(autoscroll, 30);
  grip.addEventListener("pointermove", move);
  grip.addEventListener("pointerup", end);
  grip.addEventListener("pointercancel", end);
}
function showItem(it) {
  setMode("browse");
  if (it.kind === "sermon") { setTab("sermons"); openSermon(it.code, it.v1, it.lang); }
  else { setTab("bible"); openChapter(it.b, it.c, { start: it.v1, end: it.v2 }); }
}

// ---------------------------------------------------------------- sending to the computer
/** Text the Windows app understands (Service list ⋯ → Paste list): one passage per line. */
function listAsText(list) {
  const lines = [`# ${list.name || "Bible Present list"}`];
  for (const it of list.items) {
    lines.push(it.kind === "sermon" ? `${it.code} ${range(it.v1, it.v2)}` : `${BOOKS_NL[it.b]} ${it.c}:${range(it.v1, it.v2)}`);
  }
  return lines.join("\n");
}
/** The same file format as the Windows app's Save list / Open list. */
function listAsFile(list) {
  const service = list.items.map((it) => it.kind === "sermon"
    ? { ref: itemLabel(it), kind: "sermon", code: it.code, v1: it.v1, v2: it.v2 }
    : { ref: `${BOOKS_NL[it.b]} ${it.c}:${range(it.v1, it.v2)}`, b: it.b, c: it.c, v1: it.v1, v2: it.v2 });
  const name = (list.name || "Bible Present list").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return new File([JSON.stringify({ name: list.name, service }, null, 2)], `${name}.json`, { type: "application/json" });
}
async function shareFile() {
  const list = currentList();
  if (!list.items.length) return toast("The list is empty.");
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
  if (!list.items.length) return toast("The list is empty.");
  const text = listAsText(list);
  try {
    if (navigator.share) { await navigator.share({ text, title: list.name || "Bible Present list" }); return; }
  } catch (e) { if (e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Copied: paste it in Bible Present (Paste list)."); }
  catch { prompt("Copy this text:", text); }
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
    $("ref-input").value = bad.join("; ");   // keep only what could not be added
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

function showDialog(html, onMount) {
  $("dialog").innerHTML = html;
  $("overlay").classList.remove("hidden");
  if (onMount) onMount($("dialog"));
}
function closeDialog() { $("overlay").classList.add("hidden"); $("dialog").innerHTML = ""; }

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

async function initConnected(info) {
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
  if (conn.handoff && conn.handoff.id) store.set("returnList", { id: conn.handoff.id, name: conn.handoff.name });
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
    <input id="pin" class="pin" inputmode="numeric" maxlength="4" autocomplete="one-time-code" value="${esc(prefill)}">
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

function startConnected() {
  if (conn.events) conn.events.close();
  conn.events = new EventSource(`api/events?token=${encodeURIComponent(conn.token)}`);
  conn.events.onmessage = (e) => {
    const first = !conn.remote;
    conn.remote = JSON.parse(e.data);
    $("conn").classList.remove("lost");
    renderRemote();
    if (first && conn.handoff) offerHandoff();
  };
  conn.events.onerror = async () => {
    $("conn").classList.add("lost");
    try {
      const res = await fetch("api/state", { headers: { "X-BP-Token": conn.token } });
      if (res.status === 401) {  // the laptop made a new code
        conn.events.close();
        store.set("token", null);
        askCode("", "The code on the laptop was changed. Enter the new code.");
      }
    } catch { /* laptop not reachable for a moment: the stream reconnects by itself */ }
  };
  loadSermonIndex();
}

async function cmd(action, extra = {}) {
  try {
    const res = await fetch("api/cmd", { method: "POST",
      headers: { "Content-Type": "application/json", "X-BP-Token": conn.token || "" },
      body: JSON.stringify({ action, ...extra }) });
    if (res.status === 401) askCode("", "Enter the code shown on the laptop.");
    else if (!res.ok) toast("The laptop did not accept that.");
  } catch { toast("The laptop does not answer. Same Wi-Fi?"); }
}

function offerHandoff() {
  const h = conn.handoff;
  conn.handoff = null;
  if (!h || !h.items || !h.items.length) return;
  showDialog(`<h2>Send your list to the laptop?</h2>
    <p>“${esc(h.name || "List")}” — ${h.items.length} item${h.items.length === 1 ? "" : "s"}.
       The laptop's service list now has ${conn.remote.service.length}.</p>
    <div class="buttons">
      <button id="h-no" class="ghost">Not now</button>
      <button id="h-replace" class="ghost">Replace the laptop's list</button>
      <button id="h-add" class="primary">Add to the end</button></div>`, (d) => {
    const send = (mode) => { cmd("list", { mode, name: h.name, service: h.items.map(toService) }); closeDialog(); toast("List sent to the laptop"); };
    d.querySelector("#h-add").onclick = () => send("append");
    d.querySelector("#h-replace").onclick = () => send("replace");
    d.querySelector("#h-no").onclick = closeDialog;
  });
}

/** Back to the list app (on GitHub), taking the laptop's service list along. */
function backToLists() {
  const items = (conn.remote ? conn.remote.service : []).map(fromService);
  const list = conn.retList || {};
  location.href = `${conn.ret}#return=${b64enc({ id: list.id, name: list.name, items })}`;
}

function renderRemote() {
  const r = conn.remote, ul = $("list-items");
  if (!r) return;
  ul.innerHTML = "";
  r.service.forEach((it, i) => {
    const li = el("li");
    li.dataset.id = it.id;
    li.classList.toggle("live", !!(r.live.on_air && r.live.item === it.id));
    li.classList.toggle("done", !!it.done);
    const grip = el("span", "grip", "⠿");
    grip.addEventListener("pointerdown", (e) => startDrag(e, li, grip, (from, to) => {
      r.service.splice(to, 0, r.service.splice(from, 1)[0]);  // show it at once, then tell the laptop
      cmd("reorder", { ids: r.service.map((x) => x.id) });
    }));
    const body = el("div", "body");
    body.append(el("div", "label", it.label), el("div", "snip", it.snippet || ""));
    body.title = "Tap to put this on the screen";
    body.onclick = () => cmd("present_item", { id: it.id });
    const del = el("button", "del", "✕");
    del.title = "Remove from the service list";
    del.onclick = () => cmd("remove", { id: it.id });
    li.append(grip, el("span", "num", it.done && !li.classList.contains("live") ? "✓" : i + 1), body, del);
    ul.appendChild(li);
  });
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
      (${list.items.length} item${list.items.length === 1 ? "" : "s"})</label></p>` : ""}
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
        params.set("handoff", b64enc({ id: list.id, name: list.name, items: list.items.map(toService) }));
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
  list.items = (data.items || []).map(fromService);
  state.current = list.id;
  saveLists();
  renderList();
  toast(`“${list.name || "List"}” updated from the laptop (${list.items.length} items)`);
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
  $("list-select").onchange = (e) => { state.current = e.target.value; saveLists(); renderList(); };
  $("list-name").addEventListener("input", (e) => { currentList().name = e.target.value; saveLists(); renderLists(); });
  $("list-new").onclick = () => { const l = newList(); state.lists.push(l); state.current = l.id; saveLists(); renderList(); $("list-name").focus(); };
  $("list-delete").onclick = () => {
    const l = currentList();
    if (l.items.length && !confirm(`Delete “${l.name || "this list"}” with ${l.items.length} items?`)) return;
    state.lists = state.lists.filter((x) => x.id !== l.id);
    if (!state.lists.length) state.lists.push(newList());
    state.current = state.lists[0].id;
    saveLists(); renderList();
  };
  $("share-file").onclick = shareFile;
  $("share-text").onclick = shareText;
  $("connect-btn").onclick = connectDialog;
  $("back-btn").onclick = backToLists;
  $("addbar-live").onclick = presentSelection;
  $("ctl-next").onclick = () => cmd("next");
  $("ctl-prev").onclick = () => cmd("prev");
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
