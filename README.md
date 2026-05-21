# Culinary Quality Control · Bella & Bona

The daily QC instrument for the Bella & Bona kitchen — temperatures, weights, and dispatch logs measured against the recipe, recorded against the day, and surfaced the moment something drifts.

**Live:** https://berlinkitchen123-blip.github.io/Culinary-Quality-Control/

## Stack

- Vanilla HTML / CSS / ES modules — no build step required for the dashboard.
- Editorial design system in `brand.css` (Fraunces serif + Inter sans + JetBrains Mono).
- Optional Firebase Realtime Database hook in `firebase-config.js`.

## Files

| File | Role |
|---|---|
| `index.html` | Main dashboard shell |
| `brand.css` | Editorial design system (typography, palette, components) |
| `modern-ui.js` | Dashboard controller — renders cards, table, modals |
| `view-lifecycle.js` | Lifecycle (stage tracking) view |
| `view-warmers.js` | Warmer slot grid view |
| `Kitchen.html`, `Dispatcher.html`, `Menu.html`, etc. | Saved snapshots of the live kitchen.bellabona.com React app |

## Run locally

No build required — just open `index.html` in a browser, or serve with any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

GitHub Pages serves from the `main` branch. Pushes deploy automatically.
