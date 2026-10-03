# K G Harish Patel — Portfolio

Personal portfolio of **K G Harish Patel**, AI/ML Engineer (Python • Computer Vision • Generative AI). 

The hero always shows a clean editorial portrait. Underneath it is a futuristic AI version of the same portrait. That second image only appears where the cursor (or finger) moves, through an organic, liquid, constantly morphing mask.

- No framework and no build step: plain HTML, CSS and JavaScript.
- Works by opening `index.html` directly or on any static host, including GitHub Pages.
- No external requests: the fonts are self-hosted.

```
Default ── clean portrait + editorial white composition
Reveal  ── futuristic AI/robotic version of the same portrait
Trigger ── mouse movement across the hero
Mask    ── organic, irregular, liquid/blob-shaped reveal
Mobile  ── finger/touch position controls the reveal
```

## Project structure

```
.
├── index.html                 # all page content (hero, about, skills, projects, experience, contact)
├── assets/
│   ├── css/style.css          # design system + layout (tokens at the top in :root)
│   ├── js/hero-reveal.js      # the organic cursor reveal engine (canvas)
│   ├── js/main.js             # header, menu, magnetic CTAs, cursor, scroll reveals, previews
│   ├── img/hero-default.webp  # IMAGE 1 – clean portrait (permanent base layer)
│   ├── img/hero-reveal.webp   # IMAGE 2 – futuristic portrait (masked overlay only)
│   ├── img/favicon.svg
│   └── fonts/                 # Outfit + JetBrains Mono (variable, SIL OFL)
├── tools/make_hero.py         # turns a portrait photo into the two aligned hero images
├── tools/requirements.txt     # Python packages for the tool (the website itself needs none)
├── docs/REQUIREMENTS.md       # the guide's requirements and how each one is met
└── .nojekyll                  # serve files as-is on GitHub Pages
```

## Run locally

Opening `index.html` in a browser works. A local server is closer to production:

```bash
python3 -m http.server 8080      # then open http://localhost:8080
# or
npx serve .
```

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages → Build and deployment**.
3. Set **Source** to *Deploy from a branch*, pick your branch, and set the folder to `/ (root)`.
4. The site will be published at `https://<your-username>.github.io/<repo-name>/`.

## Editing the site

### 1. Content

All content lives in `index.html`:

| What | Where |
| --- | --- |
| Name | `<title>`, the meta tags, `.brand__name` (header + footer), the hero image `alt` |
| Hero | `.eyebrow` (role line), `.hero__title`, `.hero__lead`, `.hero__status` (availability badge), `.chip`s |
| About text and stats | `#about` |
| Skills | `#skills`: one `.skill-row` per category, plus the scrolling marquee |
| Projects | `#projects`: one `.project` per project |
| Experience, education, achievement, community, certifications | `#experience`: `.timeline` plus the `.extras` cards |
| Email and profiles | the menu overlay (`.menu__foot`) and `#contact` |

### 2. Hero images

The hero needs two images with the **same size and alignment**:

- `assets/img/hero-default.webp`: the clean portrait, always visible.
- `assets/img/hero-reveal.webp`: the futuristic version, shown only inside the cursor mask.

`tools/make_hero.py` builds both from one photo:

```bash
pip install -r tools/requirements.txt

# Option A: generate the futuristic layer automatically
python3 tools/make_hero.py path/to/my-photo.jpg

# Option B: use your own AI-edited version of the same photo
python3 tools/make_hero.py path/to/my-photo.jpg --ai path/to/my-photo-futuristic.jpg
```

The script:

1. finds the face with a 478-point face-landmark model, which it downloads on first run;
2. removes the background;
3. scales and places the portrait so the face sits exactly where the hero layout expects it;
4. writes both images at 1400 × 1157.

Without `--ai`, it builds a **machine-vision** version of the portrait:

- a dark tech grid behind the portrait;
- edge detection on the portrait, drawn in red;
- a face mesh with glowing irises;
- a face-detection box with an ID tag.

This is the "AI identity" the visitor uncovers with the cursor. With `--ai`, it aligns your AI-edited photo to the original using the facial landmarks.

At the end, the script prints the `background-position` to use for the little futuristic crop inside the **Let's connect** button (`.btn__icon::before` in `style.css`).

For the best result, use a clear, front-facing photo from the chest up, with even lighting and a plain background, at least 1500 px wide.

### 3. Colours and type

The design tokens are at the top of `assets/css/style.css`:

```css
--bg: #FAFAF8;      /* warm white */
--ink: #0E0E0E;     /* black */
--type: #EDEDEB;    /* oversized background words */
--accent: #FF3F6C;  /* the controlled red accent */
```

### 4. Tuning the reveal

The settings are the defaults block near the top of `HeroReveal` in `assets/js/hero-reveal.js`. They follow the guide:

```js
this.o = Object.assign({
  minSize: 250,     // overall blob size in px, clamped to 250–400
  maxSize: 400,
  sizeRatio: 0.38,  // size relative to the portrait height
  follow: 0.15,     // inertia (lower = more lag)
  enter: 0.12,      // grow speed
  exit: 0.2,        // shrink speed on mouse leave
  feather: 0.26,    // edge softness
  points: 72        // outline resolution
}, options || {});
```

## How the reveal works

- **Image 1** is an ordinary `<img>`. It is always visible and never changes.
- **Image 2** is drawn onto a `<canvas>` that occupies the exact same box. Every frame, the engine:
  1. builds an organic outline from several out-of-phase harmonics, so the shape is asymmetric and always morphing and is never a circle or oval;
  2. stretches the outline against the direction of travel and lets two small trailing droplets split off and merge back, which gives the liquid feel;
  3. paints that outline as a feathered alpha mask, using an off-screen shadow blur that works in every browser;
  4. composites Image 2 into the mask with `source-in`.
- The mask follows the pointer with frame-rate-independent interpolation, which gives the slight inertia.
- On mouse leave, or when a finger lifts, the mask shrinks to nothing, Image 2 disappears completely, and the loop stops.
- Touch listeners are passive, so the page still scrolls normally on phones.
- `prefers-reduced-motion` slows the morphing and turns off the droplets.

## Browser support

The site works in current Chrome, Edge, Firefox and Safari, on both desktop and mobile. If JavaScript is disabled, the page still renders and only Image 1 is shown.

## Credits

- Concept and requirements: *Sri Tech — Interactive Hero Reveal Guide*.
- Fonts: [Outfit](https://fonts.google.com/specimen/Outfit) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), both under the SIL Open Font License.
