#!/usr/bin/env node
// Radius audit for this page. baseui's radius-check.js only sees nested corners whose inset is smaller than the outer
// radius; this adds the ladder rules of the page itself:
//   - every rounded corner sits on the scale 4 · 6 · 10 · 16 · 20 (pills and circles are skipped);
//   - a child is never rounder than its nearest rounded ancestor.
//
//   python3 -m http.server 8000 &
//   node tools/radius-ladder.mjs http://localhost:8000     (needs: npm i -D playwright)
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://localhost:8000').replace(/\/$/, '');
const SCALE = new Set([0, 4, 6, 10, 16, 20]);

const audit = (scale) => {
  const ok = new Set(scale), bad = [];
  const R = (cs) => Math.max(...['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((c) => parseFloat(cs[`border${c}Radius`]) || 0));
  const name = (el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`;
  for (const el of document.body.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = R(cs);
    if (!r || r >= Math.min(rect.width, rect.height) / 2 - 0.5) continue;
    if (!ok.has(r)) bad.push(`off the scale, ${r}px: ${name(el)}`);
    for (let a = el.parentElement; a; a = a.parentElement) {
      const ar = R(getComputedStyle(a));
      if (ar) { if (r > ar) bad.push(`child ${r}px is rounder than parent ${ar}px: ${name(a)} > ${name(el)}`); break; }
    }
  }
  return [...new Set(bad)];
};

const browser = await chromium.launch();
let failed = 0;
for (const [label, viewport, opts] of [['desktop', { width: 1440, height: 900 }, {}], ['phone', { width: 390, height: 844 }, { hasTouch: true, isMobile: true }]]) {
  const ctx = await browser.newContext({ viewport, ...opts });
  await ctx.addInitScript(() => { try { localStorage.setItem('og:cookie', '"accept"'); } catch {} });
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await page.waitForTimeout(600);
  const states = [['default', async () => {}],
    ['Ultimate', async () => { await page.click('[data-k=ultimate]'); }],
    ['compare sheet', async () => { await page.locator('#compare').scrollIntoViewIfNeeded(); await page.click('#compare'); await page.waitForTimeout(400); }],
    ['cart drawer', async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(300); const add = viewport.width < 768 ? '#mAdd' : '#add'; await page.click(add); await page.waitForTimeout(500); }]];
  for (const [name, step] of states) {
    await step();
    const bad = await page.evaluate(audit, [...SCALE]);
    for (const b of bad) { console.log(`${label} · ${name}: ${b}`); failed++; }
  }
}
await browser.close();
console.log(failed ? `\nRadius ladder: ${failed} problem(s).` : 'Radius ladder: every corner is on the scale and no child is rounder than its parent.');
process.exit(failed ? 1 : 0);
