import type { BlazerLayer } from "./types";

/** Drop mannequin, shirt, pants, and shoes from a back-view layer stack. */
export function filterJacketOnlyLayers(layers: BlazerLayer[]): BlazerLayer[] {
  return layers.filter((layer) => {
    const cls = layer.className || "";
    if (cls === "shirt" || cls === "man_pant" || cls === "man_shirt") {
      return false;
    }

    const src = layer.src || "";
    if (src.includes("/models/")) {
      return false;
    }
    if (src.includes("/zapatos/")) {
      return false;
    }
    if (src.includes("/Pants/")) {
      return false;
    }
    if (src.includes("/shirt/") && !src.includes("_fabric")) {
      return false;
    }

    return true;
  });
}
