# Chiesa dello Spirito Santo, Botrugno - tour virtuale 360°

Plain HTML + CSS + JavaScript with the free [Marzipano](https://www.marzipano.net/) viewer (bundled in `vendor/`).
No build step, no server code, no external requests (fonts are bundled). Day view only. Italian (default) and English, switched with the IT/EN button (the choice is remembered; `?lang=en` forces one).

## Run it
Browsers block tile files opened by double-click, so use any static server:

    python -m http.server 8000      # then open http://localhost:8000
    http://localhost:8000/#altare   # opens a place directly

## Folders
| Path | What |
|---|---|
| `js/scenes.js` | **All content**: places, hotspot angles, headings, close-up media, texts |
| `js/app.js` | Viewer logic (welcome pin, place list, media modal, autorotate) |
| `css/style.css` | Design |
| `images/<id>.jpg` | Source equirectangular panoramas (id = scene id) |
| `assets/tiles/<id>/` | Cube-map tiles made by `tools/build_tiles.py` (needs `opencv-python numpy`) |
| `assets/media/` | Portrait close-up photos and videos shown in the "Dettagli" drawer |
| `assets/img/home.jpg` | Drone photo on the welcome screen; the pin sits on the central door (`homeDoor` in scenes.js) |

Hotspot angles are the ones exported by Marzipano (radians, `pitch` positive = down). The Marzipano export had no way back
from the nave (to the entrance); that link is marked `added: true` in `scenes.js`.
To find the angle of a spot, open `index.html?edit=1` and click the panorama: yaw/pitch are logged in the console.

## Adding a place
1. Put the panorama in `images/<id>.jpg`, run `python tools/build_tiles.py`.
2. Add a scene to `js/scenes.js` (links, `group`, `heading`, optional `media`). Scene order = Previous/Next order.

## Languages
Italian is the default. English texts live next to the Italian ones in `js/scenes.js` (`nameEn`, `labelEn`, and the `en` block for the
welcome text). Interface strings for both languages are in the `UI` table at the top of `js/app.js`. Adding a language means adding
a key there, `…Xx` fields in `scenes.js`, and a way to pick it (the button currently toggles between two).
