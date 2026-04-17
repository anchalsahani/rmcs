import type { Metadata } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans, Yatra_One } from "next/font/google";

const display = Yatra_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const ui = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Raja Mantri Chor Sipahi",
  description: "Game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
