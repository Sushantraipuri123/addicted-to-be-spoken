import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Custom jackets — personalize",
  description: "Legacy Hockerty jacket configurator (mirrored)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
