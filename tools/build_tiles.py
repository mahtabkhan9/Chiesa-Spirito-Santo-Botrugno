"""
Convert equirectangular 360 JPGs (images/<id>.jpg) into Marzipano cube-map tiles
(assets/tiles/<id>/{z}/{f}/{y}/{x}.jpg) and 480x270 thumbnails (assets/thumbs/<id>.jpg).
The file name (without .jpg) is the scene id used in js/scenes.js.

Usage:
    python tools/build_tiles.py              # only panoramas that have no tiles yet
    python tools/build_tiles.py --force      # rebuild everything
    python tools/build_tiles.py navata dx1   # rebuild named panoramas

Requires: pip install opencv-python numpy
"""
import os, sys, math
from multiprocessing import Pool
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
OUT_TILES = os.path.join(ROOT, "assets", "tiles")
OUT_THUMBS = os.path.join(ROOT, "assets", "thumbs")
# (face size, tile size). Index in this list == {z} in the tile URL. Keep in sync with js/app.js.
LEVELS = [(512, 512), (1536, 1536), (3072, 1536)]
QUALITY = 86
FACES = ["f", "b", "l", "r", "u", "d"]


def face_map(face, size, w, h):
    j, i = np.mgrid[0:size, 0:size].astype(np.float32)
    u = (i + 0.5) / size * 2 - 1
    v = 1 - (j + 0.5) / size * 2
    one = np.ones_like(u)
    x, y, z = {"f": (u, v, one), "b": (-u, v, -one), "l": (-one, v, u),
               "r": (one, v, -u), "u": (u, one, -v), "d": (u, -one, v)}[face]
    lon = np.arctan2(x, z)
    lat = np.arctan2(y, np.sqrt(x * x + z * z))
    return (((lon / (2 * math.pi) + 0.5) * w - 0.5).astype(np.float32),
            ((0.5 - lat / math.pi) * h - 0.5).astype(np.float32))


def build(sid):
    cv2.setNumThreads(2)
    img = cv2.imread(os.path.join(SRC, sid + ".jpg"), cv2.IMREAD_COLOR)
    if img is None:
        return sid, "unreadable"
    top = LEVELS[-1][0]
    if img.shape[1] != top * 4:
        img = cv2.resize(img, (top * 4, top * 2), interpolation=cv2.INTER_AREA)
    h, w = img.shape[:2]
    out = os.path.join(OUT_TILES, sid)
    for face in FACES:
        mx, my = face_map(face, top, w, h)
        big = cv2.remap(img, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)
        if face == "f":
            side = cv2.resize(big, (1024, 1024), interpolation=cv2.INTER_AREA)
            crop = cv2.resize(side[224:800, :], (480, 270), interpolation=cv2.INTER_AREA)
            os.makedirs(OUT_THUMBS, exist_ok=True)
            cv2.imwrite(os.path.join(OUT_THUMBS, sid + ".jpg"), crop, [cv2.IMWRITE_JPEG_QUALITY, 80])
        for z, (size, tile) in enumerate(LEVELS):
            level = big if size == top else cv2.resize(big, (size, size), interpolation=cv2.INTER_AREA)
            n = size // tile
            for y in range(n):
                d = os.path.join(out, str(z), face, str(y))
                os.makedirs(d, exist_ok=True)
                for x in range(n):
                    t = level[y * tile:(y + 1) * tile, x * tile:(x + 1) * tile]
                    cv2.imwrite(os.path.join(d, f"{x}.jpg"), t, [cv2.IMWRITE_JPEG_QUALITY, QUALITY])
    return sid, "ok"


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv or bool(args)
    ids = sorted(os.path.splitext(f)[0] for f in os.listdir(SRC) if f.lower().endswith((".jpg", ".jpeg")))
    if args:
        ids = [i for i in ids if i in args]
    todo = [i for i in ids if force or not os.path.isdir(os.path.join(OUT_TILES, i))]
    print(f"{len(todo)} of {len(ids)} panoramas to process", flush=True)
    with Pool(3) as pool:
        for sid, status in pool.imap_unordered(build, todo):
            print(f"  {sid}: {status}", flush=True)
