# Requirements: Sri Tech Interactive Hero Reveal

This file lists every requirement in the *Interactive Hero Reveal* guide and how this portfolio meets it.

> **Concept:** Image 1 stays visible. Image 2 is revealed only where the cursor moves, using an organic animated mask.

## 01 · The experience

| Item | Requirement | Implementation |
| --- | --- | --- |
| Default | Clean portrait + editorial white composition | `assets/img/hero-default.webp` on the warm-white `#FAFAF8` hero |
| Reveal | Futuristic AI/robotic version of the same portrait | `assets/img/hero-reveal.webp`, built by `tools/make_hero.py`: a machine-vision version with face mesh, detection box, edge glow, dark tech grid and red rim light (or an AI-edited photo aligned with `--ai`) |
| Trigger | Mouse movement across the hero | `pointermove` on the whole hero section (`hero-reveal.js`) |
| Mask | Organic, irregular, liquid/blob-shaped reveal | Harmonic blob outline with feathered edge, velocity stretch and trailing droplets |
| Mobile | Finger/touch position controls the reveal | Passive `touchstart` / `touchmove` / `touchend` listeners, same blob |

## 02 · Build prompt

| Requirement | Status | Where |
| --- | --- | --- |
| Two perfectly aligned images (IMAGE 1 clean, IMAGE 2 futuristic) | ✅ | Both 1400 × 1157, drawn into the same box |
| Initial state: Image 1 across the hero, Image 2 completely hidden | ✅ | Canvas is empty until the pointer enters |
| No global background change, no global fade of Image 2 | ✅ | Only the masked region is ever painted |
| Reveal Image 2 **only** around the cursor | ✅ | `source-in` composite inside the mask |
| Not a circle, radial spotlight, oval, rectangle, split screen or full-image transition | ✅ | `blobPath()`: 2nd/3rd/5th/7th harmonics, asymmetric |
| Liquid/blob-like silhouette | ✅ | Smooth closed curve through 72 morphing points |
| Asymmetric perimeter | ✅ | Out-of-phase harmonics with random seeds |
| Continuously morphing edges | ✅ | Time-driven phases, redrawn every frame |
| Soft feathered boundary | ✅ | Off-screen shadow-blur mask (`feather: 0.26`) |
| Approximately 250–400 px overall | ✅ | `minSize: 250`, `maxSize: 400`, scaled to portrait height |
| Subtle deformation while moving | ✅ | Leading edge compresses, trailing edge pulls back like liquid |
| Slight inertia/lag | ✅ | Frame-rate-independent lerp (`follow: 0.15`) |
| Smooth 60 fps interaction | ✅ | `requestAnimationFrame`; canvas capped at the image's native pixels; loop sleeps when idle |
| Images never move, scale, rotate or distort independently | ✅ | Only the mask moves and deforms |
| Mouse leave: completely hide Image 2 and return to Image 1 | ✅ | Mask shrinks to zero, canvas is cleared, loop stops |
| Mobile: touch position instead of cursor, same organic behavior | ✅ | Touch handlers drive the same engine |
| Preserve hero layout, typography, navigation and content | ✅ | Hero rebuilt to the mockup's proportions |

## 03 · Make the hero feel premium

| Guideline | Implementation |
| --- | --- |
| **Oversized background type**: giant cropped words such as CREATE / WEBSITES / NOT JUST / CODE, low contrast | `.hero__type`: solid `CREATE` and `CODE`, outlined `SYSTEMS` (in place of WEBSITES, to fit an ML engineer), faint red `NOT JUST`; subtle pointer parallax |
| **Main message**: a strong statement such as "I BUILD DIGITAL EXPERIENCES THAT FEEL ALIVE." | `h1.hero__title`: "I turn real-world problems into ML systems.", taken from the About text; last line in the accent colour, line-by-line entrance |
| **CTA system**: LET'S CONNECT + VIEW MY WORK; primary has a subtle red accent and magnetic hover; a tiny clipped crop of the futuristic image appears inside the button | `.btn--primary`: red arrow disc that morphs into a crop of `hero-reveal.webp`, red border and glow on hover, magnetic pull (`data-magnetic`). `.btn--ghost`: separate ink-fill hover |
| **Cursor language**: small, refined indicator; says REVEAL on the hero; magnetic on CTAs; never oversized | `.cursor`: 12 px red dot with a `REVEAL` pill over the portrait; becomes a thin 44 px ring over CTAs; fine pointers only |
| **Visual system**: warm white, black, soft gray, `#FF3F6C` accent concentrated on interaction states and the futuristic image | Tokens in `:root` in `style.css` |

## 04 · Implementation checklist

- [x] Two images have identical dimensions and alignment.
- [x] Image 1 is the permanent base layer.
- [x] Image 2 exists as a masked overlay only.
- [x] Reveal shape is organic, never a perfect circle.
- [x] Reveal follows the cursor smoothly with interpolation.
- [x] Mask continuously morphs while moving.
- [x] Mouse leave hides Image 2.
- [x] Touch interaction works on mobile.
- [x] CTA buttons have separate polished hover states.
- [x] No global background transition or full-screen image swap.

## 05 · Final creative direction

> The goal is not simply to show two images. The interaction should communicate a second identity: the visitor sees a polished developer by default, then discovers the AI/creative layer through exploration. The reveal should feel intentional, tactile and premium.

The rest of the site carries the same idea. The About section opens with "Engineer by default. AI builder underneath." The Achievement card, the project covers, the menu and the contact section all reuse the dark grid and red glow of the futuristic layer.
