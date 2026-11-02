# K G Harish Patel — Portfolio

Personal portfolio of **K G Harish Patel**, Software Engineer Intern (Python • Backend • Computer Vision & Edge AI).

- No framework and no build step: plain HTML, CSS and JavaScript.
- Works on any static host. On GitHub Pages it is served from the `/Portfolio_01/` subpath, so all asset paths are relative.
- No external requests: fonts are self-hosted, no analytics.

## Project structure

```
.
├── index.html                 # page shell: loader, header, hero, doors, toolbox, story, footer, dialogs
├── assets/
│   ├── js/data.js             # ALL content: profile, skills, categories (the four doors), canonical `projects` registry, story
│   ├── js/theme.js            # central light/dark provider (localStorage + prefers-color-scheme, no flash)
│   ├── js/rope.js             # the rope: each pull toggles the theme
│   ├── js/contact.js          # contact form -> EmailJS (assets/js/emailjs-config.js holds the IDs)
│   ├── js/rooms.js            # four doors, cursor proximity, GSAP door-to-room travel, category pages, history
│   ├── vendor/gsap.min.js     # GSAP 3.12.5 (self-hosted)
│   ├── js/main.js             # renders data.js; entrance door, menu, flip card, doors, portrait tilt, story roller, dialogs
│   ├── css/style.css          # design tokens in :root, then one block per section
│   ├── img/                   # hero-default.webp, favicon.svg
│   ├── fonts/                 # Onest 400/500/600 (SIL OFL)
│   └── KG_Harish_Patel_Resume.pdf
├── tools/make_hero.py         # builds the two aligned hero images from a photo
```

No framework, no build step and no runtime dependencies. The content source is the resume PDF; anything not in it is not on the site.

## Run locally

```bash
npm start          # node server.js -> http://localhost:3000 (static files only)
npm test           # content integrity
npm run build      # verifies sources and writes the static site to dist/
```

The contact form uses EmailJS from the browser; see [docs/EMAILJS_SETUP.md](docs/EMAILJS_SETUP.md).
Theme (light/dark) is a single provider in `assets/js/theme.js`; the rope (`assets/js/rope.js`) just toggles it.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages → Build and deployment**.
3. Set **Source** to *Deploy from a branch*, pick your branch, and set the folder to `/ (root)`.
4. The site will be published at `https://<your-username>.github.io/<repo-name>/`.

## Editing the site

### 1. Content

All content lives in `index.html`, one `<section>` each for hero, about, skills, projects, experience, education and contact. Design tokens are at the top of `assets/css/style.css`. `assets/js/main.js` only handles the mobile menu, active nav link and footer year.

### 2. Hero portrait

`assets/img/hero-default.webp` (1400 x 1157, transparent background, natural colour). The page tilts it slightly towards the cursor on mouse devices only; touch devices and `prefers-reduced-motion` get a still image. To change it, replace the file with the same aspect ratio.

### 3. Entrance door

Shown once per browser session (and skipped for reduced motion). Markup is `#gate` in `index.html`, styles are the "entrance door" block in `style.css`, and the open sequence is `openGate()` in `main.js`. There is no audio.

## Browser support

The site works in current Chrome, Edge, Firefox and Safari, on both desktop and mobile. If JavaScript is disabled, the page still renders and only Image 1 is shown.

## Credits

- Concept and requirements: *Sri Tech — Interactive Hero Reveal Guide*.
- Fonts: [Outfit](https://fonts.google.com/specimen/Outfit) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), both under the SIL Open Font License.
