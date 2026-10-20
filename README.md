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

## Product hypotheses in the prototype

| ID | What changed |
|---|---|
| O1, M3 | Range presets: `80 → 90 Popular`, `1 → 90`, `My level → 90`, `Custom range`. Numeric fields (`inputmode=numeric`) everywhere; the dual slider only on mouse desktops, only in Custom |
| O2 | Three method cards: for whom / what you share / your time, with the price delta. The same Piloted note appears in the cart |
| O3 | Speed block: Standard ~N h / Express ~N h, +$X, computed from the range |
| O4 | Five rare add-ons sit in "More add-ons (5)", each with a price and one line "what you get · what is needed" |
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
| D5, M6 | "You may also like" moved into the cart drawer after Add to cart, as "What's next after 90". The drawer puts Apple Pay and Google Pay first |
| M1, M8 | Sticky bottom bar with price, ETA and Add to cart, plus a trust strip above it. It shows while the in-card buy block is off screen; the chat bubble is part of the bar, so they cannot overlap |
| M2 | Configurator right after the title and badges; "Your Wins" and "How It Works" are folds on phones. Not done: the PostHog check of how many mobile visits reach the configurator |
| M4 | On touch screens "?" hints open a bottom sheet; method cards are full width; rows are at least 44 px |
| M5 | Add-on labels are short, no emoji, description on a second line |
| M7 | Lazy images and `content-visibility` on the SEO text and footer. Not done: LCP/INP measurement on a mid-range Android |

## Assumptions to replace later

- **Pricing and timing** (`PRICING` in `app.js`) are made up to match one data point of the saved page: 80→90, Piloted, 1 character = $23.56. Surcharges (Express +30%, Self-play +70%, Remote +5%) and add-on prices come from the page. Characters now use the labelled discounts (5 / 10 / 20%) on top of a per-character price instead of the site's "+90%…+320%" figures. Express cuts time by 40%.
- **Copy to confirm with ops/legal:** what Piloted shares and keeps (login via VPN; email and authenticator stay with the client), the Self-play and Remote lines, the money-back text, and the FAQ answers (they were collapsed in the saved page).
- Trustpilot count 36,206 is taken from the brief, not from the page.
- The 4-character option is dropped from the stepper; the cart, checkout, chat and custom offer are stubs.
- Font files: TT Interphases Pro is downloaded from overgear.com into `assets/fonts/` (Latin subset only; Cyrillic would fall back to Arial).
