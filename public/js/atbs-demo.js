/**
 * ATBS demo: last step "Next" would POST to Hockerty and redirect to cart/checkout.
 * Intercept the final step so this mirror stays on-page (demo / preview only).
 */
(function () {
  function tryBind() {
    var $ = window.jQuery;
    var g = window.garment;
    if (!$ || !g || g.__atbsDemoPatched) return g && g.__atbsDemoPatched;

    g.__atbsDemoPatched = true;

    var origStepNext = g.stepNext.bind(g);
    g.stepNext = function () {
      if (this.step === "extra") {
        window.alert(
          "Demo mode — this preview does not submit orders or open checkout. You can keep editing your jacket here.",
        );
        $("a.step_next").removeClass("disabled");
        return;
      }
      return origStepNext();
    };

    $(document).on("submit", "form.garment_form", function (e) {
      if (window.garment && window.garment.step === "extra") {
        e.preventDefault();
        return false;
      }
    });

    return true;
  }

  /** Limit fabric grid to first N swatches (demo / curated subset). */
  var ATBS_FABRIC_MAX = 25;
  var capScheduled = false;

  function capFabricList() {
    var $ = window.jQuery;
    if (!$) return;
    var $boxes = $("#fabric .fabric_list .fabric_box");
    if (!$boxes.length) return;
    $boxes.removeClass("atbs-fabric-hidden");
    $boxes.each(function (index) {
      if (index >= ATBS_FABRIC_MAX) {
        $(this).addClass("atbs-fabric-hidden");
      }
    });
    updateFabricResumeDisplay();
  }

  /** Keep header + show_results counts in sync with capped visible swatches (legacy JS writes 190/190). */
  function updateFabricResumeDisplay() {
    var $ = window.jQuery;
    if (!$) return;
    var $all = $("#fabric .fabric_list .fabric_box");
    if (!$all.length) return;
    var visible = $("#fabric .fabric_list .fabric_box:not(.atbs-fabric-hidden)").length;
    var denom = Math.min(ATBS_FABRIC_MAX, $all.length);
    var shown = Math.min(visible, denom);
    $("#fabric .header_fabrics .detail.number, #fabric .header_fabrics .number").html(String(shown));
    $("#fabric .header_fabrics .total_number").html(String(denom));
    $(".show_results .number").html(String(shown));
  }

  function scheduleCap() {
    if (capScheduled) return;
    capScheduled = true;
    window.requestAnimationFrame(function () {
      capScheduled = false;
      capFabricList();
      window.setTimeout(updateFabricResumeDisplay, 0);
      window.setTimeout(updateFabricResumeDisplay, 120);
    });
  }

  function watchFabricList() {
    var el = document.querySelector("#fabric .fabric_list");
    if (!el || el.__atbsFabricObserved) return;
    el.__atbsFabricObserved = true;
    var obs = new MutationObserver(function () {
      scheduleCap();
    });
    obs.observe(el, { childList: true, subtree: true });
    scheduleCap();
  }

  /** Re-sync counts after legacy JS updates the resume (e.g. open filters). */
  function watchFabricResumeRewrites() {
    if (document.body.__atbsFabricResumeWire) return;
    document.body.__atbsFabricResumeWire = true;
    window.jQuery(document).on("click", "#fabric .header_fabrics .bton", function () {
      window.setTimeout(updateFabricResumeDisplay, 0);
      window.setTimeout(updateFabricResumeDisplay, 250);
      window.setTimeout(updateFabricResumeDisplay, 600);
    });
  }

  function start() {
    if (!window.jQuery) {
      setTimeout(start, 30);
      return;
    }
    window.jQuery(function () {
      watchFabricResumeRewrites();
      watchFabricList();
      var capBoot = 0;
      var capBootId = window.setInterval(function () {
        scheduleCap();
        if (++capBoot > 50) window.clearInterval(capBootId);
      }, 200);

      if (tryBind()) return;
      var n = 0;
      var id = window.setInterval(function () {
        if (tryBind() || n++ > 120) window.clearInterval(id);
      }, 50);
    });
  }

  start();
})();
