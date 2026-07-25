import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DeviceIdInitializer } from "@/components/device-id-initializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVUndo",
  description: "EV charging station status reporting",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><DeviceIdInitializer />{children}</body>
    </html>
  );
}
