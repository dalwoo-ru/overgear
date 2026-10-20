# overgear

Local interactive rebuild of <https://overgear.com/games/wow/midnight-leveling> (dark theme), used as a base for prototyping. Static files, no build step, no network.

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

| File | Contents |
|---|---|
| `index.html` | The page: header, category sidebar, content, order card, footer |
| `styles.css` | Live-site dark tokens (`--n1…n10`, `--brand*`) and layout, responsive; breakpoints follow the site (tablet 768, desktop 1200). On mobile the order card moves under the title and a sticky "Add to cart" bar appears while the in-card price block is off screen |
| `app.js` | Behaviour and the `PRICING` model |
| `assets/` | Logo, images, payment icons and illustrations taken from the saved page, Geist font |

## Page structure and information priority

Desktop (≥1200px): main block on the left, a sticky right column.

| Block | Contents, in reading order |
|---|---|
| Main · title | Breadcrumbs, H1, Trustpilot and orders line, three key USP tags (start in ~15 min, 1–90 in ~10 h / 6 h with Express, full AFK), the one-line promise, three short wins in one row |
| Main · form | Everything is left-aligned. 1 "Region of your character" (Europe, America, with flags), then 2 Leveling range → 3 Package (Express shows its time and how much faster it is) → 4 Boost method (one short line per method; choosing 2, 3 or 5 characters shows a bright green "-5% / -10% / -20%" tag next to the label, and the buy block shows the new price, the struck old price and a total "-N%" tag; the table is in Compare methods; Characters sits under it as part of the same step, hint on one line, stepper below) → 5 Add-ons, all visible. Endgame ready (20% off boost + gear + campaign, "-20%" tag; the new price comes first, then the struck old one) locks its two add-ons (ticked, greyed, "Included"); other add-ons can be added on top and the package stays selected |
| Main · more information | How It Works (follows the method), reviews, FAQ, custom offer, SEO text behind "Read more" |
| Right column | The buy block, laid out like the original: price with Cashback, start time, completion time, Add to cart, payment icons, money-back line. It is the page accent (brand border and glow). Below it, a calmer "Why players choose Overgear" card |

The right column is about 640px tall, so on a 1366×768 screen both cards stay in view while the page scrolls. On tablets and phones the order is: title → form → order card → why us → more information, and a sticky bottom bar (price, ETA, Add to cart, chat, plus a trust strip) shows while the order card is off screen.

## Radius system

One ladder on the baseui scale, each nested level = outer − inset: modal 20 (sheet, drawer) · surface 16 (cards, panels) · control 10 (buttons, inputs, tiles) · small 6 (a button inside an input, badges, checkboxes) · tag 4. Pills and circles are skipped. The CSS variables are `--r-modal`, `--r-surface`, `--r-control`, `--r-small`, `--r-tag`.

Two checks, both clean at the moment:

- baseui's `tools/radius-check.js` (concentric corners). It only sees nested corners whose inset is smaller than the outer radius, so it reports nothing on this page, whose paddings are large.
- `tools/radius-ladder.mjs` in this repo: every corner is on the scale and no child is rounder than its parent, on desktop and phone, with Endgame ready, the compare sheet and the cart drawer open. Run `node tools/radius-ladder.mjs http://localhost:8000` (needs Playwright).

## Type scale

| Token | Desktop | Phone |
|---|---|---|
| Body | 16/24 | 14/20 |
| Secondary text and controls | 14/20 | 13/18 |
| Tags and captions | 12/16 | 12/16 |
| H1 | 40/46 | 26/32 |
| H2 | 24/30 | 20/26 |
| Card titles | 16/22 | 15/20 |
| Price | 32/36 | 26/30 |
| Control height | 40 | 44 |

Tags are 36px high on desktop and 28px on phones. Spacing: 28px between form groups on desktop (no divider lines in the form), 56px between content sections. The right column is 404px wide.

## Product hypotheses in the prototype

| ID | What changed |
|---|---|
| O1, M3 | Range presets: `80 → 90 Popular`, `1 → 90`, `My level → 90`, `Custom range`. Numeric fields (`inputmode=numeric`) everywhere; the dual slider only on mouse desktops, only in Custom |
| O2 | Three method cards: for whom / what you share / your time, with the price delta. The same Piloted note appears in the cart |
| O3 | No separate Speed block: the Express package states its time and "N% faster" (computed from the time factor, 40% with the current model) |
| O4 | Add-ons are shown in a two-column grid, each with a price and one line "what you get · what is needed" (collapsing them is parked for now) |
| O5, M8 | Summary under the price: total, start ~15 min, ready ~N h, Trustpilot 4.9 · 36,206 reviews, money-back link |
| O6 | Packages Basic / Express / Endgame ready (90 + Express + 292 gear + campaign, 10% off the pair). Derived from the form, so they stay in sync with the other controls |
| O7 | First-screen badges: "Starts in ~15 min", "1–90 in ~10 h · 6 h with Express" |
| O8 | Characters stepper 1 · 2 · 3 · 5 (4 removed), price per character and saving |
| O9 | "How It Works" text follows the chosen method and range |
| O10 | `GIFT_M10` flag in `app.js`. Off: the copy says "be ready to push your first M+10". On: a free-key line appears |
| D1 | Right column is sticky; the summary and Add to cart stay visible at 1366×768 and 1440×900 |
| D2 | "Compare methods" opens a table (popover on desktop, bottom sheet on phones) with Choose buttons |
| D3 | Order: configurator, wins, how it works, reviews, FAQ, custom offer, SEO text collapsed behind "Read more" |
| D4 | After 20 s idle in the configurator a chat nudge appears (once). Open `?nudge=1500` to see it sooner |
| D5, M6 | "You may also like" moved into the cart drawer, as "What's next after 90". Add to cart just opens the cart (no status line). The cart is 520px wide; the upsell sits right under the items, and the bottom block is pinned: subtotal, Apple Pay and Google Pay first, Pay by card, "100% money-back guarantee · Cashback 1%". Line items use the page's price style: new price, struck old price, discount tag |
| M1, M8 | Sticky bottom bar with price, ETA and Add to cart, plus a trust strip above it. It shows while the in-card buy block is off screen; the chat bubble is part of the bar, so they cannot overlap |
| M2 | Configurator right after the title and badges; "Your Wins" and "How It Works" are folds on phones. Not done: the PostHog check of how many mobile visits reach the configurator |
| M4 | On touch screens "?" hints open a bottom sheet; method cards are full width; rows are at least 44 px |
| M5 | Add-on labels are short, no emoji, description on a second line |
| M7 | Lazy images and `content-visibility` on the SEO text and footer. Not done: LCP/INP measurement on a mid-range Android |

## Assumptions to replace later

- **Pretty prices.** Totals, package prices, method deltas and add-on prices are rounded up to the next .49 or .99 (23.56 → 23.99, 141.00 → 141.49). `PRETTY` in `app.js` switches this to `'whole'` (next whole dollar) or `'off'`. Because each shown price is rounded on its own, a total can differ by up to $0.50 from the sum of the parts.

- **Pricing and timing** (`PRICING` in `app.js`) are made up to match one data point of the saved page: 80→90, Piloted, 1 character = $23.56. Surcharges (Express +30%, Self-play +70%, Remote +5%) and add-on prices come from the page. Characters now use the labelled discounts (5 / 10 / 20%) on top of a per-character price instead of the site's "+90%…+320%" figures. Express cuts time by 40%.
- **Copy to confirm with ops/legal:** what Piloted shares and keeps (login via VPN; email and authenticator stay with the client), the Self-play and Remote lines, the money-back text, and the FAQ answers (they were collapsed in the saved page).
- Trustpilot count 36,206 is taken from the brief, not from the page.
- The 4-character option is dropped from the stepper; the cart, checkout, chat and custom offer are stubs.
- Font files: TT Interphases Pro is downloaded from overgear.com into `assets/fonts/` (Latin subset only; Cyrillic would fall back to Arial).
