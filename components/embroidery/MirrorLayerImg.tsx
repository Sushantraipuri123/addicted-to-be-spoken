/* eslint-disable @next/next/no-img-element */
"use client";

import { useMirrorLayerImg } from "@/lib/preview/mirror-layer-src";

type MirrorLayerImgProps = {
  initialSrc: string;
  className?: string;
  style?: React.CSSProperties;
};

export function MirrorLayerImg({
  initialSrc,
  className,
  style,
}: MirrorLayerImgProps) {
  const { src, onError } = useMirrorLayerImg(initialSrc);

  return (
    <img
      src={src}
      alt=""
      className={className}
      style={style}
      draggable={false}
      onError={onError}
    />
  );
}
