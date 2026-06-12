# 🚐 WayOut Camper Quest

A fun, self-contained 2D web game (Angry-Birds-style chunky cartoon art) where a
family rents a **WayOut UAE** camper van and road-trips across the real Emirates,
collecting tokens and scoring points at genuine camping spots. Discovering **rare**
and **legendary** places gives big point bonuses and levels you up. Every stop opens
its **real Google Maps listing** so you can see the actual place and its photos.

This is a standalone fan project for [wayoutuae.com](https://wayoutuae.com) — it has
no build step and no dependencies.

## Play it

Just open `index.html` in any modern browser:

```bash
# from this folder
python3 -m http.server 8080
# then visit http://localhost:8080
```

Or simply double-click `index.html`.

> The in-game Google Maps panels load real `google.com/maps` embeds, so an internet
> connection is needed to view the map of each spot (the game itself runs offline).

## How to play

1. **Start Adventure**, then pick one of WayOut's camper vans and your family crew.
2. Tap any **glowing spot** on the UAE map to drive there. Driving costs ⛽ fuel
   (return to the Dubai base or rest at camp to top up). Solar Nomad regenerates fuel.
3. Each stop awards ⭐ points, 🪙 tokens and ✨ XP. Pass floating 🪙 tokens on the
   road to grab extras.
4. **Rarer = better.** Common → Uncommon → Rare → Legendary spots give escalating
   rewards. Fill your XP bar to **level up** (higher levels boost every point payout).
5. Discover all spots to become a **Trailblazer**.

## What's real

- **The vans** are based on WayOut's actual fleet: Mercedes 516, Sprinter 4×4,
  Dodge Ram 4×4, and a solar camper — each with different speed / comfort /
  off-road / fuel-economy stats.
- **The map** places each camping spot at its **true latitude/longitude**, projected
  onto a stylised UAE map.
- **The spots** are real, popular UAE camping locations: Al Qudra Lakes, Lahbab Red
  Dunes, Umm Al Quwain Beach, Hatta Dam, Wadi Shawka, Al Aqah Beach, Fossil Rock
  (Mleiha), Jebel Jais, Jebel Hafeet, and Tal Moreeb in Liwa (legendary).
- **Each spot panel** embeds that location's real Google Maps listing, plus links to
  open its photos and get directions.

## Tech

- One file, zero dependencies: HTML + CSS + a `<canvas>` game loop in vanilla JS.
- All characters and vans are drawn procedurally on the canvas (no image assets).
- Sound effects are generated with the Web Audio API (mute toggle in the HUD).

## Tuning

Game data lives at the top of the `<script>` block in `index.html`:

- `VANS` — the fleet and their stats.
- `FAMILY` — selectable characters.
- `SPOTS` — camping locations with real coordinates, rarity and descriptions.
- `RARITY` — point / token / XP payouts per tier.
