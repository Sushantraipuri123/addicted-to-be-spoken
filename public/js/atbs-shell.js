/**
 * ATBS shell: turns the legacy step tabs into a left rail + offcanvas panels.
 *
 * Presentation only — all step changes still flow through the legacy Garment
 * engine (clicking a rail item triggers `garment.stepSetURL(rel)`). This script
 * just opens/closes the sliding panel and keeps `body` state in sync.
 */
(function () {
  var PATCHED = "__atbsShellPatched";
  var MAIN_STEPS = { fabric: 1, config: 1, extra: 1 };
  var PANEL_IDS = ["fabric", "config", "extra"];

  function openOffcanvas(step) {
    document.body.classList.add("atbs-offcanvas-open");
    if (step && MAIN_STEPS[step]) {
      document.body.setAttribute("data-atbs-step", step);
    }
    trackArrows(420);
  }

  function closeOffcanvas() {
    document.body.classList.remove("atbs-offcanvas-open");
    trackArrows(420);
  }

  /* ---- Rotation arrows: keep them hugging the garment on every screen ---- */
  var ARROW_INSET = 12; // px nudged toward the blazer from the garment box edge

  function clamp(v, lo, hi) {
    if (hi < lo) return (lo + hi) / 2;
    return Math.max(lo, Math.min(hi, v));
  }

  function positionArrows() {
    var win = document.getElementById("available_window");
    if (!win) return;
    var garment = win.querySelector(".layers");
    var left = win.querySelector(".view_arrow.left");
    var right = win.querySelector(".view_arrow.right");
    if (!garment || !left || !right) return;

    var wb = win.getBoundingClientRect();
    var gb = garment.getBoundingClientRect();
    if (!gb.width || !gb.height || !wb.width) return;

    var aw = left.offsetWidth || 42;
    var ah = left.offsetHeight || 42;

    var vCenter = gb.top - wb.top + gb.height / 2;

    // Work in absolute (viewport) coordinates, then clamp to the screen so the
    // arrows are always visible even when the garment overflows a narrow canvas.
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var railW = parseInt(
      window.getComputedStyle(document.documentElement).getPropertyValue("--atbs-rail-w"),
      10
    );
    if (isNaN(railW)) railW = 0;

    var minAbs = Math.max(railW, 0) + aw / 2 + 6;
    var maxAbs = vw - aw / 2 - 6;

    var lAbs = clamp(gb.left + ARROW_INSET, minAbs, maxAbs);
    var rAbs = clamp(gb.right - ARROW_INSET, minAbs, maxAbs);

    // Keep the two arrows from colliding on a very narrow canvas.
    if (rAbs - lAbs < aw + 12) {
      var mid = (lAbs + rAbs) / 2;
      lAbs = mid - (aw / 2 + 8);
      rAbs = mid + (aw / 2 + 8);
    }

    setArrow(left, lAbs - wb.left, vCenter, aw, ah, true);
    setArrow(right, rAbs - wb.left, vCenter, aw, ah, false);
    document.body.classList.add("atbs-arrows-ready");
  }

  function setArrow(el, cx, cy, aw, ah, isLeft) {
    el.style.left = Math.round(cx - aw / 2) + "px";
    el.style.right = "auto";
    el.style.top = Math.round(cy - ah / 2) + "px";
    el.style.bottom = "auto";
    el.style.transform = isLeft ? "rotate(180deg)" : "none";
  }

  var trackRaf = null;
  function trackArrows(durationMs) {
    var end = Date.now() + (durationMs || 0);
    if (trackRaf) {
      window.cancelAnimationFrame(trackRaf);
    }
    function tick() {
      positionArrows();
      if (Date.now() < end) {
        trackRaf = window.requestAnimationFrame(tick);
      } else {
        trackRaf = null;
      }
    }
    tick();
  }

  function watchArrows() {
    var win = document.getElementById("available_window");
    if (!win || win.getAttribute("data-atbs-arrows") === "1") {
      return;
    }
    var garment = win.querySelector(".layers");
    if (!garment) return;
    win.setAttribute("data-atbs-arrows", "1");

    window.addEventListener("resize", function () {
      trackArrows(0);
    });

    // Reflows from image (re)loads and view changes.
    if (typeof window.ResizeObserver === "function") {
      var ro = new window.ResizeObserver(function () {
        positionArrows();
      });
      ro.observe(garment);
    }
    if (typeof window.MutationObserver === "function") {
      var mo = new window.MutationObserver(function () {
        trackArrows(0);
      });
      mo.observe(garment, { childList: true, subtree: true, attributes: true });
    }

    trackArrows(900);
  }

  function removeBackdrop() {
    // Backdrop intentionally disabled: the preview (and its rotation arrows)
    // must stay interactive while a panel is open.
    var existing = document.getElementById("atbs-offcanvas-backdrop");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function injectCloseButtons() {
    PANEL_IDS.forEach(function (id) {
      var panel = document.getElementById(id);
      if (!panel || panel.querySelector(".atbs-offcanvas-close")) {
        return;
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "atbs-offcanvas-close";
      btn.setAttribute("aria-label", "Close panel");
      btn.innerHTML = "\u00d7";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeOffcanvas();
      });
      panel.appendChild(btn);
    });
  }

  function activeMainStep() {
    for (var i = 0; i < PANEL_IDS.length; i++) {
      var panel = document.getElementById(PANEL_IDS[i]);
      if (panel && panel.classList.contains("active")) {
        return PANEL_IDS[i];
      }
    }
    return "fabric";
  }

  function wireRail() {
    var rail = document.querySelector(".menu_principal");
    if (!rail || rail.getAttribute("data-atbs-rail") === "1") {
      return;
    }
    rail.setAttribute("data-atbs-rail", "1");

    // Capture phase: toggle closed when tapping the already-open step, otherwise
    // let the legacy delegated handler run (it calls garment.stepSetURL).
    rail.addEventListener(
      "click",
      function (e) {
        var opt = e.target.closest(".option.step");
        if (!opt) {
          return;
        }
        var rel = opt.getAttribute("rel");
        if (!rel || !MAIN_STEPS[rel]) {
          return;
        }
        if (
          document.body.classList.contains("atbs-offcanvas-open") &&
          document.body.getAttribute("data-atbs-step") === rel
        ) {
          e.preventDefault();
          e.stopPropagation();
          closeOffcanvas();
        }
      },
      true
    );
  }

  function patchGarment(garment) {
    if (!garment || garment[PATCHED]) {
      return !!garment;
    }
    garment[PATCHED] = true;

    if (typeof garment.stepSetURL === "function") {
      var origStepSetURL = garment.stepSetURL.bind(garment);
      garment.stepSetURL = function (step) {
        var result = origStepSetURL(step);
        if (step && MAIN_STEPS[step]) {
          openOffcanvas(step);
        }
        return result;
      };
    }

    if (typeof garment.changeView === "function") {
      var origChangeView = garment.changeView.bind(garment);
      garment.changeView = function () {
        var result = origChangeView.apply(garment, arguments);
        trackArrows(700);
        return result;
      };
    }

    watchArrows();

    // Open the panel for whatever step the engine settled on (Fabric by default).
    openOffcanvas(activeMainStep());

    return true;
  }

  function init() {
    removeBackdrop();
    injectCloseButtons();
    wireRail();
    watchArrows();
    patchGarment(window.garment);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) {
      closeOffcanvas();
    }
  });

  function boot() {
    init();
    if (window.garment && window.garment[PATCHED]) {
      return;
    }
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      init();
      if ((window.garment && window.garment[PATCHED]) || attempts > 200) {
        window.clearInterval(timer);
      }
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
