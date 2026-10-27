/**
 * The hero: a sticky stage whose photograph rises, flattens its arch and then
 * moves through three scenes as the page scrolls.
 *
 * Design notes
 * - Ordinary browser scrolling. Nothing is intercepted, nothing is hijacked;
 *   the stage is `position: sticky` and the track below it supplies the
 *   distance. The scroll distance is proportional to the number of scenes
 *   (see --scene-scroll in layout.css), not an arbitrary very tall block.
 * - One scroll listener, one rAF, one write pass. Every value the hero needs
 *   is derived from a single progress number.
 * - Only `transform`, `opacity` and the clip path's `d` change, so no frame
 *   causes a layout.
 * - With reduced motion, or without JavaScript, the CSS already shows the
 *   opening composition complete and this module does nothing.
 */

const hero = document.querySelector("[data-hero]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Every tunable number the hero has, in one place. */
const CONFIG = {
  /** Progress at which the photograph has finished covering the upper zone. */
  riseEnds: 0.22,
  /** Arch depth as a fraction of the photo layer, at rest and once risen. */
  archAtRest: 0.17,
  archWhenRisen: 0.012,
  /** Where in a scene's share of the scroll the dissolve happens, and how
      long it lasts. A scene holds still for most of its distance and then
      changes quickly: a long linear cross-fade between two photographs of the
      same room reads as a double exposure, not as a transition. */
  swapStarts: 0.62,
  swapLasts: 0.2,
  /** Hysteresis for the headline swap, so it can never chatter at a threshold. */
  swapIn: 0.55,
  swapOut: 0.45,
};

if (hero) {
  const track = hero.querySelector(".hero-track");
  const stage = hero.querySelector(".hero-stage");
  const photo = hero.querySelector("[data-hero-photo]");
  const crown = hero.querySelector("[data-hero-crown]");
  const archPath = hero.querySelector("[data-hero-arch]");
  const scenes = [...hero.querySelectorAll(".hero-scene")];
  const states = [...hero.querySelectorAll(".hero-state")];
  const markerIndex = hero.querySelector("[data-hero-index]");
  const markerLabel = hero.querySelector("[data-hero-label]");
  const crownInner = hero.querySelector(".hero-crown-inner");

  const clamp = (value, min = 0, max = 1) =>
    value < min ? min : value > max ? max : value;
  /** Gentle ease so the photograph settles rather than snapping into place. */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  /** Smooth both ends of the dissolve so neither photograph pops. */
  const smoothstep = (t) => t * t * (3 - 2 * t);

  /**
   * The arch that clips the photograph: a broad crest set left of centre, with
   * a steeper left shoulder. `depth` 0 flattens it to a straight edge, which is
   * what the risen state wants.
   */
  function archFor(depth) {
    const n = (value) => value.toFixed(4);
    return (
      `M0,1 V${n(depth)} ` +
      `C0.1000,${n(depth * 0.55)} 0.2400,0 0.4000,0 ` +
      `C0.5800,0 0.7400,${n(depth * 0.6)} 1,${n(depth * 0.9)} V1 Z`
    );
  }

  let trackHeight = 0;
  let stageHeight = 0;
  let scrollDistance = 1;
  let inView = true;
  let queued = false;
  let textIndex = 0;

  function measure() {
    trackHeight = track.offsetHeight;
    stageHeight = stage.offsetHeight;
    // Guard against a zero divisor on very short viewports.
    scrollDistance = Math.max(1, trackHeight - stageHeight);
  }

  function setActiveState(next) {
    if (next === textIndex) return;
    textIndex = next;

    states.forEach((state, index) => {
      const active = index === next;
      state.classList.toggle("is-active", active);
      // `inert` keeps the inactive headlines and their buttons out of both the
      // tab order and the accessibility tree, so only the scene on screen is
      // ever announced or focusable.
      state.toggleAttribute("inert", !active);
      if (active) state.removeAttribute("aria-hidden");
      else state.setAttribute("aria-hidden", "true");
    });

    scenes.forEach((scene, index) => {
      if (index === next) scene.removeAttribute("aria-hidden");
      else scene.setAttribute("aria-hidden", "true");
    });

    if (markerIndex) markerIndex.textContent = String(next + 1).padStart(2, "0");
    if (markerLabel) markerLabel.textContent = states[next]?.dataset.marker ?? "";
  }

  function render() {
    queued = false;

    // One read of the live layout, then only writes.
    const progress = clamp(-track.getBoundingClientRect().top / scrollDistance);

    /* --- phase A: the photograph rises and the arch flattens ------------- */
    const rise = easeOut(clamp(progress / CONFIG.riseEnds));

    // CSS owns the resting distance (--photo-rest); this is only how far
    // through the rise we are.
    photo.style.setProperty("--rise", rise.toFixed(4));
    archPath.setAttribute(
      "d",
      archFor(
        CONFIG.archAtRest + (CONFIG.archWhenRisen - CONFIG.archAtRest) * rise
      )
    );

    if (crownInner) {
      crownInner.style.opacity = String(1 - clamp(rise * 1.3));
      crownInner.style.transform = `translate3d(0, ${(-30 * rise).toFixed(1)}px, 0)`;
    }

    /* --- phase B: the scenes cross-fade ---------------------------------- */
    const after = clamp(
      (progress - CONFIG.riseEnds) / (1 - CONFIG.riseEnds)
    );
    const position = after * (scenes.length - 1);
    const index = Math.min(Math.floor(position), scenes.length - 2);
    const blend = scenes.length > 1 ? position - index : 0;

    const fade = smoothstep(
      clamp((blend - CONFIG.swapStarts) / CONFIG.swapLasts)
    );

    scenes.forEach((scene, i) => {
      // `local` runs 0 -> 1 across the scene that is leaving and -1 -> 0 across
      // the one arriving, so the two are never in register while they overlap
      // and the dissolve cannot read as a ghost. CSS turns it into the scale
      // and the drift.
      let opacity = 0;
      let local = 0;
      if (i === index) {
        opacity = 1 - fade;
        local = blend;
      } else if (i === index + 1) {
        opacity = fade;
        local = blend - 1;
      }
      scene.style.opacity = String(opacity);
      if (opacity > 0) scene.style.setProperty("--local", local.toFixed(4));
    });

    /* --- the headline follows its photograph, never leads it ------------- */
    const next =
      fade > CONFIG.swapIn
        ? index + 1
        : fade < CONFIG.swapOut
          ? index
          : textIndex;
    setActiveState(clamp(next, 0, states.length - 1));
  }

  function onScroll() {
    if (queued || !inView) return;
    queued = true;
    requestAnimationFrame(render);
  }

  /**
   * requestAnimationFrame does not run while the document is hidden, so a
   * frame queued just before the tab was backgrounded never arrives and
   * `queued` would stay true for good - leaving the hero frozen on whatever
   * scene it was showing. Clear it and re-measure when we come back.
   */
  function onVisibilityChange() {
    if (document.hidden) return;
    queued = false;
    measure();
    render();
  }

  function start() {
    hero.classList.add("hero-is-driven");
    measure();
    render();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onVisibilityChange);

    // Skip all work while the hero is off screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) onScroll();
        },
        { rootMargin: "120px" }
      ).observe(hero);
    }
  }

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measure();
      render();
    }, 120);
  }

  function stop() {
    hero.classList.remove("hero-is-driven");
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onVisibilityChange);
    // Hand the hero back to CSS as the finished opening composition.
    photo.style.removeProperty("--rise");
    scenes.forEach((scene) => {
      scene.style.removeProperty("opacity");
      scene.style.removeProperty("--local");
    });
    if (crownInner) {
      crownInner.style.removeProperty("opacity");
      crownInner.style.removeProperty("transform");
    }
    setActiveState(0);
  }

  if (!reduceMotion.matches) start();

  // Honour the setting if it is changed while the page is open.
  reduceMotion.addEventListener("change", (event) =>
    event.matches ? stop() : start()
  );

  // The scenes' heights settle once their images have decoded.
  window.addEventListener("load", onResize);
}
