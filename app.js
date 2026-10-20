/* Overgear · WoW Midnight Leveling prototype.
   Everything runs locally: no backend, no network. Prices and times are an
   assumed model (see PRICING) calibrated so that 80→90 · Piloted · 1 character = $23.56 / 6h 15m,
   like the live page. */

const PRICING = {
  // price of one level step, by the level you start from
  perLevel: (l) => (l < 80 ? 0.28 : 2.356),
  // hours of work for one level step
  hours: (l) => (l < 80 ? 4 / 79 : 0.6),
  startMinutes: 15,
  express: { pct: 0.30, timeFactor: 0.6 },
  chars: { 1: 0, 2: 0.90, 3: 1.80, 4: 2.55, 5: 3.20 },   // additive, % of base
  method: { piloted: 0, self: 0.70, remote: 0.05 },
  cashback: 0.01,
  extras: [
    { id: 'ulatek',   label: "🐍 The Curse of Ula'tek campaign", price: 24.68, tip: "Completes the Ula'tek campaign chain on your character." },
    { id: 'gear292',  label: '⚔️ 292&nbsp;ilvl gear',            price: 53.87, tip: 'Full set of 292 ilvl gear, ready for Mythic+ and Delves.' },
    { id: 'honor',    label: '🛡️ Honor gear (331 ilvl)',          price: 20.19, tip: 'Honor gear for PvP, 331 ilvl.' },
    { id: 'campaign', label: '📜 Midnight leveling campaign',     price: 36.81, was: 46.01, tip: 'Finish the Midnight leveling campaign along the way. 20% off with a leveling order.' },
    { id: 'stream',   label: '🔴 Live stream',                    price: 11.23, tip: 'Watch your booster play live.' },
  ],
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => '$' + n.toFixed(2);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- Sidebar ---------- */
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

/* ---------- Footer ---------- */
const FCOLS = {
  Overgear: ['About us', 'Work with us', 'Guides', 'Contact us', 'Get help', 'Guarantees'],
  Legal: ['Terms and conditions', 'Privacy policy', 'Refund policy', 'Cookies policy', 'Consent Preferences', 'Credential on File Agreement'],
  'World of Warcraft': ['WoW Boosting', 'WoW Gold', 'Mythic+ Dungeon boost', 'WoW Raid Boost', 'PvP Boosting', 'WoW Power Leveling'],
  'WoW Mists of Pandaria': ['Mists of Pandaria Boosting', 'Mists of Pandaria Gold', 'Mists of Pandaria Power Leveling', 'Mists of Pandaria Raids', 'Mists of Pandaria PvP Boosting'],
};
$('#fcols').innerHTML = Object.entries(FCOLS).map(([h, l]) => `<div><h6>${h}</h6>${l.map((x) => `<a href="#">${x}</a>`).join('')}</div>`).join('');
const GAMES = 'Apex Legends|New World|EFT|Destiny 2|PoE|Fellowship|Lost Ark|Valorant|Diablo Immortal|EA Sports FC 27|Call of Duty|Diablo 4|World of Tanks|Counter-Strike 2|WoW Classic Hardcore|WoW Classic Era|Season of Discovery|The Finals|League of Legends|Last Epoch|Helldivers 2|Dota 2|Rainbow 6 Siege|The First Descendant|Albion Online|Overwatch|Genshin Impact|Arena Breakout Infinite|Old School Runescape|Warhammer 40k Space Marine 2|WoW Classic Fresh|Path of Exile 2|Marvel Rivals|Deadlock|Delta Force|Where Winds Meet|Guild Wars 2|Final Fantasy XIV|Diablo 2 Resurrected|Diablo 3|The Elder Scrolls Online|Monster Hunter Wilds|The Division 2|Dune Awakening|Sea of Thieves|Elden Ring Nightreign|Borderlands 4|Destiny Rising|Battlefield 6|ARC Raiders|Active Matter|Marathon|Arknights: Endfield|NBA 2K|WoW Forever|WARDOGS|Fortnite|Gears of War: E-Day|Torchlight: Infinite|Warframe'.split('|');
$('#fgames').innerHTML = GAMES.map((g) => `<a href="#">${g}</a>`).join('');

/* ---------- Carousels ---------- */
function carousel(track, prev, next) {
  const upd = () => {
    if (prev) prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 16;
  prev?.addEventListener('click', () => track.scrollBy({ left: -step() }));
  next.addEventListener('click', () => track.scrollBy({ left: step() }));
  track.addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();
}
carousel($('#revTrack'), $('#revPrev'), $('#revNext'));
carousel($('#alsoTrack'), null, $('#alsoNext'));

/* ---------- Accordions ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest('.acc > button');
  if (!b) return;
  const acc = b.parentElement;
  const open = !acc.classList.contains('open');
  acc.classList.toggle('open', open);
  b.setAttribute('aria-expanded', open);
});

/* ---------- Order form ---------- */
const el = {
  from: $('#from'), to: $('#to'), rFrom: $('#rFrom'), rTo: $('#rTo'), fill: $('#fill'),
  express: $('#express'), chars: $('#chars'), price: $('#price'), eta: $('#eta'),
  add: $('#add'), addLabel: $('#addLabel'), extras: $('#extras'),
};

el.extras.innerHTML = PRICING.extras.map((x) => `
  <label class="check"><input type="checkbox" data-extra="${x.id}"><span class="box"><svg viewBox="0 0 16 16"><use href="#i-check"/></svg></span>
    <span class="t">${x.label}</span>
    <span class="p ${x.was ? 'hot' : ''}">${x.was ? `<s>${money(x.was)}</s>${money(x.price)}` : '+' + money(x.price)}</span>
    <span class="q" tabindex="0" data-tip="${x.tip}">?</span></label>`).join('');

const state = { from: 80, to: 90 };
const radio = (name) => $(`input[name="${name}"]:checked`).value;

function quote() {
  let base = 0, hours = 0;
  for (let l = state.from; l < state.to; l++) { base += PRICING.perLevel(l); hours += PRICING.hours(l); }
  const ex = el.express.checked;
  const pct = (ex ? PRICING.express.pct : 0) + PRICING.chars[el.chars.value] + PRICING.method[radio('method')];
  let total = base * (1 + pct);
  $$('[data-extra]:checked').forEach((c) => { total += PRICING.extras.find((x) => x.id === c.dataset.extra).price; });
  if (ex) hours *= PRICING.express.timeFactor;
  const mins = Math.round(hours * 60 + PRICING.startMinutes);
  return { total, mins };
}
function fmtTime(m) {
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  const p = [];
  if (d) p.push(`${d} day${d > 1 ? 's' : ''}`);
  if (h) p.push(`${h} hour${h > 1 ? 's' : ''}`);
  if (mm && !d) p.push(`${mm} minute${mm > 1 ? 's' : ''}`);
  return p.join(' ') || '15 minutes';
}

function render() {
  const { from, to } = state;
  el.from.value = from; el.to.value = to;
  el.rFrom.value = from; el.rTo.value = to;
  const pos = (v) => `calc(8px + (100% - 16px) * ${(v - 1) / 89})`;
  el.fill.style.left = pos(from); el.fill.style.right = `calc(100% - ${pos(to)})`;
  el.rFrom.style.zIndex = from > 45 ? 3 : 1; el.rTo.style.zIndex = 2;
  const q = quote();
  el.price.textContent = money(q.total);
  el.eta.textContent = fmtTime(q.mins);
  el.add.disabled = false;
  sync();
}

function setRange(f, t, who) {
  f = clamp(Math.round(f), 1, 89); t = clamp(Math.round(t), 2, 90);
  if (who === 'from') f = Math.min(f, t - 1); else t = Math.max(t, f + 1);
  state.from = f; state.to = t; render();
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
$('#opts').addEventListener('change', render);

/* ---------- URL state (shareable, same idea as the live page) ---------- */
function sync() {
  const p = new URLSearchParams();
  p.set('from', state.from); p.set('to', state.to);
  p.set('region', radio('region')); p.set('chars', el.chars.value); p.set('method', radio('method'));
  if (el.express.checked) p.set('express', '1');
  const ex = $$('[data-extra]:checked').map((c) => c.dataset.extra);
  if (ex.length) p.set('extras', ex.join(','));
  try { history.replaceState(null, '', '?' + p); } catch {}
}
(function restore() {
  const p = new URLSearchParams(location.search);
  const set = (name, v) => { const r = $(`input[name="${name}"][value="${v}"]`); if (r) r.checked = true; };
  if (p.get('region')) set('region', p.get('region'));
  if (p.get('method')) set('method', p.get('method'));
  if (PRICING.chars[p.get('chars')] !== undefined) el.chars.value = p.get('chars');
  el.express.checked = p.get('express') === '1';
  (p.get('extras') || '').split(',').forEach((id) => { const c = $(`[data-extra="${id}"]`); if (c) c.checked = true; });
  const f = parseInt(p.get('from'), 10), t = parseInt(p.get('to'), 10);
  if (f && t) { state.from = clamp(f, 1, 89); state.to = clamp(t, state.from + 1, 90); }
})();
render();

/* ---------- Wishlist, cart, toast ---------- */
let wish = store.get('og:wish', 0), cart = store.get('og:cart', 0);
const heart = $('#heart');
function counters() {
  for (const [id, n] of [['wishCnt', wish], ['cartCnt', cart]]) {
    const c = document.getElementById(id);
    c.textContent = n; c.hidden = !n;
  }
  heart.setAttribute('aria-pressed', wish > 0);
}
function bump(id) { const c = document.getElementById(id); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
heart.addEventListener('click', () => { wish = wish ? 0 : 1; store.set('og:wish', wish); counters(); bump('wishCnt'); });

const toast = $('#toast'); let tt;
function say(text, link = true) {
  $('#toastText').textContent = text;
  $('#toastCart').hidden = !link;
  toast.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 3500);
}
el.add.addEventListener('click', () => {
  cart += 1; store.set('og:cart', cart); counters(); bump('cartCnt');
  el.add.classList.add('done'); el.addLabel.textContent = 'Added to cart';
  setTimeout(() => { el.add.classList.remove('done'); el.addLabel.textContent = 'Add to cart'; }, 1600);
  const q = quote();
  say(`Midnight Leveling ${state.from}→${state.to} · ${money(q.total)}`);
});
$('#cartBtn').addEventListener('click', () => say(cart ? `${cart} item${cart > 1 ? 's' : ''} in cart` : 'Your cart is empty', false));
$('#toastCart').addEventListener('click', (e) => e.preventDefault());
$('#customBtn').addEventListener('click', () => say('Prototype: custom offer form is not built yet', false));
counters();

/* ---------- Cookie banner ---------- */
const cookie = $('#cookie');
if (store.get('og:cookie', false)) cookie.hidden = true;
cookie.addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (!b) return;
  if (b.dataset.c !== 'customize') store.set('og:cookie', b.dataset.c);
  cookie.hidden = true;
});
