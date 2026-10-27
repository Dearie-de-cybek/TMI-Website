/**
 * Gallery lightbox.
 *
 * The gallery in the HTML is a plain list of links to the full-size files, so
 * it works, and every photograph is reachable, with this script absent. Here we
 * upgrade those links into a modal viewer.
 *
 * A native <dialog> is used deliberately: it gives a real modal, a focus trap,
 * Escape-to-close and inert page content without any of that being
 * reimplemented by hand.
 */

const galleries = document.querySelectorAll("[data-gallery]");

if (galleries.length && typeof HTMLDialogElement === "function") {
  galleries.forEach(setUpGallery);
}

function setUpGallery(gallery) {
  const links = [...gallery.querySelectorAll("a[href]")];
  if (!links.length) return;

  const items = links.map((link) => ({
    href: link.getAttribute("href"),
    caption:
      link.dataset.caption ||
      link.querySelector("img")?.getAttribute("alt") ||
      "",
    alt: link.querySelector("img")?.getAttribute("alt") || "",
  }));

  let current = 0;

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Photograph viewer");
  dialog.innerHTML = `
    <div class="lightbox-bar">
      <p class="eyebrow" data-count></p>
      <button type="button" data-close>Close</button>
    </div>
    <figure class="lightbox-figure"><img alt="" data-image /></figure>
    <p class="lightbox-caption" data-caption></p>
    <div class="lightbox-controls">
      <button type="button" data-prev>&larr;&nbsp;Previous</button>
      <button type="button" data-next>Next&nbsp;&rarr;</button>
    </div>
  `;
  document.body.append(dialog);

  const image = dialog.querySelector("[data-image]");
  const caption = dialog.querySelector("[data-caption]");
  const count = dialog.querySelector("[data-count]");
  const previousButton = dialog.querySelector("[data-prev]");
  const nextButton = dialog.querySelector("[data-next]");

  function show(index) {
    current = (index + items.length) % items.length;
    const item = items[current];
    image.src = item.href;
    image.alt = item.alt;
    caption.textContent = item.caption;
    count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(
      items.length
    ).padStart(2, "0")}`;
  }

  function open(index) {
    show(index);
    dialog.showModal();
  }

  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      // Let people still open the file directly if they mean to.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
        return;
      }
      event.preventDefault();
      open(index);
    });
  });

  previousButton.addEventListener("click", () => show(current - 1));
  nextButton.addEventListener("click", () => show(current + 1));
  dialog.querySelector("[data-close]").addEventListener("click", () =>
    dialog.close()
  );

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(current + 1);
    }
  });

  // Clicking the surround closes it; clicking the picture does not.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Returning focus to the thumbnail that was opened keeps the reading
  // position when the viewer closes.
  dialog.addEventListener("close", () => {
    links[current]?.focus({ preventScroll: true });
  });
}
