# overgear

Local interactive rebuild of <https://overgear.com/games/wow/midnight-leveling> (dark theme), used as a base for prototyping. Static files, no build step, no network.

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

| File | Contents |
|---|---|
| `index.html` | The page: header, category sidebar, content, order card, footer |
| `styles.css` | Live-site dark tokens (`--n1…n10`, `--brand*`) and layout, responsive down to 390px |
| `app.js` | Behaviour and the `PRICING` model |
| `assets/` | Logo, images, payment icons and illustrations taken from the saved page, Geist font |

## What is interactive

- Order card: region, level range (two inputs and a dual slider, 1–90), Express, number of characters, boost method, extra options. Price and completion time recalculate live; state is kept in the URL.
- Add to cart (header counter and toast), wishlist heart, tooltips on the `?` marks.
- Sidebar accordions, "Boost methods explained" and FAQ accordions, review and "You may also like" carousels, cookie banner (remembered in localStorage), mobile menu.

## Assumptions to replace later

- **Pricing and timing model** (`PRICING` in `app.js`) is made up to match the one data point on the saved page: 80→90, Piloted, 1 character = $23.56, 6h 15m. The percentage surcharges (Express +30%, Self-play +70%, Remote +5%, 2–5 characters +90/180/255/320%) and the extra-option prices are taken from the page. How they combine (additive on the base price) and the per-level curve are guesses.
- **FAQ answers and "Boost methods explained"** were collapsed in the saved page, so their text is written from the rest of the page copy.
- Font is Geist (from baseui) instead of the site's TT Interphases.
