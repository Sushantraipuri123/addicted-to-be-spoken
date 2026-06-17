/* eslint-disable @next/next/no-img-element */
"use client";

import type { BlazerLayer, EmbroiderySelection } from "@/lib/embroidery/types";
import { filterJacketOnlyLayers } from "@/lib/embroidery/jacket-only-layers";
import { EMBROIDERY_PLACEMENTS } from "@/lib/embroidery/placements";
import { MirrorLayerImg } from "./MirrorLayerImg";

type BlazerLayerStackProps = {
  layers: BlazerLayer[];
  embroidery?: EmbroiderySelection;
  view: "front" | "back";
};

export function BlazerLayerStack({
  layers,
  embroidery,
  view,
}: BlazerLayerStackProps) {
  const visibleLayers =
    view === "back" ? filterJacketOnlyLayers(layers) : layers;
  const sorted = [...visibleLayers].sort((a, b) => a.zIndex - b.zIndex);
  const placement = EMBROIDERY_PLACEMENTS[view];

  return (
    <div className="embroidery-preview__stack" aria-label="Blazer preview">
      {sorted.map((layer, index) => (
        <MirrorLayerImg
          key={`${layer.zIndex}-${index}-${layer.src}`}
          initialSrc={layer.src}
          className={`embroidery-preview__layer${layer.className ? ` ${layer.className}` : ""}`}
          style={{ zIndex: layer.zIndex }}
        />
      ))}
      {embroidery ? (
        <img
          src={embroidery.src}
          alt="Embroidery overlay"
          className="embroidery-preview__overlay"
          style={{
            zIndex: 1000,
            left: placement.left,
            top: placement.top,
            width: placement.width,
          }}
          draggable={false}
        />
      ) : null}
    </div>
  );
}
