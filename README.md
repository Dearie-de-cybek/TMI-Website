# TwainMan Ministry International — website

The public website for TwainMan Ministry International, Asaba, Delta State.

Static HTML, Tailwind CSS v4 and vanilla JavaScript — no frontend framework —
structured so it can be lifted into Laravel/Blade without rewriting the markup.

---

## Running it

```bash
npm install
npm run build
npm run serve     # http://127.0.0.1:4173
```

| Script | What it does |
| --- | --- |
| `npm run build` | Builds the pages, then the minified stylesheet |
| `npm run pages` | Assembles `index.html` and `pages/*.html` from `src/` |
| `npm run css` | Compiles `assets/css/input.css` → `assets/css/output.css` |
| `npm run dev` | Builds the pages, then watches the CSS |
| `npm run images` | Re-derives the photography from the originals (needs Python + Pillow) |
| `npm run serve` | Serves the folder on port 4173 |

The pages are plain files — any static host will serve them. `npm run serve`
just needs Python 3; anything else that serves the folder works equally well.

> Edit `src/`, never the generated `index.html` / `pages/*.html`. They are
> rewritten by `npm run pages`.

---

## The one file to edit before launch

**`assets/data/site-content.js`.**

Every page ships with these values already written into the HTML, so the site
is complete with JavaScript switched off. On load, `main.js` re-writes any
element carrying `data-content="path.to.value"` from that file, so changing an
address there updates it on every page.

Each group carries a `status`:

- `verified` — taken from the church's own material: the flyer in
  `assets/images/_originals/church_events.jpg`, the mobile app's `app.json`,
  or a caption written against a church photograph.
- `unconfirmed` — carried over from the mobile app's development sample data.
  Plausible, but nobody has checked it.
- `placeholder` — a blank. **Nothing was invented to fill it.** It renders on
  the page as a visible "to confirm" marker, never as a fake value.

### What is still needed before this goes public

These are also printed to the browser console when the site is served locally.

1. Sunday and midweek service **start times**
2. **Telephone, WhatsApp and email** for the church office
3. **Social media accounts** (or confirmation that there are none)
4. **Pastor Patrick Evbomoen's biography**, and any other leadership
5. The church's **story, vision and statement of belief** (About page)
6. What a **first-time visitor** can expect (About → Plan your visit)
7. **Gethsemane**: current edition year, theme, dates, venue, registration link
8. **App Store and Google Play links**, once the app is published
9. **Upcoming events** — the Events page shows a designed empty state until then
10. A **high-resolution logo file** (see *Assets*, below)
11. **More photographs** — see *Assets*

Nothing on the site states a fact the church has not published. Where a fact is
missing, the page says so in gold, rather than guessing.

---

## What the content is based on

| Fact | Where it came from |
| --- | --- |
| Name: TwainMan Ministry International | The church's own flyer; `app.json` has the short form |
| Address: Ambrose Omafuvwe Street, opposite Building Material Market, OKP Road, Asaba | The flyer |
| Lead pastor: Pastor Patrick Evbomoen | The flyer ("MINISTERING PST. PATRICK EVBOMOEN") |
| Blessing the Work of Your Hands — every second Sunday, 8:00am | The flyer |
| Gethsemane Camp Meeting, 2024 edition | The camp badge in the church's own photograph |
| The church app and its seven areas | The app's own routes and `app.json` |
| Psalm 122:1 | Quoted in full, KJV |
| Sunday gatherings / Wednesday midweek study | The app's sample content — **unconfirmed** |

---

## Assets

### Photography

The church supplied **eight original files, from two occasions**: a Sunday
gathering in the main hall, and the 2024 Gethsemane Camp Meeting. They live
unmodified in `assets/images/_originals/` and are the source of truth.

`npm run images` (`scripts/build-images.py`) derives every image the site uses:
hand-chosen crops, resized to the widths the layouts actually request, written
as WebP into `assets/images/photos/`. Each crop box is named and commented in
that script, so a crop can be re-cut without going back to the church.

**No stock photography is used anywhere, and none should be added.** If more
photographs arrive, drop them in `_originals/`, add an entry to `DERIVATIVES`
in the script, and run `npm run images`.

More photographs would help most in: the gallery (it currently holds every
picture the church has), the About page, and the Gethsemane page.

### Logo

`assets/images/photos/wordmark.png` is **lifted off the church's own flyer**
(a JPEG) by `build_logo()` in the image script, and keyed to a transparent
background. At 528px wide it is sharp enough for the header and the footer, but
it is a stand-in: **ask the church for the original logo file** (vector, or a
large PNG with transparency) and replace it. Everything else about it — the
flame, the three-line lock-up — is the church's real mark.

### Texture

`assets/images/texture/grain.png` is a generated 64px film-grain tile, ~3KB,
tiled under the hero's upper zone and the plum plates. It is a surface, not an
animation.

### Fonts

Fraunces (display) and Inter (text), from Google Fonts, with local serif and
system-sans fallbacks. The two families and their jobs come from the mobile
app's design language so the site and the app read as one ministry.

---

## How it is put together

```
index.html, pages/*.html      generated — do not edit
src/partials/                 head, header (+ mobile menu), footer, scripts
src/pages/                    the <main> of each page, with front matter
assets/css/input.css          Tailwind theme: colour, type, motion tokens
assets/css/layout.css         page compositions (imported by input.css)
assets/css/output.css         generated
assets/js/main.js             header, mobile menu, reveals, content hydration
assets/js/hero.js             the scroll-driven hero
assets/js/gallery.js          the lightbox
assets/data/site-content.js   the content configuration
assets/images/_originals/     the church's unmodified photographs
assets/images/photos/         generated crops (WebP)
scripts/build-pages.mjs       assembles the pages
scripts/build-images.py       derives the photography
```

### Design language

Carried over from the mobile app (`TMI/docs/DESIGN.md`), so the two read as one
ministry: deep aubergine **purple** for the ministry's voice, warm **gold** for
the marks that organise a page, on a warm **ivory** ground. Hierarchy comes from
type and space, not boxes. Corners are tight (4px) and avatars are the only
circles. Hairline rules instead of cards. One gutter. One full-bleed moment per
section.

Two deliberate departures from the app's tokens, both for contrast on the web:

- Text gold is the palette's `gold700` (`#7a5c1e`), not `gold600`. An 11px
  uppercase eyebrow on ivory needs 4.5:1 and `gold600` reaches only 3.9:1.
- Muted metadata is `#716476`, not `#8b7f8e`, which was 3.5:1 at 13px.

### The hero

A sticky stage with three photographic scenes, driven by ordinary scrolling —
nothing is intercepted and there are no slide controls.

1. **Opening** — a grain-textured upper zone (about a fifth of the view) holding
   Psalm 122:1, with the photograph resting below it behind an asymmetric arch.
2. **Expansion** — the photograph rises, the arch flattens, and the textured
   zone is covered.
3. **Scenes** — three photographs dissolve in turn, each with its own headline,
   supporting line and actions. The headline follows its photograph, never
   leads it.
4. **Exit** — the stage releases into the first content section.

Scroll distance is proportional to the number of scenes (`--scene-scroll`),
not an arbitrary tall block: roughly 3.1 viewports on desktop, 2.6 on mobile.
Every tunable number is in `CONFIG` at the top of `hero.js`; the resting
position of the photograph and the arch live in CSS as `--photo-rest` and the
clip path's opening `d`.

Scene 2 is the dark, close portrait on purpose. Scenes 1 and 3 are both wide
crops of the same gathering, and dissolving one into the other reads as a
double exposure rather than a change of scene.

Only `transform`, `opacity` and the clip path's `d` change while it plays, so
no frame causes a layout. One scroll listener, one `requestAnimationFrame`,
one write pass.

### Progressive enhancement

Everything works before the JavaScript does.

- **Without JavaScript**: the hero is its opening composition — photograph in
  place, arch, headline, both actions. The gallery is a list of links to the
  full-size files. Nothing is hidden, because the class that hides a section
  before it animates is only added by a script in `<head>` that runs first.
- **With `prefers-reduced-motion`**: the hero stops being sticky and becomes one
  static composition, reveals are off, and transitions collapse. `hero.js`
  never starts, and reverses itself if the setting changes while the page is
  open.
- If `IntersectionObserver` exists but never delivers (some embedded and
  automated contexts), a timer reveals everything after 1.5s. Content is never
  stranded behind a class that does not arrive.

### Accessibility

Semantic landmarks, a skip link, visible focus throughout (inverted on dark
surfaces), and breadcrumbs on the inner pages. Exactly one `h1` is exposed per
page — the hero holds three, one per scene, but the two off screen are `inert`
and `aria-hidden` in the markup as well as at runtime.

- The mobile menu is a real expanded/collapsed control: `aria-expanded`,
  `aria-controls`, Escape to close, focus trapped while open and returned to
  the button afterwards. The button stays above the overlay so it is always
  reachable by touch.
- Inactive hero scenes are `inert`, so only the headline on screen is
  focusable or announced — and it updates as you scroll.
- The lightbox is a native `<dialog>`: real modal semantics, focus trap,
  Escape, arrow keys, and focus returned to the thumbnail.
- Touch targets are at least 44px.
- Every text pair on the site meets WCAG AA (verified; see *Design language*).
- Informative images have descriptive alternative text; decorative SVG is
  `aria-hidden`.

### Performance

- WebP, with `srcset`/`sizes` on everything that changes size.
- The first hero photograph is preloaded with `fetchpriority="high"`; the other
  two are `fetchpriority="low"`; everything below the fold is lazy.
- `width`/`height` or an aspect ratio on every image, so nothing shifts.
- Pages load only the modules they need: `hero.js` on the homepage,
  `gallery.js` on the homepage and the gallery.
- No third-party JavaScript. The only external request is Google Fonts.

---

## Moving it into Laravel

The markup was written for this.

| Now | Then |
| --- | --- |
| `src/partials/head.html` | `resources/views/layouts/app.blade.php` |
| `src/partials/header.html` | `components/navigation.blade.php` |
| `src/partials/footer.html` | `components/footer.blade.php` |
| `<section class="hero">` | `components/hero.blade.php` |
| `<section class="section-events">` | `components/events-section.blade.php` |
| `<section class="section-gallery">` | `components/gallery-section.blade.php` |
| `<section class="section-gethsemane">` | `components/gethsemane-section.blade.php` |
| `<section class="section-app">` | `components/app-download.blade.php` |
| `assets/data/site-content.js` | a `settings` table, or `config/church.php` |

- Every block that becomes a component is marked `<!-- @component: name -->`,
  and every repeating region is marked `<!-- @loop: $thing -->`.
- `{{BASE}}` in `src/` becomes `asset()` / `route()`.
- `data-content="church.city"` becomes `{{ $church->city }}`; the hydration
  loop in `main.js` can then be deleted.
- The front matter in `src/pages/*.html` becomes `@extends` / `@section`.
- Events are already data-shaped: the Events page has a designed empty state
  rather than placeholder cards, so `@forelse … @empty` drops straight in.
- No build-machine paths and no environment-specific URLs are hardcoded.

The mobile app talks to a Laravel API over a documented contract
(`TMI/docs/API_CONTRACT.md`); events, announcements and the Gethsemane edition
should come from the same source once it exists, so the app and the website
never disagree.

---

## What is not finished

- **Events** is a working page with a real recurring service and an empty state
  for dated events. It is not a stub, but it will look sparse until the church
  publishes dates.
- **About** has a complete layout; its story, vision and visitor sections are
  marked as awaiting the church's own words.
- **Gethsemane** is complete for the 2024 edition and marked "not yet announced"
  for the coming one.
- The **app download** section has no store links, because the app does not
  appear to be published yet.
