# Portfolio — Interactive Hero Reveal

A single-page developer portfolio built from the **Sri Tech "Interactive Hero Reveal" guide**.

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

## Make it yours

### 1. Name, copy and links

All content lives in `index.html`. Sections you should edit are marked with `<!-- EDIT: ... -->` comments:

| What | Where |
| --- | --- |
| Name | `<title>`, the meta tags, `.brand__name` (header + footer), the hero image `alt` |
| Hero copy | `.eyebrow`, `.hero__title`, `.hero__lead` |
| About text and stats | `#about` |
| Skills | `#skills` (the four `.skill-card`s and the marquee) |
| Projects | `#projects` (each `.project`; set `href` to the live site or case study) |
| Experience | `#experience` |
| Email and socials | the menu overlay and `#contact` (replace `hello@example.com`) |

> The About, Projects and Experience sections ship with **sample content** so the layout is complete. Replace it with your own work before publishing.

### 2. Your own hero images

The two portraits in `assets/img/` are cut out of the reference mockup in the guide, so they are placeholders. To use your own photos:

1. Take a clean portrait (Image 1).
2. Make the futuristic version from **that same photo** with an image-to-image AI tool, for example a robotic mask, glowing circuitry or armor. Keep the pose, framing and canvas size unchanged (Image 2).
3. Remove the background from both, or use a plain background that matches `--bg: #FAFAF8`.
4. Export both at **identical dimensions**. The two images must line up pixel for pixel. Save them as `hero-default.webp` and `hero-reveal.webp`.
5. If your images are not 1400 × 1157, update:
   - the `width` and `height` attributes on `.hero__img` in `index.html`
   - `aspect-ratio: 1400 / 1157` on `.hero__portrait` in `style.css`
   - `calc(var(--hero-h) * 1.17)` in the same rule (1.17 = width ÷ height × 0.967)

The images never move independently. Only the mask moves and changes shape.

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
