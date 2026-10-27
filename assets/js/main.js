/**
 * Global behaviour: the header, the mobile menu, section reveals and content
 * hydration. Everything here is an enhancement - the page is complete and
 * readable before this file runs.
 */

import content, { PLACEHOLDER } from "../data/site-content.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

/* ---------------------------------------------------------------------------
   Content hydration

   Every element with data-content="a.b.c" is rewritten from site-content.js, so
   the church edits one file rather than six pages. Values still marked as
   placeholders are left exactly as the HTML wrote them, which is where the
   visible "to confirm" markers live.
--------------------------------------------------------------------------- */

function readPath(object, path) {
  return path
    .split(".")
    .reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function hydrateContent() {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = readPath(content, element.dataset.content);
    if (typeof value === "string" && value && value !== PLACEHOLDER) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

/* ---------------------------------------------------------------------------
   Header: transparent over the hero's paper, solid once the page moves.
--------------------------------------------------------------------------- */

function initHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const PIN_AT = 32;
  let pinned = null;

  const sync = () => {
    const shouldPin = window.scrollY > PIN_AT;
    if (shouldPin !== pinned) {
      pinned = shouldPin;
      header.classList.toggle("is-pinned", shouldPin);
    }
  };

  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

/* ---------------------------------------------------------------------------
   Mobile menu: a labelled button, a real expanded state, Escape to close and
   focus kept inside while it is open.
--------------------------------------------------------------------------- */

function initMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (!toggle || !menu) return;

  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

  function open() {
    lastFocused = document.activeElement;
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    // Lets the header restyle itself over the open overlay: it stays above the
    // menu so the close button is always visible and tappable.
    document.documentElement.classList.add("menu-is-open");
    const first = menu.querySelector(FOCUSABLE);
    if (first) first.focus();
  }

  function close({ restoreFocus = true } = {}) {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.documentElement.classList.remove("menu-is-open");
    if (!restoreFocus) return;
    // Fall back to the button: if the menu was opened without the button ever
    // holding focus, returning focus to <body> would strand a keyboard user.
    const target =
      lastFocused instanceof HTMLElement && lastFocused !== document.body
        ? lastFocused
        : toggle;
    target.focus();
  }

  toggle.addEventListener("click", () => (isOpen() ? close() : open()));

  // Following a link closes the menu without stealing focus back to the button.
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) close({ restoreFocus: false });
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;

    const items = [...menu.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // A resize into the desktop layout leaves the overlay stranded.
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
    if (event.matches && isOpen()) close({ restoreFocus: false });
  });
}

/* ---------------------------------------------------------------------------
   Section entrances: one observer for the whole page, each element released
   once and then forgotten.
--------------------------------------------------------------------------- */

function initReveals() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("is-revealed"));
    return;
  }

  const revealAll = () =>
    targets.forEach((element) => element.classList.add("is-revealed"));

  let revealedAny = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealedAny = true;
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
  );

  targets.forEach((element) => observer.observe(element));

  // A safety net, because content must never be stranded behind a class that
  // does not arrive. Some embedded and automated contexts expose
  // IntersectionObserver but never report an intersection. If nothing has been
  // revealed by now and something is plainly on screen, show everything.
  // Deliberately not tied to the load event, which may already have fired.
  setTimeout(() => {
    if (revealedAny) return;
    const anythingOnScreen = [...targets].some((element) => {
      const box = element.getBoundingClientRect();
      return box.top < window.innerHeight && box.bottom > 0;
    });
    if (anythingOnScreen) revealAll();
  }, 1500);

  // And once more on the first scroll: if the page has moved and the observer
  // still has not revealed a single element, stop trusting it.
  window.addEventListener(
    "scroll",
    () => {
      if (revealedAny) return;
      setTimeout(() => {
        if (!revealedAny) revealAll();
      }, 400);
    },
    { passive: true, once: true }
  );
}

/* ---------------------------------------------------------------------------
   What the church still owes this site. Printed only when it is being served
   locally, so it is impossible to forget and invisible in production.
--------------------------------------------------------------------------- */

function reportOutstanding() {
  const local = ["localhost", "127.0.0.1", "::1", ""].includes(
    window.location.hostname
  );
  if (!local || !content.outstanding?.length) return;

  console.groupCollapsed(
    `%cTwainMan Ministry - ${content.outstanding.length} items still needed before launch`,
    "color:#9a762f;font-weight:600"
  );
  content.outstanding.forEach((item) => console.log(`- ${item}`));
  console.log("Edit assets/data/site-content.js");
  console.groupEnd();
}

hydrateContent();
initHeader();
initMobileMenu();
initReveals();
reportOutstanding();
