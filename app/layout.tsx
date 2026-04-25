import type { Metadata } from "next";
import "./globals.css";
import { Chicle, Indie_Flower, Story_Script } from "next/font/google";

const chicle = Chicle({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-chicle",
});

const indie = Indie_Flower({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-indie",
});

const story = Story_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-story",
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
    <html lang="en" className={`${chicle.variable} ${indie.variable} ${story.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
