/**
 * Local mirror helpers for Hockerty personalize:
 * 1) If a /3d/new_man/ layer PNG 404s locally, retry the same path on www.hockerty.com (works when online).
 * 2) If layers still fail, enable "limited customization" (banner + simplified sidebar).
 */
(function () {
  var LIVE_ORIGIN = "https://www.hockerty.com";
  var ATTR_TRIED = "data-mirror-live-tried";
  var ATTR_LIVE_FAIL = "data-mirror-live-failed";
  var checkTimer;

  function injectBannerAndStyles() {
    if (document.getElementById("mirror-limited-styles")) return;
    var style = document.createElement("style");
    style.id = "mirror-limited-styles";
    style.textContent =
      "#mirror-limited-banner{display:none;background:#fff8e6;border-bottom:1px solid #f0c14d;color:#5c4a12;font-size:12px;line-height:1.45;padding:10px 14px;position:relative;z-index:9999;}" +
      "body.mirror-limited-customization #mirror-limited-banner{display:block;}" +
      "body.mirror-limited-customization .personalize #extra.sidebar-options{display:none !important;}" +
      "body.mirror-limited-customization .personalize .change_minimal_version{display:none !important;}";
    document.head.appendChild(style);
    var bar = document.createElement("div");
    bar.id = "mirror-limited-banner";
    bar.innerHTML =
      "<strong>Limited customization mode.</strong> Some 3D preview images are not in this offline copy. " +
      "Accents are hidden to avoid broken controls. With internet, missing layers retry from Hockerty automatically; " +
      "for a fuller offline pack, record a longer session into <code>www.hockerty.com.har</code> and run <code>extract_har_assets.py</code>.";
    var body = document.body;
    if (body.firstChild) body.insertBefore(bar, body.firstChild);
    else body.appendChild(bar);
  }

  function enableLimitedMode() {
    injectBannerAndStyles();
    document.body.classList.add("mirror-limited-customization");
  }

  function sameOriginPath(src) {
    try {
      var u = new URL(src, window.location.href);
      if (u.pathname.indexOf("/3d/new_man/") !== 0) return null;
      return u.pathname + (u.search || "");
    } catch (e) {
      return null;
    }
  }

  function tryLive(img) {
    var path = sameOriginPath(img.src || img.getAttribute("src") || "");
    if (!path) return;
    if (img.getAttribute(ATTR_TRIED) === "1") {
      img.setAttribute(ATTR_LIVE_FAIL, "1");
      return;
    }
    img.setAttribute(ATTR_TRIED, "1");
    img.src = LIVE_ORIGIN + path;
  }

  function onImgError(ev) {
    var img = ev.target;
    if (!img || img.tagName !== "IMG") return;
    var path = sameOriginPath(img.src || "");
    if (!path) return;
    if (img.getAttribute(ATTR_TRIED) === "1") {
      img.setAttribute(ATTR_LIVE_FAIL, "1");
      scheduleLimitedCheck();
      return;
    }
    tryLive(img);
    scheduleLimitedCheck();
  }

  function wireImg(img) {
    if (!img || img.nodeName !== "IMG") return;
    if (img.getAttribute("data-mirror-wired") === "1") return;
    img.setAttribute("data-mirror-wired", "1");
    img.addEventListener("error", onImgError);
  }

  function scanImages(root) {
    if (!root) return;
    var list = root.querySelectorAll ? root.querySelectorAll("img") : [];
    for (var i = 0; i < list.length; i++) wireImg(list[i]);
  }

  function countBrokenLayerImages() {
    var roots = document.querySelectorAll("#available_window .layers, #available_window_zoom .layers");
    var broken = 0;
    for (var r = 0; r < roots.length; r++) {
      var imgs = roots[r].querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        var src = img.src || "";
        if (src.indexOf("/3d/new_man/") === -1) continue;
        if (img.getAttribute(ATTR_LIVE_FAIL) === "1") broken++;
      }
    }
    return broken;
  }

  function scheduleLimitedCheck() {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(function () {
      if (countBrokenLayerImages() >= 2) enableLimitedMode();
    }, 600);
  }

  function observeLayers() {
    var targets = [
      document.getElementById("available_window"),
      document.getElementById("available_window_zoom"),
    ];
    for (var t = 0; t < targets.length; t++) {
      var el = targets[t];
      if (!el) continue;
      scanImages(el);
      var mo = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var mu = muts[m];
          for (var j = 0; j < mu.addedNodes.length; j++) {
            var n = mu.addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.tagName === "IMG") wireImg(n);
            else scanImages(n);
          }
        }
        scheduleLimitedCheck();
      });
      mo.observe(el, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeLayers);
  } else {
    observeLayers();
  }

  window.addEventListener("load", function () {
    setTimeout(scheduleLimitedCheck, 2000);
  });
})();
