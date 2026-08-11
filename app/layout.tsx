import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restless Coffee & Eatery | Yogyakarta",
  description: "Kopi, comfort food, dan ruang untuk beristirahat di Jl. Gayam No. 3, Yogyakarta.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Restless Coffee & Eatery",
    description: "Take a pause. Stay a while.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Restless Coffee & Eatery - Take a pause. Stay a while." }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
