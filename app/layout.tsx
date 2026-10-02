import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { rootMetadata } from "@/lib/seo";
import { RouteLoader } from "@/components/site/route-loader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display face used by Sticky Cards titles
const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = rootMetadata;

// Runs before first paint so the stored theme never flashes. Dark is the default.
const themeScript = `try{var t=localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t!=="light")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <RouteLoader />
        <Analytics />
      </body>
    </html>
  );
}
