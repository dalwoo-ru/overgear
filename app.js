/* Overgear · WoW Midnight Leveling prototype.
   Everything runs locally: no backend, no network. Prices and times are an assumed model
   (see PRICING), calibrated so 80→90 · Piloted · 1 character = $23.56, like the live page. */

/* ================= Config ================= */
const PRICING = {
  perLevel: (l) => (l < 80 ? 0.28 : 2.356),          // $ for one level step
  hours: (l) => (l < 80 ? 4 / 79 : 0.6),             // hours of work for one level step
  startMinutes: 15,
  express: { pct: 0.30, timeFactor: 0.6 },
  charDiscount: { 1: 0, 2: 0.05, 3: 0.10, 4: 0.15, 5: 0.20 },
  method: { piloted: 0, self: 0.70, remote: 0.05 },
  ultimateDiscount: 0.20,                            // off everything inside "Ultimate" (Express boost + every add-on)
  extras: [
    { id: 'gear292',  emoji: '⚔️', label: '292 ilvl gear',     price: 53.87, desc: 'Item level 292 gear, ready for M+4. Needs level 90.' },
    { id: 'honor',    emoji: '🛡️', label: 'Honor gear 331',    price: 20.19, desc: '331 ilvl PvP set. Needs level 90.' },
    { id: 'campaign', emoji: '📜', label: 'Midnight campaign', price: 36.81, was: 46.01, desc: 'The Midnight leveling campaign is finished on the way, so you unlock its rewards.' },
    { id: 'ulatek',   emoji: '🐍', label: "Ula'tek campaign",  price: 24.68, desc: "The Curse of Ula'tek campaign is finished for you. Needs level 90." },
    { id: 'stream',   emoji: '🔴', label: 'Live stream',       price: 11.23, desc: 'Watch your booster play live. Great for peace of mind.' },
  ],
};
/* "Pretty" prices: totals and add-on prices are rounded UP to the next .49 or .99.
   Switch to 'whole' (next whole dollar) or 'off' (exact) to compare. */
const PRETTY = 'charm';
function pretty(n) {
  if (PRETTY === 'off') return n;
  const c = Math.round(n * 100) / 100;
  if (PRETTY === 'whole') return Math.ceil(c);
  const w = Math.floor(c);
  return c - w <= 0.49 + 1e-9 ? w + 0.49 : w + 0.99;
}
const BUNDLE = ['gear292', 'honor', 'campaign', 'ulatek', 'stream'];   // everything is included in Ultimate
const NEED90 = ['gear292', 'honor', 'ulatek'];       // add-ons that only work at level 90
const SET = {};   // no combo sets any more: every add-on is picked on its own
const XGROUPS = [];
const setOf = (id) => Object.keys(SET).find((k) => SET[k].includes(id));
const PKG_NAME = { basic: 'Basic', express: 'Express', ultimate: 'Ultimate' };
const GIFT_M10 = false;   // O10: set to true if the free M+10 key is still given with leveling orders
const TRUST = { rating: '4.9', reviews: '36,206' };
const CHAR_STEPS = [1, 2, 3, 4, 5];

/* Copy for the three methods. The "share / keep" lines are drafts: confirm them with ops before shipping. */
const METHODS = {
  piloted: { name: 'Piloted', line: 'Verified booster plays for you. You share your login only.',
    share: 'Your login, used through a VPN. Email and authenticator stay with you.',
    time: 'None — log in at the end', whoPlays: 'A verified booster' },
  self:    { name: 'Self-play', line: 'AFK route included. Nothing is shared.',
    share: 'Nothing — you stay on your own account, no login given.',
    time: 'AFK route, game stays running', whoPlays: 'You, on an AFK route' },
  remote:  { name: 'Remote', line: 'Verified booster plays remotely. No login shared.',
    share: 'A remote session only. Your login is never given out.',
    time: 'Be online to start the session', whoPlays: 'A booster, remotely' },
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => '$' + n.toFixed(2);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const isMobile = () => matchMedia('(max-width:767px)').matches;
const noHover = () => matchMedia('(hover:none)').matches;

/* ================= Sidebar ================= */
const NAV = [
  ['WoW Gold'], ['🔥 Hot offers'], ['🌙 Season 2'], ['12.1.5 🔴 LIVE'],
  ['Raids', ['The Venomous Abyss', 'Venomous Abyss Heroic', 'Venomous Abyss Mythic', "🔥 Unbinding of Kith'ix", "Ula'tek", 'Single Bosses', 'Tidebound Grotto', 'Season 1 Raids', 'Legacy Raids', 'Timewalking Raids', 'The Worldcore']],
  ['Mythic+ Dungeons', ['M+ 3+1 FREE 🎁', 'Any Mythic+ Keys', 'Mythic +10', 'Keystone Myth', 'Keystone Legend', 'Keystone Hero', 'Timewalking', 'Mistcrests']],
  ['Leveling', ['Power Leveling', 'Renown', 'Campaigns'], true],
  ['Character Boost', ['Gearing', 'Mage Tower', 'Professions', 'Reputations', 'Coaching', 'Player Housing', 'Pathfinder Services']],
  ['PvP', ['Elite PvP Transmog', 'Gladiator', 'PvP Gear', 'Battleground Blitz', 'Solo Shuffle', 'PvP Coaching']],
  ['Delves', ["Fabled Solo: Kindo'jan", "The Labyrinth of Kindo'Jan", "Azta'rec Challenge", 'Delves 3+1 FREE 🎁', 'Tiers Unlock', 'Ritual Sites']],
  ['Achievements', ['Event Achievements', 'Glory Achievements']],
];
$('#nav').innerHTML = NAV.map(([name, kids, open]) => kids
  ? `<li class="${open ? 'open' : ''}"><button aria-expanded="${!!open}">${name}<span class="tgl"></span></button><ul class="sub">${
      kids.map((k) => `<li><a href="#" class="${k === 'Power Leveling' ? 'active' : ''}">${k}</a></li>`).join('')}</ul></li>`
  : `<li><a href="#">${name}</a></li>`).join('');
$('#nav').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) {
    const li = b.parentElement;
    li.classList.toggle('open');
    b.setAttribute('aria-expanded', li.classList.contains('open'));
  } else if (e.target.closest('a')) e.preventDefault();
});
const burger = $('#burger');
burger.addEventListener('click', () => {
  const o = document.body.classList.toggle('nav-open');
  burger.setAttribute('aria-expanded', o);
});
document.addEventListener('click', (e) => {
  if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar, #burger')) {
    document.body.classList.remove('nav-open'); burger.setAttribute('aria-expanded', false);
  }
});

/* ================= Footer ================= */
const FCOLS = {
  Overgear: ['About us', 'Work with us', 'Guides', 'Contact us', 'Get help', 'Guarantees'],
  Legal: ['Terms and conditions', 'Privacy policy', 'Refund policy', 'Cookies policy', 'Consent Preferences', 'Credential on File Agreement'],
  'World of Warcraft': ['WoW Boosting', 'WoW Gold', 'Mythic+ Dungeon boost', 'WoW Raid Boost', 'PvP Boosting', 'WoW Power Leveling'],
  'WoW Mists of Pandaria': ['Mists of Pandaria Boosting', 'Mists of Pandaria Gold', 'Mists of Pandaria Power Leveling', 'Mists of Pandaria Raids', 'Mists of Pandaria PvP Boosting'],
};
$('#fcols').innerHTML = Object.entries(FCOLS).map(([h, l]) => `<div><h6>${h}</h6>${l.map((x) => `<a href="#">${x}</a>`).join('')}</div>`).join('');
const GAMES = 'Apex Legends|New World|EFT|Destiny 2|PoE|Fellowship|Lost Ark|Valorant|Diablo Immortal|EA Sports FC 27|Call of Duty|Diablo 4|World of Tanks|Counter-Strike 2|WoW Classic Hardcore|WoW Classic Era|Season of Discovery|The Finals|League of Legends|Last Epoch|Helldivers 2|Dota 2|Rainbow 6 Siege|The First Descendant|Albion Online|Overwatch|Genshin Impact|Arena Breakout Infinite|Old School Runescape|Warhammer 40k Space Marine 2|WoW Classic Fresh|Path of Exile 2|Marvel Rivals|Deadlock|Delta Force|Where Winds Meet|Guild Wars 2|Final Fantasy XIV|Diablo 2 Resurrected|Diablo 3|The Elder Scrolls Online|Monster Hunter Wilds|The Division 2|Dune Awakening|Sea of Thieves|Elden Ring Nightreign|Borderlands 4|Destiny Rising|Battlefield 6|ARC Raiders|Active Matter|Marathon|Arknights: Endfield|NBA 2K|WoW Forever|WARDOGS|Fortnite|Gears of War: E-Day|Torchlight: Infinite|Warframe'.split('|');
$('#fgames').innerHTML = GAMES.map((g) => `<a href="#">${g}</a>`).join('');

/* ================= Reviews carousel (stacked on mobile by CSS) ================= */
(function () {
  const track = $('#revTrack'), prev = $('#revPrev'), next = $('#revNext');
  const upd = () => {
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 16;
  prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
  next.addEventListener('click', () => track.scrollBy({ left: step() }));
  track.addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();
})();

/* ================= You may also like: arrows scroll the card row ================= */
(() => {
  const track = $('#alsoTrack'), prev = $('#alsoPrev'), next = $('#alsoNext');
  if (!track) return;
  const upd = () => {
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  const step = () => (track.firstElementChild?.getBoundingClientRect().width || 260) + 16;
  prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
  next.addEventListener('click', () => track.scrollBy({ left: step() }));
  track.addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();
})();

/* ================= Accordions, folds, SEO text ================= */
document.addEventListener('click', (e) => {
  const b = e.target.closest('.acc > button');
  if (!b) return;
  const acc = b.parentElement;
  const open = !acc.classList.contains('open');
  acc.classList.toggle('open', open);
  b.setAttribute('aria-expanded', open);
});

/* ================= Order state & pricing ================= */
const state = {
  region: 'eu', from: 80, to: 90, mode: 'pop',     // mode: pop | full | custom
  pkg: 'basic', chars: 1, method: 'piloted', extras: new Set(),   // pkg: basic | express | ultimate; extras = optional add-ons only
  others: [],   // characters with their own settings: { from, to, pkg, method, extras:Set }
};
const MAX_CHARS = 5;
const tierN = () => state.chars + state.others.length;
const cfgWith = (patch) => {
  const o = { ...state, extras: new Set(state.extras), ...patch };
  o.tier = 'tier' in patch ? patch.tier : 'chars' in patch ? patch.chars : tierN();
  return o;
};

const isExpress = (c) => c.pkg !== 'basic';
const allExtras = (c) => { const s = new Set(c.extras); if (c.pkg === 'ultimate') BUNDLE.forEach((id) => s.add(id)); return s; };
const extraDef = (id) => PRICING.extras.find((x) => x.id === id);
function quote(c) {
  let base = 0, hours = 0;
  for (let l = c.from; l < c.to; l++) { base += PRICING.perLevel(l); hours += PRICING.hours(l); }
  const mult = 1 + (isExpress(c) ? PRICING.express.pct : 0) + PRICING.method[c.method];
  const n = c.chars;
  const core = base * mult * n * (1 - PRICING.charDiscount[c.tier ?? n]);
  let extras = 0;
  let extrasSave = 0;   // set discounts (-15%) of the extras the buyer ticked
  allExtras(c).forEach((id) => { extras += extraDef(id).price; });
  c.extras.forEach((id) => { const x = extraDef(id); if (x.was) extrasSave += x.was - x.price; });
  const bundleExtras = BUNDLE.reduce((s, id) => s + extraDef(id).price, 0);
  const bundle = c.pkg === 'ultimate' ? PRICING.ultimateDiscount * (core + bundleExtras) : 0;
  if (isExpress(c)) hours *= PRICING.express.timeFactor;
  const raw = core + extras - bundle;
  const charSave = base * mult * n - core;   // what the multi-character discount takes off
  return { total: pretty(raw), wasBundle: pretty(raw + bundle), was: pretty(raw + bundle + charSave + extrasSave), charSave, extrasSave, raw, core, extras, bundle, hours, base };
}
/* the whole order: the main character (x chars copies) plus the characters with their own settings */
function grandOf(c) {
  const N = c.chars + (c.others || []).length;
  const parts = [quote({ ...c, tier: N }), ...(c.others || []).map((o) => quote({ ...o, region: c.region, chars: 1, tier: N }))];
  const sum = (f) => parts.reduce((s, p) => s + f(p), 0);
  const raw = sum((p) => p.raw), bundle = sum((p) => p.bundle), charSave = sum((p) => p.charSave), extrasSave = sum((p) => p.extrasSave);
  return { total: pretty(raw), wasBundle: pretty(raw + bundle), was: pretty(raw + bundle + charSave + extrasSave), raw, bundle, charSave, hours: Math.max(...parts.map((p) => p.hours)), core: parts[0].core, n: N };
}
const PKG = {
  basic:   () => cfgWith({ pkg: 'basic' }),
  express: () => cfgWith({ pkg: 'express' }),
  ultimate: () => cfgWith({ pkg: 'ultimate', to: 90, extras: new Set() }),
};
const hrs = (h) => (h < 10 ? Math.round(h * 2) / 2 : Math.round(h));   // 3.6 → 3.5, 6 → 6, 10.4 → 10
const fmtLong = (h) => (h < 1 ? `${Math.max(1, Math.round(h * 60))} minutes` : `${hrs(h)} hours`);
const fmtSaved = (h) => (h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : `${hrs(h)} h`);
const fmtH = (h) => (h < 1 ? `~${Math.max(1, Math.round(h * 60))} min` : `~${hrs(h)} h`);

/* ================= Order form: build static parts ================= */
const el = {
  from: $('#from'), to: $('#to'), rFrom: $('#rFrom'), rTo: $('#rTo'), fill: $('#fill'), rangeBox: $('#rangeBox'),
};

$('#methods').innerHTML = Object.entries(METHODS).map(([id, m]) => `
  <button type="button" class="mc" role="radio" data-m="${id}">
    <span class="mh"><b>${m.name}</b><em data-delta="${id}"></em></span>
    <span class="ml">${m.line}</span>
  </button>`).join('');

const extraPrice = (x, locked) => locked ? ({ need90: 'Needs level 90' }[locked] || 'Included') : x.was ? `${money(pretty(x.price))}<s>${money(pretty(x.was))}</s>` : '+' + money(pretty(x.price));
const xrow = (x) => `
  <label class="check xrow" data-xrow="${x.id}"><input type="checkbox" data-extra="${x.id}"><span class="box"><svg viewBox="0 0 16 16"><use href="#i-check"/></svg></span>
    <span class="xt"><b><i class="em" aria-hidden="true">${x.emoji}</i>${x.label}</b><i class="q" tabindex="0" role="button" data-tip="${x.desc}" aria-label="About ${x.label}">?</i><span class="p ${x.was ? 'hot' : ''}">${extraPrice(x, false)}</span></span></label>`;
const grouped = XGROUPS.flatMap((g) => g.ids);
const pct = (id) => Math.round((1 - extraDef(id).price / extraDef(id).was) * 100);
$('#extras').innerHTML = [
  ...XGROUPS.map((g) => `<div class="xgroup" role="group" aria-label="${g.title}"><div class="xg-h"><span>${g.title}</span></div><div class="xg-rows">${g.ids.map((id) => xrow(extraDef(id))).join('')}</div><button type="button" class="takeall quiet" data-takeall="${g.id}"><span>Take all</span><i class="xtag">-${pct(g.set)}%</i></button></div>`),
  ...PRICING.extras.filter((x) => !grouped.includes(x.id) && !SET[x.id]).map(xrow),
].join('');


/* ================= Characters with their own settings ================= */
const expandSets = (ids) => { const s = new Set(); ids.forEach((id) => (SET[id] ? SET[id].forEach((x) => s.add(x)) : s.add(id))); return s; };
const OSINGLES = PRICING.extras.filter((x) => !SET[x.id]);
function renderOthers() {
  const host = $('#others');
  const keepFocus = document.activeElement?.id;
  host.innerHTML = state.others.map((o, i) => {
    const no90 = o.to !== 90, ult = o.pkg === 'ultimate';
    const oq = quote({ ...o, region: state.region, chars: 1, tier: tierN() });
    const chip = (attr, label, on, dis) => `<button type="button" class="lc" ${attr} aria-pressed="${on}"${dis ? ' disabled' : ''}>${label}</button>`;
    return `<div class="ochar" data-o="${i}">
      <div class="oh"><b>Character ${state.chars + i + 1}</b><span class="op">${money(oq.total)}</span><button type="button" class="orm" data-orm="${i}" aria-label="Remove character ${state.chars + i + 1}">Remove</button></div>
      <div class="orow"><span class="olbl">Range</span><div class="ochips">
        <label class="onum"><span class="ol">From</span><input data-ofrom="${i}" inputmode="numeric" pattern="[0-9]*" value="${o.from}" autocomplete="off"></label><span class="oarr">→</span><label class="onum"><span class="ol">To</span><input data-oto="${i}" inputmode="numeric" pattern="[0-9]*" value="${o.to}" autocomplete="off"></label>
      </div></div>
      <div class="orow"><span class="olbl">Package</span><div class="ochips">${['basic', 'express', 'ultimate'].map((k) => chip(`data-oset="${i}:pkg:${k}"`, PKG_NAME[k], o.pkg === k, k === 'ultimate' && no90)).join('')}</div></div>
      <div class="orow"><span class="olbl">Method</span><div class="ochips">${Object.keys(METHODS).map((m) => chip(`data-oset="${i}:method:${m}"`, METHODS[m].name, o.method === m)).join('')}</div></div>
      <div class="orow"><span class="olbl">Add-ons</span><div class="ochips">${OSINGLES.map((x) => { const blocked = ult || (no90 && NEED90.includes(x.id)); return chip(`data-oset="${i}:extra:${x.id}"`, `${x.label}`, ult || o.extras.has(x.id), blocked); }).join('')}</div></div>
    </div>`;
  }).join('');
  if (keepFocus && $(`#${keepFocus}`)) $(`#${keepFocus}`).focus();
}
function setOther(i, field, val) {
  const o = state.others[i]; if (!o) return;
  if (field === 'range') { const [f, t] = val.split('-').map(Number); o.from = f; o.to = t; }
  if (field === 'pkg') { o.pkg = val; if (val === 'ultimate') { o.to = 90; o.extras = new Set(); } }
  if (field === 'method') o.method = val;
  if (field === 'extra') { if (o.extras.has(val)) o.extras.delete(val); else o.extras.add(val); }
  if (o.to !== 90) { NEED90.forEach((id) => o.extras.delete(id)); if (o.pkg === 'ultimate') o.pkg = 'express'; }
  render();
}
function commitOtherLevel(i, which, v) {
  const o = state.others[i]; if (!o || Number.isNaN(v)) return render();
  if (which === 'from') { o.from = clamp(v, 1, o.to - 1); } else { o.to = clamp(v, o.from + 1, 90); }
  if (o.to !== 90) { NEED90.forEach((id) => o.extras.delete(id)); if (o.pkg === 'ultimate') o.pkg = 'express'; }
  render();
}
$('#others').addEventListener('click', (e) => {
  const s = e.target.closest('[data-oset]'), r = e.target.closest('[data-orm]');
  if (s) { const [i, f, ...v] = s.dataset.oset.split(':'); setOther(+i, f, v.join(':')); }
  if (r) { state.others.splice(+r.dataset.orm, 1); render(); }
});
$('#others').addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.ofrom !== undefined) commitOtherLevel(+t.dataset.ofrom, 'from', parseInt(t.value, 10));
  if (t.dataset.oto !== undefined) commitOtherLevel(+t.dataset.oto, 'to', parseInt(t.value, 10));
});
$('#others').addEventListener('input', (e) => { if (e.target.dataset.ofrom !== undefined || e.target.dataset.oto !== undefined) e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2); });
$('#addChar').addEventListener('click', (e) => {
  if (e.target.closest('.q')) return;   // the ? hint only explains
  if (tierN() >= MAX_CHARS) return;
  state.others.push({ from: state.from, to: state.to, pkg: state.pkg, method: state.method, extras: expandSets([...state.extras]) });
  render();
  $('#others .ochar:last-child')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

/* ================= Render: state → DOM ================= */
const HOW = {
  piloted: (f, t) => [
    'Pay and fill in the character info — Discord setup is ready within 15 minutes;',
    `A verified booster connects through a VPN and levels ${f} → ${t} by hand. Your email and authenticator stay with you;`,
    `Log in at level ${t} — raids, M+, Delves and PvP are ready.`],
  self: (f, t) => [
    'Pay and fill in the character info — Discord setup is ready within 15 minutes;',
    `You stay on your own account: AFK to 80 in Azure Span, then AFK ${Math.max(f, 80)} → ${t} via Harandar/Voidstorm;`,
    `Hit level ${t} with raids, M+, Delves and PvP all ready to go.`],
  remote: (f, t) => [
    'Pay and fill in the character info — Discord setup is ready within 15 minutes;',
    `The booster plays ${f} → ${t} through remote access. Your account details are never given out;`,
    `Be online at the start, then come back to a level ${t} character.`],
};

function render() {
  const { from, to } = state;
  const q = grandOf(state);

  // range
  const mode = state.mode;
  $$('#presets .pre').forEach((b) => b.setAttribute('aria-checked', b.dataset.p === mode));
  el.rangeBox.hidden = mode === 'pop' || mode === 'full';
  el.rangeBox.dataset.mode = mode;
  el.from.value = from; el.to.value = to;
  el.to.readOnly = mode === 'mine';
  el.rFrom.value = from; el.rTo.value = to;
  const pos = (v) => `calc(8px + (100% - 16px) * ${(v - 1) / 89})`;
  $('#fill').style.left = pos(from); $('#fill').style.right = `calc(100% - ${pos(to)})`;
  el.rFrom.style.zIndex = from > 45 ? 3 : 1; el.rTo.style.zIndex = 2;

  // packages
  const std = quote(cfgWith({ pkg: 'basic' })), exp = quote(cfgWith({ pkg: 'express' }));
  $$('#pkgs .pkg').forEach((b) => {
    const k = b.dataset.k, pq = quote(PKG[k]());
    b.setAttribute('aria-checked', state.pkg === k);
    $('.pp', b).innerHTML = k === 'ultimate' && pq.bundle ? `${money(pq.total)}<s>${money(pq.wasBundle)}</s>` : money(pq.total);
    if (k === 'basic') $('small', b).textContent = `Ready ${fmtH(std.hours)}`;
    if (k === 'express') $('small', b).textContent = `Ready ${fmtH(exp.hours)}`;
    if (k === 'ultimate') {
      const sv = $('.save', b), no90 = state.to !== 90;
      b.disabled = no90;
      $('small', b).textContent = no90 ? 'Needs level 90' : 'Express and every add-on';
      sv.hidden = !pq.bundle || no90; sv.textContent = `-${Math.round(PRICING.ultimateDiscount * 100)}%`;
    }
  });

  // first-screen time chip follows the chosen range
  $('#chipTimeText').innerHTML = `<b>${from}→${to} ${fmtH(std.hours)}</b> · ${fmtH(exp.hours)} with Express`;

  // the Piloted review is shown only while Piloted is chosen
  $('#mnote').hidden = state.method !== 'piloted';

  // methods
  const piloted = quote(cfgWith({ method: 'piloted' }));
  $$('#methods .mc').forEach((b) => {
    const m = b.dataset.m, d = pretty(quote(cfgWith({ method: m })).raw - piloted.raw);
    b.setAttribute('aria-checked', state.method === m);
    $('em', b).textContent = m === 'piloted' ? '' : '+' + money(d);
  });

  // characters: copies with the same settings, plus separate forms for the others
  const N = tierN();
  const ct = $('#charTag'); ct.hidden = N === 1; ct.textContent = `-${Math.round(PRICING.charDiscount[N] * 100)}%`;
  $('#charNote').textContent = N === 1 ? 'Add alts and save up to 20%' : `${N} characters · you save $${Math.floor(q.charSave)}`;
  $('#addChar').disabled = N >= MAX_CHARS;
  $('#addHint').innerHTML = N >= MAX_CHARS ? 'Maximum 5' : `<i class="xtag">Save ${Math.round(PRICING.charDiscount[N + 1] * 100)}%</i>`;
  renderOthers();

  // extras: Ultimate includes everything; below level 90 the 90-only ones are blocked
  const no90 = state.to !== 90;
  PRICING.extras.filter((x) => !SET[x.id]).forEach((x) => {
    const parent = setOf(x.id);
    const inUlt = state.pkg === 'ultimate' && BUNDLE.includes(x.id);
    const blocked = no90 && NEED90.includes(x.id);
    const locked = inUlt ? 'bundle' : blocked ? 'need90' : '';
    const row = $(`[data-xrow="${x.id}"]`), inp = $('input', row);
    inp.checked = !blocked && (inUlt || state.extras.has(x.id) || !!(parent && state.extras.has(parent)));
    inp.disabled = !!locked;
    row.classList.toggle('locked', !!locked);
    const inSet = !locked && parent && state.extras.has(parent);
    const sd = parent && extraDef(parent), k = sd ? sd.price / sd.was : 1;
    $('.p', row).innerHTML = inSet ? `+${money(pretty(x.price * k))}<s>${money(pretty(x.price))}</s>` : extraPrice(x, locked);
    $('.p', row).classList.toggle('hot', !!inSet || !!x.was);
  });
  // "Take all" in each group: ticks both items; once both are taken it stays disabled, only unticking by hand brings it back
  XGROUPS.forEach((g) => {
    const btn = $(`[data-takeall="${g.id}"]`);
    const blocked = no90 && g.ids.some((id) => NEED90.includes(id));
    const both = state.pkg === 'ultimate' || g.ids.every((id) => state.extras.has(id) || state.extras.has(g.set));
    btn.disabled = both || blocked;
    const CK = '<svg class="ckc" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".18"/><path d="M6 10.4l2.8 2.8L14.2 7.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    $('span', btn).innerHTML = state.pkg === 'ultimate' ? CK + 'Included' : both ? CK + 'Added' : blocked ? 'Needs level 90' : 'Take all';
  });

  // summary (O5)
  const eta = fmtH(q.hours);
  $('#price').textContent = money(q.total);
  const off = q.was > q.total ? Math.round((1 - q.total / q.was) * 100) : 0;
  const pw = $('#priceWas'); pw.hidden = !off; pw.textContent = off ? money(q.was) : '';
  const pt = $('#priceTag'); pt.hidden = !off; pt.textContent = off ? `-${off}%` : '';
  $('#eta').textContent = fmtLong(q.hours);
  $('#mPrice').textContent = money(q.total);
  $('#gift').hidden = !GIFT_M10;

  // how it works (O9)
  $('#how').innerHTML = HOW[state.method](from, to).map((t) => `<li>${t}</li>`).join('');

  sync();
}

/* ================= Order form: events ================= */
function setRange(f, t, who) {
  f = clamp(Math.round(f), 1, 89); t = clamp(Math.round(t), 2, 90);
  if (who === 'from') f = Math.min(f, t - 1); else t = Math.max(t, f + 1);
  state.from = f; state.to = t;
  if (t !== 90) { NEED90.forEach((id) => state.extras.delete(id)); if (state.pkg === 'ultimate') state.pkg = 'express'; }
  if (state.mode === 'pop' || state.mode === 'full') state.mode = 'custom';
  render();
}
el.rFrom.addEventListener('input', () => setRange(+el.rFrom.value, state.to, 'from'));
el.rTo.addEventListener('input', () => setRange(state.from, +el.rTo.value, 'to'));
for (const [inp, who] of [[el.from, 'from'], [el.to, 'to']]) {
  inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 2); });
  const commit = () => {
    const v = parseInt(inp.value, 10);
    if (Number.isNaN(v)) return render();
    who === 'from' ? setRange(v, state.to, 'from') : setRange(state.from, v, 'to');
  };
  inp.addEventListener('change', commit);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const d = e.key === 'ArrowUp' ? 1 : -1;
      who === 'from' ? setRange(state.from + d, state.to, 'from') : setRange(state.from, state.to + d, 'to');
    }
  });
  inp.addEventListener('focus', () => inp.select());
}

$('#opts').addEventListener('click', (e) => {
  const t = (s) => e.target.closest(s);
  let b;
  if ((b = t('.pre'))) {
    const p = b.dataset.p;
    if (p === 'pop') Object.assign(state, { mode: 'pop', from: 80, to: 90 });
    if (p === 'full') Object.assign(state, { mode: 'full', from: 1, to: 90 });
    if (p === 'custom') state.mode = 'custom';
    render();
  } else if ((b = t('.pkg'))) {
    const c = PKG[b.dataset.k]();
    Object.assign(state, { pkg: c.pkg, extras: c.extras, to: c.to });
    if (state.to === 90 && state.from === 80 && state.mode === 'custom') state.mode = 'pop';
    render();
  } else if ((b = t('.mc'))) {
    state.method = b.dataset.m; render();
  } else if ((b = t('[data-pickm]'))) {
    state.method = b.dataset.pickm; render();
  } else if ((b = t('[data-takeall]'))) {
    const g = XGROUPS.find((x) => x.id === b.dataset.takeall);
    g.ids.forEach((id) => state.extras.add(id));
    Object.keys(SET).forEach((k) => { if (SET[k].every((s) => state.extras.has(s))) { SET[k].forEach((s) => state.extras.delete(s)); state.extras.add(k); } });
    render();
  } else if ((b = t('[data-end]'))) {
    const v = +b.dataset.end;
    setRange(Math.min(state.from, v - 1), v, 'to');
  } else if (t('#compare')) {
    openCompare();
  }
});
$('#opts').addEventListener('change', (e) => {
  if (e.target.name === 'region') state.region = e.target.value;
  if (e.target.dataset.extra) {
    if (!e.target.disabled) {
      const id = e.target.dataset.extra;
      const parent = setOf(id);
      if (parent && state.extras.has(parent)) {
        // unticking one of two from an active set: the set goes, the other one stays
        state.extras.delete(parent);
        SET[parent].filter((s) => s !== id).forEach((s) => state.extras.add(s));
      } else e.target.checked ? state.extras.add(id) : state.extras.delete(id);
      Object.keys(SET).forEach((k) => { if (SET[k].every((s) => state.extras.has(s))) { SET[k].forEach((s) => state.extras.delete(s)); state.extras.add(k); } });
    }
  }
  render();
});
// radio groups: arrow keys move the selection
$$('[role=radiogroup]').forEach((g) => g.addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) || e.target.tagName === 'INPUT') return;
  const items = $$('[role=radio]', g), i = items.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  const n = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
  n.focus(); n.click();
}));

/* ================= URL state ================= */
function sync() {
  const p = new URLSearchParams();
  p.set('from', state.from); p.set('to', state.to); p.set('mode', state.mode);
  p.set('region', state.region); p.set('chars', 1); p.set('method', state.method);
  p.set('pkg', state.pkg);
  if (state.extras.size) p.set('extras', [...state.extras].join(','));
  if (state.others.length) p.set('o', state.others.map((o) => [o.from, o.to, o.pkg, o.method, [...o.extras].join('+')].join('-')).join('~'));
  const keep = new URLSearchParams(location.search).get('nudge');
  if (keep) p.set('nudge', keep);
  try { history.replaceState(null, '', '?' + p); } catch {}
}
(function restore() {
  const p = new URLSearchParams(location.search);
  if (['eu', 'us'].includes(p.get('region'))) { state.region = p.get('region'); $(`input[name=region][value=${state.region}]`).checked = true; }
  else {
    // the region does not change the price, so guess it from the time zone and show a compact switch
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
    state.region = /^(America|US|Canada|Pacific\/Honolulu)/.test(tz) ? 'us' : 'eu';
    $(`input[name=region][value=${state.region}]`).checked = true;
  }
  if (METHODS[p.get('method')]) state.method = p.get('method');
  state.pkg = ['basic', 'express', 'ultimate'].includes(p.get('pkg')) ? p.get('pkg') : p.get('pkg') === 'endgame' ? 'ultimate' : p.get('express') === '1' ? 'express' : 'basic';
  (p.get('extras') || '').split(',').forEach((id) => { if (PRICING.extras.some((x) => x.id === id) && !(state.pkg === 'ultimate')) state.extras.add(id); });
  const f = parseInt(p.get('from'), 10), t = parseInt(p.get('to'), 10);
  if (f && t) { state.from = clamp(f, 1, 89); state.to = clamp(t, state.from + 1, 90); }
  if (state.to !== 90) { NEED90.forEach((id) => state.extras.delete(id)); if (state.pkg === 'ultimate') state.pkg = 'express'; }
  (p.get('o') || '').split('~').filter(Boolean).slice(0, MAX_CHARS - state.chars).forEach((s) => {
    const [f, t, pk, m, ex] = s.split('-');
    const from = clamp(+f || 1, 1, 89), to = clamp(+t || 90, from + 1, 90);
    const o = { from, to, pkg: ['basic', 'express', 'ultimate'].includes(pk) ? pk : 'basic', method: METHODS[m] ? m : 'piloted', extras: new Set((ex || '').split('+').filter((id) => OSINGLES.some((x) => x.id === id))) };
    if (to !== 90) { NEED90.forEach((id) => o.extras.delete(id)); if (o.pkg === 'ultimate') o.pkg = 'express'; }
    if (o.pkg === 'ultimate') o.extras = new Set();
    state.others.push(o);
  });
  state.mode = ['pop', 'full', 'custom'].includes(p.get('mode')) ? p.get('mode')
    : state.from === 80 && state.to === 90 ? 'pop' : state.from === 1 && state.to === 90 ? 'full' : 'custom';
  if (state.mode === 'pop' && !(state.from === 80 && state.to === 90)) state.mode = 'custom';
  if (state.mode === 'full' && !(state.from === 1 && state.to === 90)) state.mode = 'custom';
})();

/* ================= Sheet (popover on desktop, bottom sheet on phones) ================= */
const sheet = $('#sheet');
let lastFocus;
function openSheet(title, html, wide) {
  lastFocus = document.activeElement;
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  sheet.classList.toggle('wide', !!wide);
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('show'));
  document.body.classList.add('lock');
  $('[data-close]', sheet.querySelector('header'))?.focus();
}
function closeSheet() {
  sheet.classList.remove('show');
  if (drawer.hidden) document.body.classList.remove('lock');
  setTimeout(() => { sheet.hidden = true; }, 200);
  lastFocus?.focus?.();
}
sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });

function openCompare() {
  const base = quote(cfgWith({ method: 'piloted' }));
  const rows = [['Who plays', (id, m) => m.whoPlays], ['You share', (id, m) => m.share], ['Your time', (id, m) => m.time]];
  openSheet('Compare methods', `<div class="cmpgrid">${Object.entries(METHODS).map(([id, m]) => {
    const q = quote(cfgWith({ method: id }));
    const sel = state.method === id;
    return `<section class="cmpcol">
      <img class="cmpimg" src="assets/img/method-${id}.jpg" alt="${m.name}: who plays and what you share" loading="lazy" decoding="async">
      <h4>${m.name}</h4>
      ${rows.map(([label, fn]) => `<div class="cr"><small>${label}</small><p>${fn(id, m)}</p></div>`).join('')}
      <div class="cr"><small>Price</small><p><b>${money(q.total)}</b>${id === 'piloted' ? '' : ` <em>+${money(pretty(q.raw - base.raw))}</em>`}</p></div>
      <button type="button" class="btn ghost${sel ? ' picked' : ''}" data-pick="${id}"${sel ? ' disabled aria-label="Selected"' : ''}>${sel ? '<svg class="ic"><use href="#i-check"/></svg>Selected' : 'Choose'}</button>
    </section>`;
  }).join('')}</div>`, true);
}
$('#sheetBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]');
  if (b) { state.method = b.dataset.pick; render(); closeSheet(); }
});

const METHOD_POINTS = {
  piloted: ['A <b>verified booster</b> plays by hand. No bots.', 'Your login is used through a <b>VPN in your region</b>.', 'Your <b>authenticator</b> stays with you. You confirm the login when asked.', 'We never ask for access to your <b>email</b>.'],
  self: ['You stay on <b>your own account</b> and share nothing.', 'AFK route included: the game keeps running while the route is played.'],
  remote: ['A <b>verified booster</b> plays through a remote session.', 'Your login is <b>never given out</b>.', 'Be online to start the session.'],
};
function openMethodSheet(idx) {
  const it = cart[idx]; if (!it?.cfg) return;
  const c = cfgOf(it.cfg), cur = grandOf(c).raw, m = c.method;
  const title = m === 'piloted' ? 'Piloted is 100% safe' : METHODS[m].name;
  const others = Object.keys(METHODS).filter((k) => k !== m).map((k) => {
    const r = grandOf({ ...c, method: k }).raw, d = pretty(Math.abs(r - cur));
    return `<button type="button" class="btn ghost" data-cartpick="${idx}:${k}">${METHODS[k].name} <em>${r >= cur ? '+' : '−'}${money(d)}</em></button>`;
  }).join('');
  openSheet(title, `<ul class="bul">${METHOD_POINTS[m].map((t) => `<li>${t}</li>`).join('')}</ul><p>Prefer another way? Switch the method:</p><div class="pickrow">${others}</div><button type="button" class="btn solid wide closebtn" data-close>Close</button>`);
}
$('#sheetBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cartpick]'); if (!b) return;
  const [n, m] = b.dataset.cartpick.split(':'), it = cart[+n];
  it.cfg.method = m; refreshItem(it); saveCart(); renderDrawer(); closeSheet();
});
const SHEETS = {
  piloted: ['Piloted is 100% safe', `<ul class="bul"><li>A <b>verified booster</b> plays by hand. No bots.</li><li>Your login is used through a <b>VPN in your region</b>.</li><li>Your <b>authenticator</b> stays with you. You confirm the login when asked.</li><li>We never ask for access to your <b>email</b>.</li></ul><p>Prefer another way? Switch the method:</p><div class="pickrow"><button type="button" class="btn ghost" data-pick="self">Self-play</button><button type="button" class="btn ghost" data-pick="remote">Remote</button></div><button type="button" class="btn solid wide closebtn" data-close>Close</button>`],
  guarantee: ['100% Money-Back Guarantee', '<p>If we cannot deliver your order, you get your money back. Disputes are handled by live support 24/7.</p><p class="muted">Prototype copy — replace with the real policy text.</p>'],
  reviews: [`Trustpilot ${TRUST.rating} · ${TRUST.reviews} reviews`, '<p>Overgear is rated Excellent on Trustpilot, based on verified customer reviews.</p><p class="muted">Prototype: this would link out to the Trustpilot page.</p>'],
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-sheet]');
  if (a) { e.preventDefault(); openSheet(...SHEETS[a.dataset.sheet]); return; }
  // M4: on touch screens the "?" hints open a sheet instead of a hover tooltip
  const q = e.target.closest('.q');
  if (q && q.closest('label')) e.preventDefault();   // the hint sits inside a checkbox row: do not tick it
  if (q && noHover()) openSheet(q.getAttribute('aria-label') || 'Details', `<p>${q.dataset.tip}</p>`);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!sheet.hidden) closeSheet(); else if (!drawer.hidden) closeDrawer();
});

/* ================= Wishlist, cart, drawer (D5, M6) ================= */
let wish = store.get('og:wish', 0);
let cart = store.get('og:cart7', []);
let promo = null;                                  // { code, pct }
const PROMOS = { WELCOME5: 0.05 };                 // demo code
const heart = $('#heart');
const saveCart = () => store.set('og:cart7', cart);
function counters() {
  const wc = $('#wishCnt'); wc.textContent = wish; wc.hidden = !wish;
  const cc = $('#cartCnt'); cc.textContent = cart.length; cc.hidden = !cart.length;
  heart.setAttribute('aria-pressed', wish > 0);
}
function bump(id) { const c = document.getElementById(id); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
heart.addEventListener('click', () => { wish = wish ? 0 : 1; store.set('og:wish', wish); counters(); bump('wishCnt'); });

const toast = $('#toast'); let tt;
function say(text, link = false) {
  $('#toastText').textContent = text;
  $('#toastCart').hidden = !link;
  toast.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 3500);
}
$('#toastCart').addEventListener('click', (e) => { e.preventDefault(); openDrawer(); });

// old carts may hold the removed combo ids, so unknown add-ons are dropped
const cfgOf = (cfg) => ({ ...cfg, extras: new Set(cfg.extras.filter((id) => extraDef(id))), others: (cfg.others || []).map((o) => ({ ...o, extras: new Set(o.extras) })) });
function refreshItem(i) {
  const c = cfgOf(i.cfg), q = grandOf(c), N = c.chars + c.others.length;
  Object.assign(i, {
    price: q.total, was: q.was, delivery: fmtLong(q.hours), method: METHODS[c.method].name,
    others: c.others.map((o, k) => `Character ${c.chars + k + 1}: ${o.from} - ${o.to} · ${METHODS[o.method].name} · ${PKG_NAME[o.pkg]}`),
    parts: [c.region.toUpperCase(), `${c.from} - ${c.to}`, `${N} character${N > 1 ? 's' : ''}`, c.pkg === 'basic' ? '' : PKG_NAME[c.pkg]].filter(Boolean),
  });
}
function describe(c) {
  const i = {
    id: 'lvl-' + Date.now(), img: 'hero', title: 'Power Leveling', sold: 'OvergearSales', start: '15 minutes',
    cfg: { region: c.region, from: c.from, to: c.to, pkg: c.pkg, chars: c.chars, method: c.method, extras: [...c.extras], others: c.others.map((o) => ({ ...o, extras: [...o.extras] })) },
  };
  refreshItem(i);
  return i;
}
function addToCart() {
  const it = describe(state);
  cart.push(it); saveCart(); counters(); bump('cartCnt');
  const b = $('#add'); b.classList.add('done'); $('#addLabel').textContent = 'Added to cart';
  setTimeout(() => { b.classList.remove('done'); $('#addLabel').textContent = 'Add to cart'; }, 1600);
  hideNudge(true);
  openDrawer();
}
$('#add').addEventListener('click', addToCart);
$('#mAdd').addEventListener('click', addToCart);
$('#cartBtn').addEventListener('click', () => openDrawer());

const drawer = $('#drawer');
const cartTotals = () => {
  const items = cart.reduce((s, i) => s + i.price, 0);
  const disc = promo ? Math.floor(items * promo.pct * 100) / 100 : 0;
  const sub = items - disc;
  return { items, disc, sub, cash: sub * 0.01 };
};
const TIP_PILOTED = 'You share your login only. Email and authenticator stay with you.';
function itemHTML(i, idx) {
  const off = i.was > i.price ? Math.round((1 - i.price / i.was) * 100) : 0;
  const c = i.cfg ? cfgOf(i.cfg) : null;
  const mth = `<span class="mt">${i.method}</span>${c ? `<button type="button" class="qb" data-msheet="${idx}" aria-label="About the ${i.method} method and how to change it">?</button>` : ''}`;
  const meta = i.parts ? [...i.parts.map((p) => `<span>${p}</span>`), mth].join('<span class="dot"> • </span>') : `<span>${i.line || ''}</span>`;
  const row = (icon, label, val) => `<div class="lrow"><svg class="ic"><use href="#${icon}"/></svg><span><b>${label}</b>${val}</span></div>`;
  let extras = '';
  if (c) {
    const lines = [];
    if (c.pkg === 'ultimate') BUNDLE.forEach((id) => lines.push(`<div class="xl"><span>${extraDef(id).label}</span><span class="xp">Included</span></div>`));
    [...c.extras].forEach((id) => lines.push(`<div class="xl"><span>${extraDef(id).label}</span><span class="xp">${money(pretty(extraDef(id).price))}${extraDef(id).was ? `<s>${money(pretty(extraDef(id).was))}</s>` : ''}<button type="button" class="xrm" data-xrm="${idx}:${id}" aria-label="Remove ${extraDef(id).label}">×</button></span></div>`));
    if (lines.length) extras = `<div class="xlist">${lines.join('')}</div>`;
  } else if (i.extras?.length) extras = `<div class="lmeta">+ ${i.extras.join(', ')}</div>`;
  return `
    <div class="litem">
      <img src="assets/img/${i.img || 'hero'}.avif" alt="" width="64" height="64">
      <div class="li-main">
        <b class="lt">${i.title}</b>
        <div class="lmeta">${meta}</div>
        ${(i.others || []).map((t) => `<div class="lmeta">${t}</div>`).join('')}
        ${extras}
        ${i.sold ? row('i-user', 'Sold by ', i.sold) : ''}
        ${i.start ? row('i-timer', 'Start time: ', i.start) : ''}
        ${i.delivery ? row('i-clock', 'Delivery time: ', i.delivery) : ''}
      </div>
      <div class="lr">
        <span class="lp"><b>${money(i.price)}</b>${off ? `<s>${money(i.was)}</s>` : ''}</span>
        ${off ? `<span class="disc">-${off}%</span>` : ''}
        <button type="button" class="rm" data-rm="${idx}" aria-label="Remove item"><svg class="ic"><use href="#i-trash"/></svg></button>
      </div>
    </div>`;
}
function drawerHTML() {
  const t = cartTotals();
  const foot = cart.length ? `
    <div class="dfoot">
      ${promo ? `<div class="frow small promo-on"><span>Promo ${promo.code} <button type="button" class="rm-promo" data-promo-off>Remove</button></span><b>−${money(t.disc)}</b></div>` : ''}
      <form class="promo" data-promo-form>
        <button type="button" class="promo-toggle" aria-expanded="false" data-promo-toggle><span>Apply promo code</span><svg class="ic"><use href="#i-plus"/></svg></button>
        <div class="promo-body" hidden><input name="code" placeholder="Promo code" autocomplete="off" aria-label="Promo code"><button type="submit" class="btn ghost">Apply</button></div>
        <small class="promo-msg" role="status"></small>
      </form>
      <div class="subtotal"><span>Subtotal</span><b>${money(t.sub)}</b></div>
      <div class="frow cashrow"><span>Cashback you will receive <i class="q" tabindex="0" data-tip="1% of your order comes back as OG Coins.">?</i></span><span class="cashback">${t.cash.toFixed(2)} <svg class="coin"><use href="#i-coin"/></svg></span></div>
      <div class="wallets">
        <button type="button" class="wallet apple" data-pay>&#63743; Pay</button>
        <button type="button" class="wallet google" data-pay><span>G</span> Pay</button>
      </div>
      <button type="button" class="cta" data-pay>Secure checkout</button>
      <p class="dnote"><svg class="ic"><use href="#i-shield"/></svg>100% Money-Back Guarantee</p>
    </div>` : '';
  const items = cart.length ? cart.map(itemHTML).join('') : '<p class="muted">Your cart is empty.</p>';
  return `<div class="dscroll">${items}</div>${foot}`;
}
function renderDrawer() {
  const keep = $('.dscroll')?.scrollTop || 0;   // re-rendering must not jump the list back to the top
  $('#dBody').innerHTML = drawerHTML();
  const sc = $('.dscroll'); if (sc) sc.scrollTop = keep;
  $('#dCount').textContent = `(${cart.length} Item${cart.length === 1 ? '' : 's'})`;
}
function openDrawer() {
  renderDrawer();
  drawer.hidden = false;
  requestAnimationFrame(() => drawer.classList.add('show'));
  document.body.classList.add('lock');
}
function closeDrawer() {
  drawer.classList.remove('show');
  document.body.classList.remove('lock');
  setTimeout(() => { drawer.hidden = true; }, 220);
}
drawer.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-promo-form]');
  if (!f) return;
  e.preventDefault();
  const code = f.code.value.trim().toUpperCase();
  if (PROMOS[code]) { promo = { code, pct: PROMOS[code] }; renderDrawer(); }
  else $('.promo-msg', f).textContent = code ? 'Promo code not found. Try WELCOME5 in this prototype.' : 'Enter a promo code.';
});
drawer.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) return closeDrawer();
  const xrm = e.target.closest('[data-xrm]');
  if (xrm) { const [n, id] = xrm.dataset.xrm.split(':'), it = cart[+n]; it.cfg.extras = it.cfg.extras.filter((x) => x !== id); refreshItem(it); saveCart(); return renderDrawer(); }
  const ms = e.target.closest('[data-msheet]');
  if (ms) return openMethodSheet(+ms.dataset.msheet);
  const rm = e.target.closest('[data-rm]');
  if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); counters(); return renderDrawer(); }
  if (e.target.closest('[data-promo-toggle]')) {
    const b = e.target.closest('[data-promo-toggle]'), body = $('.promo-body', b.parentElement), open = body.hidden;
    body.hidden = !open; b.setAttribute('aria-expanded', open);
    if (open) $('input', body).focus();
    return;
  }
  if (e.target.closest('[data-promo-off]')) { promo = null; return renderDrawer(); }
  if (e.target.closest('[data-pay]')) say('Prototype: checkout is not built yet');
});
$('#customBtn').addEventListener('click', () => say('Prototype: custom offer form is not built yet'));
counters();

/* ================= Chat + idle nudge (D4) ================= */
const nudge = $('#nudge');
let nudgeTimer, nudgeDone = false;
function hideNudge(final) { nudge.hidden = true; if (final) nudgeDone = true; }
function armNudge() {
  if (nudgeDone) return;
  clearTimeout(nudgeTimer);
  const ms = +new URLSearchParams(location.search).get('nudge') || 20000;
  nudgeTimer = setTimeout(() => { if (!nudgeDone && sheet.hidden && drawer.hidden) nudge.hidden = false; }, ms);
}
const orderEl = $('.config');
['pointerdown', 'input', 'focusin'].forEach((ev) => orderEl.addEventListener(ev, armNudge));
$('#nudgeX').addEventListener('click', () => hideNudge(true));
const openChat = () => { hideNudge(true); say('Prototype: live chat opens here'); };
$('#nudgeGo').addEventListener('click', openChat);
$('#chatFab').addEventListener('click', openChat);
$('#mChat').addEventListener('click', openChat);

/* ================= Mobile sticky buy bar: always on, the in-page button is hidden on phones ================= */
(function () {
  const bar = $('#mBar');
  const upd = () => {
    const on = isMobile();
    bar.hidden = false; bar.classList.toggle('show', on);
    document.body.classList.toggle('has-mbar', on);
    document.documentElement.style.setProperty('--mbar-h', on ? bar.offsetHeight + 'px' : '0px');
  };
  addEventListener('resize', upd);
  upd();
})();

render();

/* ================= Phones: hide the header while scrolling down, bring it back on scroll up ================= */
(function () {
  const header = $('.header');
  let last = scrollY, ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, d = y - last;
      if (!isMobile() || y < 80 || document.body.classList.contains('lock')) header.classList.remove('away');
      else if (d > 6) header.classList.add('away');
      else if (d < -6) header.classList.remove('away');
      last = y; ticking = false;
    });
  }, { passive: true });
})();
