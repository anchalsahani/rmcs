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
  description: "Play the classic Raja Mantri Chor Sipahi game online",

  icons: {
    icon: "/logo.png",          // favicon
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  openGraph: {
    title: "Raja Mantri Chor Sipahi",
    description: "Play the classic Raja Mantri Chor Sipahi game online",
    url: "https://yourdomain.com", // 🔥 replace with your deployed URL
    siteName: "Raja Mantri Chor Sipahi",
    images: [
      {
        url: "/logo.png", // this is what shows when sharing
        width: 1200,
        height: 630,
        alt: "Raja Mantri Chor Sipahi Game",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Raja Mantri Chor Sipahi",
    description: "Play the classic Raja Mantri Chor Sipahi game online",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${chicle.variable} ${indie.variable} ${story.variable}`}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}