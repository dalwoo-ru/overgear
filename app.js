/* Overgear · WoW Midnight Leveling prototype.
   Everything runs locally: no backend, no network. Prices and times are an assumed model
   (see PRICING), calibrated so 80→90 · Piloted · 1 character = $23.56, like the live page. */

/* ================= Config ================= */
const PRICING = {
  perLevel: (l) => (l < 80 ? 0.28 : 2.356),          // $ for one level step
  hours: (l) => (l < 80 ? 4 / 79 : 0.6),             // hours of work for one level step
  startMinutes: 15,
  express: { pct: 0.30, timeFactor: 0.6 },
  charDiscount: { 1: 0, 2: 0.05, 3: 0.10, 5: 0.20 }, // the 4-character option is dropped (O8)
  method: { piloted: 0, self: 0.70, remote: 0.05 },
  endgameDiscount: 0.20,                             // off (boost + gear 292 + campaign) inside "Endgame ready"
  extras: [
    { id: 'ulatek',   label: "Ula'tek campaign",  price: 24.68, desc: "Campaign chain finished on your character · needs level 90" },
    { id: 'gear292',  label: '292 ilvl gear',     price: 53.87, desc: 'Full 292 ilvl set for M+ and Delves · needs level 90' },
    { id: 'honor',    label: 'Honor gear 331',    price: 20.19, desc: '331 ilvl PvP set · needs level 90' },
    { id: 'campaign', label: 'Midnight campaign', price: 36.81, was: 46.01, desc: 'Leveling campaign finished on the way · 20% off with a leveling order' },
    { id: 'stream',   label: 'Live stream',       price: 11.23, desc: 'Watch your booster play live · you get a link' },
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
const BUNDLE = ['gear292', 'campaign'];   // included in the Endgame ready package
const GIFT_M10 = false;   // O10: set to true if the free M+10 key is still given with leveling orders
const TRUST = { rating: '4.9', reviews: '36,206' };
const CHAR_STEPS = [1, 2, 3, 5];

/* Copy for the three methods. The "share / keep" lines are drafts: confirm them with ops before shipping. */
const METHODS = {
  piloted: { name: 'Piloted', line: 'Booster plays for you. You share your login only.',
    share: 'Your login, used through a VPN. Email and authenticator stay with you.',
    time: 'None — log in at the end', whoPlays: 'A verified booster' },
  self:    { name: 'Self-play', line: 'You stay in control. Nothing is shared.',
    share: 'Nothing — you stay on your own account, no login given.',
    time: 'AFK route, game stays running', whoPlays: 'You, on an AFK route' },
  remote:  { name: 'Remote', line: 'Booster plays remotely. No login shared.',
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

/* ================= Accordions, folds, SEO text ================= */
document.addEventListener('click', (e) => {
  const b = e.target.closest('.acc > button');
  if (!b) return;
  const acc = b.parentElement;
  const open = !acc.classList.contains('open');
  acc.classList.toggle('open', open);
  b.setAttribute('aria-expanded', open);
});
// M2: "Your Wins" and "How It Works" are folds on phones, always open on desktop
if (isMobile()) $$('details.fold').forEach((d) => d.removeAttribute('open'));
$$('details.fold > summary').forEach((s) => s.addEventListener('click', (e) => { if (!isMobile()) e.preventDefault(); }));
// D3: SEO text collapsed behind "Read more"
$('#seoMore').addEventListener('click', (e) => {
  const seo = $('#seo'), open = seo.classList.toggle('collapsed') === false;
  e.currentTarget.textContent = open ? 'Show less' : 'Read more';
  e.currentTarget.setAttribute('aria-expanded', open);
  if (!open) seo.scrollIntoView({ block: 'start' });
});

/* ================= Order state & pricing ================= */
const state = {
  region: 'eu', from: 80, to: 90, mode: 'pop',     // mode: pop | full | mine | custom
  pkg: 'basic', chars: 1, method: 'piloted', extras: new Set(),   // pkg: basic | express | endgame; extras = optional add-ons only
};
const cfgWith = (patch) => ({ ...state, extras: new Set(state.extras), ...patch });

const isExpress = (c) => c.pkg !== 'basic';
const allExtras = (c) => { const s = new Set(c.extras); if (c.pkg === 'endgame') BUNDLE.forEach((id) => s.add(id)); return s; };
const extraDef = (id) => PRICING.extras.find((x) => x.id === id);
function quote(c) {
  let base = 0, hours = 0;
  for (let l = c.from; l < c.to; l++) { base += PRICING.perLevel(l); hours += PRICING.hours(l); }
  const mult = 1 + (isExpress(c) ? PRICING.express.pct : 0) + PRICING.method[c.method];
  const n = c.chars;
  const core = base * mult * n * (1 - PRICING.charDiscount[n]);
  let extras = 0;
  allExtras(c).forEach((id) => { extras += extraDef(id).price; });
  const bundleExtras = BUNDLE.reduce((s, id) => s + extraDef(id).price, 0);
  const bundle = c.pkg === 'endgame' ? PRICING.endgameDiscount * (core + bundleExtras) : 0;
  if (isExpress(c)) hours *= PRICING.express.timeFactor;
  const raw = core + extras - bundle;
  const charSave = base * mult * n - core;   // what the multi-character discount takes off
  return { total: pretty(raw), wasBundle: pretty(raw + bundle), was: pretty(raw + bundle + charSave), charSave, raw, core, extras, bundle, hours, base };
}
const PKG = {
  basic:   () => cfgWith({ pkg: 'basic' }),
  express: () => cfgWith({ pkg: 'express' }),
  endgame: () => cfgWith({ pkg: 'endgame', to: 90, extras: new Set([...state.extras].filter((id) => !BUNDLE.includes(id))) }),
};
const hrs = (h) => (h < 10 ? Math.round(h * 2) / 2 : Math.round(h));   // 3.6 → 3.5, 6 → 6, 10.4 → 10
const fmtLong = (h) => (h < 1 ? `${Math.max(1, Math.round(h * 60))} minutes` : `${hrs(h)} hours`);
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

const extraPrice = (x, locked) => locked ? 'Included' : x.was ? `${money(pretty(x.price))}<s>${money(pretty(x.was))}</s>` : '+' + money(pretty(x.price));
$('#extras').innerHTML = PRICING.extras.map((x) => `
  <label class="check xrow" data-xrow="${x.id}"><input type="checkbox" data-extra="${x.id}"><span class="box"><svg viewBox="0 0 16 16"><use href="#i-check"/></svg></span>
    <span class="xt"><b>${x.label}</b><span class="p ${x.was ? 'hot' : ''}">${extraPrice(x, false)}</span><small>${x.desc}</small></span></label>`).join('');

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
  const q = quote(state);

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
    $('.pp', b).innerHTML = k === 'endgame' && pq.bundle ? `${money(pq.total)}<s>${money(pq.wasBundle)}</s>` : money(pq.total);
    if (k === 'basic') $('small', b).textContent = `Ready ${fmtH(std.hours)}`;
    if (k === 'express') $('small', b).textContent = `Ready ${fmtH(exp.hours)} · ${Math.round((1 - PRICING.express.timeFactor) * 100)}% faster`;
    if (k === 'endgame') {
      const sv = $('.save', b);
      sv.hidden = !pq.bundle; sv.textContent = `-${Math.round(PRICING.endgameDiscount * 100)}%`;
    }
  });

  // first-screen time chip follows the chosen range
  $('#chipTimeText').innerHTML = `<b>${from}→${to} ${fmtH(std.hours)}</b> · ${fmtH(exp.hours)} with Express`;

  // the Piloted review is shown only while Piloted is chosen
  $('.mquote').hidden = state.method !== 'piloted';

  // methods
  const piloted = quote(cfgWith({ method: 'piloted' }));
  $$('#methods .mc').forEach((b) => {
    const m = b.dataset.m, d = pretty(quote(cfgWith({ method: m })).raw - piloted.raw);
    b.setAttribute('aria-checked', state.method === m);
    $('em', b).textContent = m === 'piloted' ? '' : '+' + money(d);
  });

  // characters
  $('#cVal').textContent = state.chars;
  $('#cMinus').disabled = state.chars === CHAR_STEPS[0];
  $('#cPlus').disabled = state.chars === CHAR_STEPS.at(-1);
  const n = state.chars, single = quote(cfgWith({ chars: 1 })).core;
  const ct = $('#charTag'); ct.hidden = n === 1; ct.textContent = `-${Math.round(PRICING.charDiscount[n] * 100)}%`;
  $('#charNote').textContent = n === 1
    ? 'Add alts and save up to 20%'
    : `${money(pretty(q.core / n))} each · you save $${Math.floor(single * n - q.core)}`;

  // extras: the ones inside "Endgame ready" are ticked and locked; the rest stay free to toggle
  PRICING.extras.forEach((x) => {
    const locked = state.pkg === 'endgame' && BUNDLE.includes(x.id);
    const row = $(`[data-xrow="${x.id}"]`), inp = $('input', row);
    inp.checked = locked || state.extras.has(x.id);
    inp.disabled = locked;
    row.classList.toggle('locked', locked);
    $('.p', row).innerHTML = extraPrice(x, locked);
  });

  // summary (O5)
  const eta = fmtH(q.hours);
  $('#price').textContent = money(q.total);
  const off = q.was > q.total ? Math.round((1 - q.total / q.was) * 100) : 0;
  const pw = $('#priceWas'); pw.hidden = !off; pw.textContent = off ? money(q.was) : '';
  const pt = $('#priceTag'); pt.hidden = !off; pt.textContent = off ? `-${off}%` : '';
  $('#eta').textContent = fmtLong(q.hours);
  $('#mPrice').textContent = money(q.total);
  $('#mEta').textContent = `starts ~15 min · ready ${eta}`;
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
  if (state.pkg === 'endgame' && t !== 90) { BUNDLE.forEach((id) => state.extras.add(id)); state.pkg = 'express'; }
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
    if (p === 'mine') Object.assign(state, { mode: 'mine', to: 90, from: Math.min(state.from, 89) });
    if (p === 'custom') state.mode = 'custom';
    render();
    if (p === 'mine') { el.from.focus(); }
  } else if ((b = t('.pkg'))) {
    const c = PKG[b.dataset.k]();
    Object.assign(state, { pkg: c.pkg, extras: c.extras, to: c.to });
    if (state.to === 90 && state.from === 80 && state.mode === 'custom') state.mode = 'pop';
    render();
  } else if ((b = t('.mc'))) {
    state.method = b.dataset.m; render();
  } else if (t('#cMinus') || t('#cPlus')) {
    const i = CHAR_STEPS.indexOf(state.chars) + (t('#cPlus') ? 1 : -1);
    state.chars = CHAR_STEPS[clamp(i, 0, CHAR_STEPS.length - 1)]; render();
  } else if (t('#compare')) {
    openCompare();
  }
});
$('#opts').addEventListener('change', (e) => {
  if (e.target.name === 'region') state.region = e.target.value;
  if (e.target.dataset.extra) {
    if (!e.target.disabled) e.target.checked ? state.extras.add(e.target.dataset.extra) : state.extras.delete(e.target.dataset.extra);
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
  p.set('region', state.region); p.set('chars', state.chars); p.set('method', state.method);
  p.set('pkg', state.pkg);
  if (state.extras.size) p.set('extras', [...state.extras].join(','));
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
  if (CHAR_STEPS.includes(+p.get('chars'))) state.chars = +p.get('chars');
  state.pkg = ['basic', 'express', 'endgame'].includes(p.get('pkg')) ? p.get('pkg') : p.get('express') === '1' ? 'express' : 'basic';
  (p.get('extras') || '').split(',').forEach((id) => { if (PRICING.extras.some((x) => x.id === id) && !(state.pkg === 'endgame' && BUNDLE.includes(id))) state.extras.add(id); });
  const f = parseInt(p.get('from'), 10), t = parseInt(p.get('to'), 10);
  if (f && t) { state.from = clamp(f, 1, 89); state.to = clamp(t, state.from + 1, 90); }
  if (state.pkg === 'endgame' && state.to !== 90) state.pkg = 'express';
  state.mode = ['pop', 'full', 'mine', 'custom'].includes(p.get('mode')) ? p.get('mode')
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
  document.body.classList.remove('lock');
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
    return `<section class="cmpcol${sel ? ' sel' : ''}">
      <h4>${m.name}</h4>
      ${rows.map(([label, fn]) => `<div class="cr"><small>${label}</small><p>${fn(id, m)}</p></div>`).join('')}
      <div class="cr"><small>Price</small><p><b>${money(q.total)}</b>${id === 'piloted' ? '' : ` <em>+${money(pretty(q.raw - base.raw))}</em>`}</p></div>
      <button type="button" class="btn ${sel ? 'solid' : 'ghost'}" data-pick="${id}">${sel ? 'Selected' : 'Choose'}</button>
    </section>`;
  }).join('')}</div>`, true);
}
$('#sheetBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]');
  if (b) { state.method = b.dataset.pick; render(); closeSheet(); }
});

const SHEETS = {
  guarantee: ['100% money-back guarantee', '<p>If we cannot deliver your order, you get your money back. Disputes are handled by live support 24/7.</p><p class="muted">Prototype copy — replace with the real policy text.</p>'],
  reviews: [`Trustpilot ${TRUST.rating} · ${TRUST.reviews} reviews`, '<p>Overgear is rated Excellent on Trustpilot, based on verified customer reviews.</p><p class="muted">Prototype: this would link out to the Trustpilot page.</p>'],
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-sheet]');
  if (a) { e.preventDefault(); openSheet(...SHEETS[a.dataset.sheet]); return; }
  // M4: on touch screens the "?" hints open a sheet instead of a hover tooltip
  const q = e.target.closest('.q');
  if (q && noHover()) openSheet('Details', `<p>${q.dataset.tip}</p>`);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!sheet.hidden) closeSheet(); else if (!drawer.hidden) closeDrawer();
});

/* ================= Wishlist, cart, drawer (D5, M6) ================= */
const CROSS = [
  { id: 'gearing', title: 'Gearing', line: 'M+, raid, tier set, or PvP gear', price: pretty(53.87), img: 'gearing' },
  { id: 'omnium', title: 'Omnium Folio', line: 'All 5 rune rows unlocked in about 4 hours', price: pretty(5.38), img: 'omnium-folio' },
  { id: 'm0', title: 'Mythic +0', line: '292 ilvl loot, ready for M+4', price: pretty(6.72), img: 'mythic-0' },
];
let wish = store.get('og:wish', 0);
let cart = store.get('og:cart3', []);
const heart = $('#heart');
const saveCart = () => store.set('og:cart3', cart);
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

function describe(c) {
  const q = quote(c), m = METHODS[c.method];
  const parts = [`${c.from} → ${c.to}`, m.name, isExpress(c) ? 'Express' : 'Standard', `${c.chars} character${c.chars > 1 ? 's' : ''}`];
  const ex = [...allExtras(c)].map((id) => extraDef(id).label);
  return { id: 'lvl-' + Date.now(), img: 'hero', title: 'WoW Midnight Leveling', meta: parts.join(' · '), extras: ex, price: q.total, was: q.was, method: c.method, eta: fmtH(q.hours) };
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
function drawerHTML() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  const items = cart.length ? cart.map((i, idx) => {
    const off = i.was > i.price ? Math.round((1 - i.price / i.was) * 100) : 0;
    return `
    <div class="litem">
      <img src="assets/img/${i.img || 'hero'}.avif" alt="" width="64" height="64">
      <div class="li-main"><b>${i.title}</b><small>${i.meta}</small>${i.extras?.length ? `<small>+ ${i.extras.join(', ')}</small>` : ''}${i.eta ? `<small>Ready ${i.eta}</small>` : ''}</div>
      <div class="lr">
        <span class="lp"><b>${money(i.price)}</b>${off ? `<s>${money(i.was)}</s>` : ''}</span>
        ${off ? `<span class="disc">-${off}%</span>` : ''}
        <button type="button" class="rm" data-rm="${idx}" aria-label="Remove">Remove</button>
      </div>
    </div>`;
  }).join('') : '<p class="muted">Your cart is empty.</p>';
  const left = CROSS.filter((c) => !cart.some((i) => i.cid === c.id));
  const next = left.map((c) => `
    <div class="xcard">
      <img src="assets/img/${c.img}.avif" alt="" loading="lazy" decoding="async">
      <div><b>${c.title}</b><small>${c.line}</small></div>
      <button type="button" class="btn ghost" data-add="${c.id}">+ ${money(c.price)}</button>
    </div>`).join('');
  const foot = cart.length ? `
    <div class="dfoot">
      <div class="subtotal"><span>Subtotal</span><span class="cashback">Cashback 1% <svg class="coin"><use href="#i-coin"/></svg></span><b>${money(total)}</b></div>
      <div class="wallets">
        <button type="button" class="wallet apple" data-pay>&#63743; Pay</button>
        <button type="button" class="wallet google" data-pay><span>G</span> Pay</button>
      </div>
      <button type="button" class="btn solid wide" data-pay>Pay by card</button>
      <p class="dnote"><svg class="ic"><use href="#i-shield"/></svg>100% money-back guarantee</p>
    </div>` : '';
  return `<div class="dscroll">${items}${left.length ? `<h4 class="nx">You might also need</h4>${next}` : ''}</div>${foot}`;
}
function renderDrawer() { $('#dBody').innerHTML = drawerHTML(); }
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
drawer.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) return closeDrawer();
  const rm = e.target.closest('[data-rm]');
  if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); counters(); return renderDrawer(); }
  const add = e.target.closest('[data-add]');
  if (add) {
    const c = CROSS.find((x) => x.id === add.dataset.add);
    cart.push({ id: c.id + Date.now(), cid: c.id, img: c.img, title: c.title, meta: c.line, extras: [], price: c.price });
    saveCart(); counters(); bump('cartCnt'); return renderDrawer();
  }
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

/* ================= Cookie banner ================= */
const cookie = $('#cookie');
if (store.get('og:cookie', false)) cookie.hidden = true;
cookie.addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (!b) return;
  if (b.dataset.c !== 'customize') store.set('og:cookie', b.dataset.c);
  cookie.hidden = true;
});

/* ================= Mobile sticky buy bar (M1): shown while the in-card buy block is off screen ================= */
(function () {
  const bar = $('#mBar'), buy = $('.buy');
  if (!('IntersectionObserver' in window)) return;
  let buyVisible = false;
  const upd = () => {
    const on = isMobile() && !buyVisible && cookie.hidden;
    bar.hidden = false; bar.classList.toggle('show', on);
    document.body.classList.toggle('has-mbar', on);
    document.documentElement.style.setProperty('--mbar-h', on ? bar.offsetHeight + 'px' : '0px');
  };
  new IntersectionObserver((e) => { buyVisible = e[0].isIntersecting; upd(); }).observe(buy);
  addEventListener('resize', upd);
  cookie.addEventListener('click', () => setTimeout(upd, 0));
  upd();
})();

render();
