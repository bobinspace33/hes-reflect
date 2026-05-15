import type { Metadata } from "next";
import { Raleway, Roboto_Mono } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DGMD-E57 Reflection • Bob Kelly",
  description:
    "An interactive reading of design-process documents, with themes and reflections.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${raleway.variable} ${robotoMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
