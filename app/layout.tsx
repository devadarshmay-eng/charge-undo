import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DeviceIdInitializer } from "@/components/device-id-initializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVUndo",
  description: "EV charging station status reporting",
  manifest: "/site.webmanifest",
  icons: {
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><DeviceIdInitializer />{children}</body>
    </html>
  );
}
