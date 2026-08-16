# Dubai Kindness Quest

A calm, **kindness-based** open-world roam inspired by the freedom of GTA-style
city games — but with the aggression removed. You play a new **expat** arriving
in Dubai. There are no weapons and no fighting; the only goal is to explore the
city and help the people you meet.

## What you can do
- **Walk** the sandy streets on foot.
- **Drive** a car (faster on the roads).
- **Fly** a small seaplane from the airstrip, over the whole city and sea.
- **Swim** in the turquoise sea along the coast.
- **Help** citizens who need a hand — directions, water, a friendly hello.
- **Buy** gifts at the store and give them to people for greater kindness.

## The store (المتجر)
Every store item is a **real Arabic word**, shown with its transliteration and
English meaning — no invented or random words:

| Arabic | Transliteration | Meaning |
|---|---|---|
| ماء | Maa' | Water |
| قهوة | Qahwa | Coffee |
| تمر | Tamr | Dates |
| خبز | Khubz | Bread |
| ورد | Ward | Flowers |
| هدية | Hadiya | Gift |
| خريطة | Khareeta | Map |
| حذاء | Hidhaa' | Shoes |

Your reputation rises through real Arabic tiers: ضيف (Guest) → صديق (Friend) →
جار (Neighbor) → أهل (Family) → كريم (Generous).

## Controls
- **Move:** WASD / Arrows · left-half touch joystick · gamepad stick/d-pad
- **Help / open store (♥):** Space · A button · on-screen ♥ button
- **Get in / out of a vehicle (E):** E · X button · on-screen E button

## Tech
- Single-page HTML5 canvas game. Fixed-timestep loop, seeded world.
- Touch + keyboard (physical key codes) + gamepad from the start.
- All player-visible text lives in `strings.js` (localisation = swap the data).
- Art generated with Higgsfield **Nano Banana Pro**; sprites are keyed to
  transparency in-browser, with clean procedural fallbacks so the game always
  stays playable.

## Layout (Higgsfield deploy-ready)
```
index.html   game page (canvas + HUD + store/intro overlays)
game.js      world, movement modes, NPCs, store, input, render
strings.js   all player-visible strings incl. the Arabic store vocabulary
logic.js     required solo rules stub (no server logic)
design/      assets manifest + style formula
assets/      bundled keyed sprites (populated at deploy packaging)
```
