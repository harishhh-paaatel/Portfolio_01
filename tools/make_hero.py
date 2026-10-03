#!/usr/bin/env python3
"""
Build the two aligned hero images for the portfolio from one portrait photo.

  IMAGE 1  hero-default.webp  clean cut-out portrait, placed to match the hero layout
  IMAGE 2  hero-reveal.webp   "machine-vision" futuristic version of the same portrait
                              (or a user-supplied AI-edited version, aligned to IMAGE 1)

Both are 1400x1157, transparent background, and pixel-aligned.

usage:
  pip install -r tools/requirements.txt
  python3 tools/make_hero.py my-photo.jpg                       # machine-vision reveal layer
  python3 tools/make_hero.py my-photo.jpg --ai my-photo-ai.jpg  # use your own AI-edited version

Writes assets/img/hero-default.webp, assets/img/hero-reveal.webp and tools/.cache/preview.jpg.
"""
import argparse, os, sys, urllib.request
import numpy as np
import cv2
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageFilter

W, H = 1400, 1157
# Face (landmark bbox) placement calibrated on the reference mockup layout
FACE_H = 0.343 * H          # landmark bbox height
FACE_C = (0.504 * W, 0.487 * H)
ACCENT = np.array([0xFF, 0x3F, 0x6C], np.float32) / 255  # RGB
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, '.cache')
MODEL_URL = ('https://storage.googleapis.com/mediapipe-models/face_landmarker/'
             'face_landmarker/float16/latest/face_landmarker.task')


def cached(name, url=None):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if url and not os.path.exists(path):
        print('downloading', name, '...')
        urllib.request.urlretrieve(url, path)
    return path


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def load_rgb(path, max_side=2400):
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    s = min(1.0, max_side / max(im.size))
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255


_landmarker = None
def landmarks(rgb):
    global _landmarker
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    if _landmarker is None:
        opts = vision.FaceLandmarkerOptions(
            base_options=mpt.BaseOptions(model_asset_path=cached('face_landmarker.task', MODEL_URL),
                                         delegate=mpt.BaseOptions.Delegate.CPU),
            num_faces=1)
        _landmarker = vision.FaceLandmarker.create_from_options(opts)
    u8 = np.ascontiguousarray((rgb * 255).astype(np.uint8))
    res = _landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=u8))
    if not res.face_landmarks:
        sys.exit('No face found in the photo - use a clear, front-facing portrait.')
    h, w = rgb.shape[:2]
    return np.array([[p.x * w, p.y * h] for p in res.face_landmarks[0]], np.float32)


def segment(rgb):
    from rembg import remove, new_session
    im = Image.fromarray((rgb * 255).astype(np.uint8))
    m = remove(im, session=new_session('isnet-general-use'), only_mask=True)
    return np.asarray(m).astype(np.float32) / 255


def decontaminate(rgb, alpha):
    """Re-estimate foreground colours at soft edges so hair does not carry the old background."""
    try:
        from pymatting import estimate_foreground_ml
        return np.clip(estimate_foreground_ml(rgb.astype(np.float64), alpha.astype(np.float64)), 0, 1).astype(np.float32)
    except Exception:
        return rgb


def placement(pts):
    lo, hi = pts.min(0), pts.max(0)
    s = FACE_H / (hi[1] - lo[1])
    c = (lo + hi) / 2
    tx, ty = FACE_C[0] - s * c[0], FACE_C[1] - s * c[1]
    return np.array([[s, 0, tx], [0, s, ty]], np.float32)


def warp(img, M, border=0.0):
    flags = cv2.INTER_AREA if M[0, 0] < 1 else cv2.INTER_LANCZOS4
    return cv2.warpAffine(img, M, (W, H), flags=flags, borderMode=cv2.BORDER_CONSTANT, borderValue=border)


def photo_edge_fade(shape, M, width=70):
    """Fade alpha towards photo borders that land inside the canvas (e.g. a photo cropped at the chest)."""
    pad = 400
    Mp = M.copy(); Mp[:, 2] += pad
    inside = cv2.warpAffine(np.ones(shape[:2], np.uint8), Mp, (W + 2 * pad, H + 2 * pad), flags=cv2.INTER_NEAREST)
    # the canvas border itself is not a photo edge: treat everything outside the canvas as inside
    big = np.ones_like(inside); big[pad:pad + H, pad:pad + W] = inside[pad:pad + H, pad:pad + W]
    # but keep real photo edges that fall inside the canvas
    d = cv2.distanceTransform(big, cv2.DIST_L2, 5)[pad:pad + H, pad:pad + W]
    return smooth(0, width, d)


def over(fc, fa, bc, ba):
    oa = fa + ba * (1 - fa)
    oc = (fc * fa[..., None] + bc * (ba * (1 - fa))[..., None]) / np.maximum(oa, 1e-6)[..., None]
    return oc, oa


def mono_font(size):
    ttf = cached('JetBrainsMono.ttf')
    if not os.path.exists(ttf):
        from fontTools.ttLib import TTFont
        f = TTFont(os.path.join(ROOT, 'assets', 'fonts', 'jetbrains-mono-latin.woff2'))
        f.flavor = None
        f.save(ttf)
    try:
        font = ImageFont.truetype(ttf, size)
        font.set_variation_by_axes([600])
        return font
    except Exception:
        return ImageFont.truetype(ttf, size)


def machine_vision(rgb, alpha, pts, label):
    """Futuristic layer: dark tech field, graded portrait, edge glow, face mesh, detection HUD."""
    from mediapipe.tasks.python import vision
    C = vision.FaceLandmarksConnections
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    lo, hi = pts.min(0), pts.max(0)
    fc = (lo + hi) / 2

    # backdrop
    r = np.sqrt(((xx - fc[0]) / 640) ** 2 + ((yy - (fc[1] + 200)) / 720) ** 2)
    bd_a = 0.96 * (1 - smooth(0.45, 1.0, r))
    bd = np.zeros((H, W, 3), np.float32); bd[:] = np.array([0x10, 0x10, 0x12], np.float32) / 255
    grid = (((xx.astype(int) % 34) == 0) | ((yy.astype(int) % 34) == 0)).astype(np.float32)
    grid = cv2.GaussianBlur(grid, (0, 0), 0.6)
    bd = bd * (1 - grid[..., None] * 0.22) + ACCENT * grid[..., None] * 0.22
    glow = np.exp(-(((xx - fc[0]) / 380) ** 2 + ((yy - (fc[1] + 420)) / 300) ** 2))
    bd = bd + ACCENT * glow[..., None] * 0.28

    # graded person
    lum = (rgb * np.array([0.299, 0.587, 0.114], np.float32)).sum(2, keepdims=True)
    p = lum + (rgb - lum) * 0.55
    p = np.clip((p - 0.5) * 1.18 + 0.42, 0, 1) * np.array([0.93, 0.97, 1.05], np.float32)
    er = cv2.erode(alpha, np.ones((13, 13), np.uint8))
    rim = cv2.GaussianBlur(np.clip(alpha - er, 0, 1), (0, 0), 4)
    p = np.clip(p + ACCENT * rim[..., None] * 0.6, 0, 1)
    p = p * (1 - 0.07 * ((yy.astype(int) % 4) == 0))[..., None]

    # edge glow (Canny on the portrait, kept inside the silhouette)
    g = cv2.GaussianBlur((lum[..., 0] * 255).astype(np.uint8), (0, 0), 1.6)
    edges = cv2.Canny(g, 40, 110).astype(np.float32) / 255 * (alpha > 0.5)
    e_glow = cv2.GaussianBlur(edges, (0, 0), 2.2) * 1.4
    p = np.clip(p + ACCENT * (edges * 0.55 + e_glow * 0.35)[..., None], 0, 1)

    c2, a2 = over(p, alpha, bd, bd_a)

    # vector overlay drawn at 2x for clean anti-aliasing
    S = 2
    ov = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    P = pts * S
    acc = (255, 63, 108)

    def lines(conns, fill, width):
        for cn in conns:
            a, b = P[cn.start], P[cn.end]
            d.line([tuple(a), tuple(b)], fill=fill, width=width)

    lines(C.FACE_LANDMARKS_TESSELATION, (255, 255, 255, 46), 1 * S)
    for group in (C.FACE_LANDMARKS_FACE_OVAL, C.FACE_LANDMARKS_LEFT_EYE, C.FACE_LANDMARKS_RIGHT_EYE,
                  C.FACE_LANDMARKS_LEFT_EYEBROW, C.FACE_LANDMARKS_RIGHT_EYEBROW, C.FACE_LANDMARKS_LIPS):
        lines(group, acc + (235,), 2 * S)
    for i in range(0, 468, 9):
        x, y = P[i]
        d.ellipse([x - 2.2 * S, y - 2.2 * S, x + 2.2 * S, y + 2.2 * S], fill=(255, 255, 255, 170))
    # glowing irises
    for idx in (468, 473):
        x, y = P[idx]
        rr = 7 * S
        d.ellipse([x - rr, y - rr, x + rr, y + rr], outline=acc + (255,), width=2 * S)
        d.ellipse([x - 2.5 * S, y - 2.5 * S, x + 2.5 * S, y + 2.5 * S], fill=acc + (255,))

    # detection box with corner brackets
    pad = 0.18 * (hi - lo)
    x0, y0 = (lo - pad) * S
    x1, y1 = (hi + pad) * S
    L, t = 34 * S, 3 * S
    for (cx, cy, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line([(cx, cy), (cx + sx * L, cy)], fill=acc + (255,), width=t)
        d.line([(cx, cy), (cx, cy + sy * L)], fill=acc + (255,), width=t)
    d.rectangle([x0, y0, x1, y1], outline=(255, 255, 255, 40), width=1 * S)

    f = mono_font(13 * S)
    def tag(x, y, text, fill=(255, 255, 255, 235), bg=acc + (235,)):
        tb = d.textbbox((0, 0), text, font=f)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        px, py = 9 * S, 6 * S
        d.rounded_rectangle([x, y, x + tw + 2 * px, y + th + 2 * py], radius=4 * S, fill=bg)
        d.text((x + px - tb[0], y + py - tb[1]), text, font=f, fill=fill)
        return th + 2 * py

    h1 = tag(x0, y0 - 36 * S, 'FACE  0.99')
    tag(x0, y1 + 10 * S, label, fill=(255, 255, 255, 230), bg=(16, 16, 18, 220))
    tag(x1 - 150 * S, y1 + 10 * S, 'MESH 478 PTS', fill=(255, 255, 255, 230), bg=(16, 16, 18, 220))

    ov = ov.resize((W, H), Image.LANCZOS)
    glow_l = ov.filter(ImageFilter.GaussianBlur(5))
    o = np.asarray(ov).astype(np.float32) / 255
    gl = np.asarray(glow_l).astype(np.float32) / 255
    # additive glow of the vector layer, then normal "over"
    c2 = np.clip(c2 + gl[..., :3] * gl[..., 3:4] * 0.5, 0, 1)
    c2, a2 = over(o[..., :3], o[..., 3], c2, a2)
    return c2, a2


def save(rgb, alpha, path):
    rgba = np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)])
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(path, quality=88, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('photo')
    ap.add_argument('--ai', help='AI-edited futuristic version of the same photo')
    ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'img'))
    ap.add_argument('--label', default='ID: K G HARISH PATEL')
    a = ap.parse_args()

    rgb = load_rgb(a.photo)
    pts = landmarks(rgb)
    M = placement(pts)
    alpha_src = segment(rgb)
    fg = decontaminate(rgb, alpha_src)

    fade = photo_edge_fade(rgb.shape, M)
    img1 = np.clip(warp(fg, M), 0, 1)
    al1 = np.clip(warp(alpha_src, M), 0, 1) * fade
    pts_c = (pts @ M[:, :2].T) + M[:, 2]

    if a.ai:
        ai = load_rgb(a.ai)
        ai = cv2.resize(ai, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_AREA) if ai.shape[:2] != rgb.shape[:2] else ai
        # align the AI edit to the original with a similarity transform on stable landmarks
        pa = landmarks(ai)
        keep = list(range(0, 468))
        A, _ = cv2.estimateAffinePartial2D(pa[keep], pts[keep], method=cv2.LMEDS)
        ai = cv2.warpAffine(ai, A, (rgb.shape[1], rgb.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        al_ai = segment(ai)
        img2 = np.clip(warp(decontaminate(ai, al_ai), M), 0, 1)
        al2 = np.maximum(al1, np.clip(warp(al_ai, M), 0, 1) * fade)
    else:
        img2, al2 = machine_vision(img1, al1, pts_c, a.label)
        al2 = np.maximum(al2, al1)

    os.makedirs(a.out, exist_ok=True)
    save(img1, al1, os.path.join(a.out, 'hero-default.webp'))
    save(img2, al2, os.path.join(a.out, 'hero-reveal.webp'))

    # previews on the page background
    bg = np.array([0xFA, 0xFA, 0xF8], np.float32) / 255
    prev = [c * al[..., None] + bg * (1 - al[..., None]) for c, al in ((img1, al1), (img2, al2))]
    Image.fromarray((np.hstack(prev) * 255).astype(np.uint8)).save(cached('preview.jpg'), quality=88)
    print('preview:', cached('preview.jpg'))

    fcx, fcy = (pts_c.min(0) + pts_c.max(0)) / 2
    bs = 5.4
    px = (fcx / W * bs - 0.5) / (bs - 1); py = (fcy / H * bs * H / W - 0.5) / (bs * H / W - 1)
    print(f'face centre {fcx:.0f},{fcy:.0f}  -> set .btn__icon::before background-position to {px*100:.0f}% {py*100:.0f}% in style.css')


if __name__ == '__main__':
    main()
