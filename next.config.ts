import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/en-us/fabrics/feed/man_jacket",
        destination: "/en-us/fabrics/feed/man_jacket/index.html",
      },
      {
        source: "/en-us/fabrics/feed/man_jacket/",
        destination: "/en-us/fabrics/feed/man_jacket/index.html",
      },
      {
        source: "/en-us/linings/feed/man_jacket",
        destination: "/en-us/linings/feed/man_jacket/index.html",
      },
      {
        source: "/en-us/linings/feed/man_jacket/",
        destination: "/en-us/linings/feed/man_jacket/index.html",
      },
      {
        source: "/en-us/accessories/feed/panuelos",
        destination: "/en-us/accessories/feed/panuelos/index.html",
      },
      {
        source: "/en-us/accessories/feed/panuelos/",
        destination: "/en-us/accessories/feed/panuelos/index.html",
      },
    ];
  },
};

export default nextConfig;
