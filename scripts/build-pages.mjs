/**
 * Assembles the static pages from partials.
 *
 * This is a deliberately tiny step - a few string replacements, no dependencies
 * - and it exists so the navigation, the head and the footer live in exactly
 * one place each instead of being copy-pasted into six files and drifting.
 *
 *   src/partials/*.html   head, header (+ mobile menu), footer, scripts
 *   src/pages/*.html      the <main> of each page, plus a small front matter
 *   -> index.html, pages/*.html
 *
 * Laravel migration: each partial becomes a Blade component
 * (`resources/views/components/navigation.blade.php` and so on), the front
 * matter below becomes `@section`/`@extends`, and `{{BASE}}` becomes
 * `asset()` / `route()`. The tokens were chosen to make that a rename.
 *
 * Run: npm run pages
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const partialsDir = join(root, "src", "partials");
const pagesDir = join(root, "src", "pages");

/** Which page goes where, and what the navigation should mark as current. */
const PAGES = {
  home: { out: "index.html", base: "", nav: "home" },
  about: { out: "pages/about.html", base: "../", nav: "about" },
  events: { out: "pages/events.html", base: "../", nav: "events" },
  gallery: { out: "pages/gallery.html", base: "../", nav: "gallery" },
  gethsemane: { out: "pages/gethsemane.html", base: "../", nav: "gethsemane" },
  app: { out: "pages/app.html", base: "../", nav: "app" },
};

/**
 * Front matter is an HTML comment at the top of a page source:
 *   <!--- title: ... | description: ... | bodyClass: ... --->
 */
function readFrontMatter(source) {
  const match = source.match(/^<!---([\s\S]*?)--->\s*/);
  if (!match) return [{}, source];
  const meta = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return [meta, source.slice(match[0].length)];
}

const partials = {};
for (const file of await readdir(partialsDir)) {
  partials[file.replace(/\.html$/, "")] = await readFile(
    join(partialsDir, file),
    "utf8"
  );
}

/** Mark the current page in the navigation, for both sighted and AT users. */
function markCurrent(html, nav) {
  return html.replaceAll(
    new RegExp(`(<a [^>]*data-nav="${nav}")`, "g"),
    '$1 aria-current="page"'
  );
}

/**
 * Pages load only the modules they need. `main.js` is on every page; the hero
 * and the gallery are asked for in a page's front matter.
 */
function extraScripts(meta, page) {
  const names = (meta.scripts ?? "").split(/\s+/).filter(Boolean);
  if (!names.length) return "";
  return names
    .map(
      (name) =>
        `\n    <script type="module" src="${page.base}assets/js/${name}.js"></script>`
    )
    .join("");
}

function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key) =>
    key in values ? values[key] : whole
  );
}

let built = 0;
for (const [name, page] of Object.entries(PAGES)) {
  const [meta, body] = readFrontMatter(
    await readFile(join(pagesDir, `${name}.html`), "utf8")
  );

  const values = {
    BASE: page.base,
    TITLE: meta.title ?? "TwainMan Ministry International",
    DESCRIPTION: meta.description ?? "",
    // Filled here rather than left to the pass below: a token inside an
    // inserted partial would otherwise never be substituted.
    HEAD_EXTRA: meta.headExtra
      ? fill(partials[meta.headExtra] ?? "", { BASE: page.base })
      : "",
  };

  const document = `<!doctype html>
<html lang="en">
  <head>
${fill(partials.head, values)}
  </head>

  <body${meta.bodyClass ? ` class="${meta.bodyClass}"` : ""}>
    <a class="skip-link" href="#main">Skip to content</a>

${markCurrent(fill(partials.header, values), page.nav)}

    <main id="main">
${fill(body, values).trimEnd()}
    </main>

${fill(partials.footer, values)}

    ${fill(partials.scripts, values)}${extraScripts(meta, page)}
  </body>
</html>
`;

  const outPath = join(root, page.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, document, "utf8");
  console.log(`  ${page.out}  ${document.length.toLocaleString()} bytes`);
  built += 1;
}

console.log(`${built} pages built.`);
