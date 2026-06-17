/**
 * ATBS demo shell: block checkout, snapshot blazer on Accents Next, go to embroidery step.
 */
(function () {
  var BLAZER_DRAFT_KEY = "atbs_blazer_draft";
  var EMBROIDERY_PATH = "/men/custom-jackets/embroidery";
  var PATCHED = "__atbsDemoPatched";

  function filterJacketOnlyLayers(layers) {
    return layers.filter(function (layer) {
      var cls = layer.className || "";
      if (cls === "shirt" || cls === "man_pant" || cls === "man_shirt") {
        return false;
      }
      var src = layer.src || "";
      if (src.indexOf("/models/") !== -1) return false;
      if (src.indexOf("/zapatos/") !== -1) return false;
      if (src.indexOf("/Pants/") !== -1) return false;
      if (src.indexOf("/shirt/") !== -1 && src.indexOf("_fabric") === -1) {
        return false;
      }
      return true;
    });
  }

  function layersForView(garment, viewName, jacketOnly) {
    var current = garment.getCurrentLayers();
    var prevView = current.view;
    var prevWithoutModel = current.without_model;
    if (jacketOnly) {
      current.without_model = true;
    }
    current.view = viewName;

    // renderGetImages (personalize.html) already returns parseImages output:
    // [url, zIndex, className, render] — do not call parseImages again.
    var parsed = garment.renderGetImages();
    current.view = prevView;
    if (jacketOnly) {
      current.without_model = prevWithoutModel;
    }

    var out = [];
    for (var i = 0; i < parsed.length; i++) {
      var row = parsed[i];
      out.push({
        src: row[0],
        zIndex: row[1],
        className: row[2] || "",
      });
    }
    return jacketOnly ? filterJacketOnlyLayers(out) : out;
  }

  function scrapeLayersFromDom() {
    var $ = window.jQuery;
    if (!$) {
      return [];
    }

    var layers = [];
    $("#available_window .layers img")
      .not(".delete")
      .each(function () {
        var img = this;
        var z = parseInt(img.style.zIndex, 10);
        if (isNaN(z)) {
          z = parseInt($(img).css("z-index"), 10);
        }
        if (isNaN(z)) {
          z = 0;
        }

        var cls = img.className || "";
        cls = cls.replace(/\bdelete\b/g, "").trim();

        layers.push({
          src: img.src,
          zIndex: z,
          className: cls,
        });
      });

    return layers;
  }

  function layersAreStable() {
    var $ = window.jQuery;
    if (!$) {
      return false;
    }

    if ($(".loading.active, .image_render .loading.active").length) {
      return false;
    }

    var $imgs = $("#available_window .layers img").not(".delete");
    if (!$imgs.length) {
      return false;
    }

    var stable = true;
    $imgs.each(function () {
      var img = this;
      if (img.getAttribute("data-mirror-live-tried") === "1") {
        return;
      }
      if (!img.complete || img.naturalWidth === 0) {
        stable = false;
        return false;
      }
    });

    return stable;
  }

  function waitForStableLayers(callback, maxAttempts) {
    var attempts = 0;
    maxAttempts = maxAttempts || 80;

    var timer = window.setInterval(function () {
      attempts += 1;
      if (layersAreStable() || attempts >= maxAttempts) {
        window.clearInterval(timer);
        callback(scrapeLayersFromDom());
      }
    }, 50);
  }

  function captureViewFromDom(garment, viewName, callback, options) {
    options = options || {};
    var current = garment.getCurrentLayers();
    var prevView = current.view;
    var prevWithoutModel = current.without_model;
    if (options.jacketOnly) {
      current.without_model = true;
    }
    garment.changeView(viewName);

    waitForStableLayers(function (layers) {
      if (options.jacketOnly) {
        current.without_model = prevWithoutModel;
      }
      if (prevView !== viewName) {
        garment.changeView(prevView, true);
      }
      if (options.jacketOnly) {
        layers = filterJacketOnlyLayers(layers);
      }
      callback(layers);
    });
  }

  function snapshotBlazerFromDom(garment, callback) {
    var current = garment.getCurrentLayers();

    captureViewFromDom(garment, "without_model", function (frontLayers) {
      captureViewFromDom(
        garment,
        "back",
        function (backLayers) {
          callback({
            version: 1,
            savedAt: Date.now(),
            current: JSON.parse(JSON.stringify(current)),
            layers: {
              front: frontLayers.length
                ? frontLayers
                : layersForView(garment, "without_model"),
              back: backLayers.length
                ? backLayers
                : layersForView(garment, "back", true),
            },
          });
        },
        { jacketOnly: true }
      );
    });
  }

  function saveDraftAndNavigate(garment) {
    var $ = window.jQuery;
    if ($) {
      $(".step_next").addClass("disabled");
      $(".step_next span").text("Saving…");
    }

    snapshotBlazerFromDom(garment, function (draft) {
      try {
        if (!draft.layers.front.length && !draft.layers.back.length) {
          throw new Error("No preview layers captured");
        }
        window.localStorage.setItem(BLAZER_DRAFT_KEY, JSON.stringify(draft));
        (window.top || window).location.href = EMBROIDERY_PATH;
      } catch (err) {
        window.alert(
          "Could not save your blazer design. Please try again.\n\n" +
            (err && err.message ? err.message : "")
        );
        if ($) {
          $(".step_next").removeClass("disabled");
          updateNextLabel(garment);
        }
      }
    });
  }

  function patchGarment(garment) {
    if (!garment || garment[PATCHED]) {
      return !!garment;
    }
    garment[PATCHED] = true;

    var origStepNext = garment.stepNext.bind(garment);
    garment.stepNext = function () {
      if (this.step === "extra") {
        saveDraftAndNavigate(this);
        return;
      }
      var result = origStepNext();
      updateNextLabel(this);
      return result;
    };

    if (typeof garment.stepSetURL === "function") {
      var origStepSetURL = garment.stepSetURL.bind(garment);
      garment.stepSetURL = function (step) {
        var result = origStepSetURL(step);
        updateNextLabel(garment);
        return result;
      };
    }

    var form = garment.container;
    if (form && form.length && window.jQuery) {
      form.on("submit.atbsDemo", function (e) {
        e.preventDefault();
        return false;
      });
    }

    updateNextLabel(garment);

    return true;
  }

  function updateNextLabel(garment) {
    if (!window.jQuery) return;
    var label = garment.step === "extra" ? "Continue" : "Next";
    window.jQuery(".step_next span").text(label);
  }

  function patchCartLink() {
    var cart = document.getElementById("cart-trigger");
    if (!cart || cart.getAttribute("data-atbs-demo-wired") === "1") {
      return;
    }
    cart.setAttribute("data-atbs-demo-wired", "1");
    cart.addEventListener("click", function (e) {
      e.preventDefault();
      window.alert("Demo mode: checkout is not available in this preview.");
    });
  }

  function tryPatch() {
    patchCartLink();
    return patchGarment(window.garment);
  }

  function waitForGarment() {
    if (tryPatch()) {
      return;
    }
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (tryPatch() || attempts > 200) {
        window.clearInterval(timer);
      }
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForGarment);
  } else {
    waitForGarment();
  }
})();
