# Chiesa - Spirito Santo - Botrugno (Le) - 360° virtual tour

A browser-based 360° tour of the interior of the church, built with plain **HTML, CSS and JavaScript** and the free
[Marzipano](https://www.marzipano.net/) viewer (bundled in `vendor/`). There is no build step, no server code and no
third-party request: fonts and logos are bundled, so the folder can be uploaded to any static host.

- 9 places, linked by walk-to hotspots (the angles come from the Marzipano export supplied with the photos)
- Day view only, in **Italian (default) and English**
- A **Gallery** of close-up photos and videos for each place that has them
- A **Menu** on the right with a floor plan of the church, a place list on the left, zoom, fullscreen and autorotate
- Works on desktop, tablet and phone (touch drag, pinch, mouse wheel, arrow keys)

---

## 1. Run it

Browsers block the tile files when a page is opened by double-click, so use any static server from inside this folder:

```
python -m http.server 8000
```

then open `http://localhost:8000/`. A place can be opened directly with its id: `http://localhost:8000/#altare`.
`?lang=en` or `?lang=it` forces a language (otherwise the last choice is remembered in the browser).

## 2. What is in the folder

| Path | What it is | Edit? |
|---|---|---|
| `index.html` | The page: welcome screen, tour controls, menu, place list, Gallery modal | rarely |
| `js/scenes.js` | **All the content**: places, hotspot angles, floor-plan positions, Gallery media, client texts | **yes** |
| `js/app.js` | The viewer logic and the interface strings of both languages (`UI` table at the top) | sometimes |
| `css/style.css` | The design. The colour values are at the top of the file | sometimes |
| `images/<id>.jpg` | The source equirectangular panoramas. The file name is the place id | when adding places |
| `assets/tiles/<id>/` | Cube-map tiles made from `images/` by `tools/build_tiles.py` | generated |
| `assets/thumbs/<id>.jpg` | Small thumbnails (place list, hotspot hover card), made by the same script | generated |
| `assets/media/` | Portrait photos (`.jpg`) and videos (`.mp4`) shown in the Gallery | when adding media |
| `assets/img/` | Home photo and the domitalia360 logos | rarely |
| `assets/fonts/` | Marcellus and Figtree (woff2) | no |
| `vendor/marzipano.js` | The viewer library | no |
| `tools/build_tiles.py` | Turns panoramas into tiles and thumbnails (needs `pip install opencv-python numpy`) | no |

## 3. How the interface works

- **Welcome screen.** The title, bibliography line and credit are the client's text (`name`, `bibliography`, `credit` in `scenes.js`).
  The pin sits on the central door of the aerial photo; its position is `homeDoor` (share of the photo's width and height).
  Pressing it, or the button, starts the tour at the entrance (`start`).
- **Hotspots.** Round markers in the panorama. On a mouse screen, hovering shows a thumbnail and the name of the destination. On touch
  screens the name is shown next to the marker, above or below it depending on where it is on the screen, and only while the
  marker is visible. The Gallery hotspot opens the Gallery of the current place.
- **Moving between places.** Walking through a hotspot is one continuous move: the old view keeps pushing toward the marker while the
  new place fades in, already facing the way you were walking. Jumps from the list or the plan use a slower cross-fade. The middle of
  the bottom bar fills while the next place loads.
- **Bottom bar.** Previous / next place and the current place name. On phones, tapping the name box opens the place list.
- **Place list** (left). All places grouped by area, with thumbnails. It has a "Luoghi" button in the top bar on tablets and wider.
- **Menu** (right). Home, Floor plan, All places, and an Italiano / English switch.
- **Floor plan.** Opens inside the menu. Each place is a dot (visited places are shaded), lines show the walkable links, a ring marks
  the current place and a cone shows where you are looking.
- **Gallery.** A full-screen modal with the list of items, a large picture or video, a custom video player and previous / next
  arrows. Keys: arrows switch item, Esc closes, Tab stays inside the modal.
- **Other controls.** Zoom +/-, autorotate on/off, fullscreen, language. Esc closes the menu, list or Gallery.

## 4. Editing the content (`js/scenes.js`)

Angles are in **radians**, exactly as the Marzipano tool exports them (yaw 0 = centre of the image, positive = right; pitch 0 =
horizon, positive = down), so values from a new export can be pasted in as they are. To find the angle of a spot, open
`http://localhost:8000/?edit=1`, click the panorama and read `{ yaw, pitch }` in the browser console.

Each scene:

```js
{
  id: "dx1", name: "Transetto destro 1", nameEn: "Right transept 1",
  view: { yaw: -1.0046, pitch: 0.0346 },          // opening direction
  group: "destro", heading: 15,                    // list group; compass bearing of yaw 0 (0 = towards the altar)
  plan: { x: 4.9, y: 8.9 },                        // where the camera stood on the plan, in metres
  links: [ { to: "altare", yaw: -1.7065, pitch: 0.243 }, ... ],   // walk-to hotspots
  detail: { yaw: -1.0, pitch: -0.05 },             // where the Gallery hotspot sits (omit if no media)
  media: [ { label: "Altare", labelEn: "Altar", photo: "dx1a.jpg", video: "dx1a.mp4" }, ... ]
}
```

- The order of `scenes` is the order of the previous / next buttons.
- `media` items need a poster photo in `assets/media/`; add `video` for a clip. A place with no `media` has no Gallery button.
- The link from the central nave back to the entrance is marked `added: true`: the Marzipano export had no way back from that panorama.
- **Floor plan.** The outline is drawn in `drawPlan()` in `js/app.js` (nave, two side aisles, apse, doors, pews, altar niches). It is
  schematic and was worked out from the photographs and hotspot bearings, **not surveyed**; it says "indicative" on screen. Dot positions
  come from each scene's `plan`. Replace the drawing and the `plan` values if a real plan becomes available.
- **Texts.** Italian and English interface texts are in the `UI` table at the top of `js/app.js`. Client texts (title, bibliography,
  welcome button) are in `scenes.js`; the English versions of the button and of place names are translations to be checked by a native speaker.

## 5. Adding a new place

1. Put the equirectangular panorama in `images/<id>.jpg` (any ratio 2:1; 11904 x 5952 was used here).
2. Run `python tools/build_tiles.py` (only new panoramas are processed; `--force` rebuilds all, or pass a name to rebuild one).
3. Add the scene to `js/scenes.js` with its links, `group`, `heading`, `plan`, and optional `media`; link to it from a neighbouring place.

## 6. Design notes

- **Colours** are taken from the supplied logos: greige `#D2C9C0`, black, charcoal `#383838`, and the honey-brown of the pew wood
  `#94562A` as the single accent (always a fill with white on it). The Menu is the only dark surface.
- **Type:** Marcellus (titles, place names) and Figtree (interface).
- **Logos** used: the round badge (browser tab icon and footer credit), the dark wordmark (homepage footer) and the white wordmark (menu footer).
  The yellow wordmark is not used.
- **Accessibility:** visible keyboard focus, labelled buttons, a focus trap in the Gallery, `prefers-reduced-motion` respected,
  `inert` on hidden panels.
- **Responsive:** checked from 320 px wide phones to desktop, portrait and landscape. On phones the "Luoghi" button is hidden and the
  bottom bar's name box opens the list.
- **Cache:** the CSS and JS links in `index.html` carry a version (`?v=NN`). Increase it after changing those files so visitors get the new version.

## 7. Credits

©2026 domitalia360.it. Bibliography text on the welcome screen: *Guida di Botrugno*, Vito Papa, Le guide verdi 49, Congedo Editore.
Viewer: Marzipano (Apache-2.0).
