import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Restless Coffee & Eatery | Yogyakarta",
  description: "Kopi, comfort food, dan ruang untuk beristirahat di Jl. Gayam No. 3, Yogyakarta.",
  icons: {
    icon: [{ url: "/brand/restless-favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/brand/restless-favicon.png",
    apple: "/brand/restless-favicon.png",
  },
  openGraph: {
    title: "Restless Coffee & Eatery",
    description: "Take a pause. Stay a while.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Restless Coffee & Eatery - Take a pause. Stay a while." }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><head><script async src="https://www.googletagmanager.com/gtag/js?id=G-2Y626X4BHC" /><script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-2Y626X4BHC');` }} /></head><body>{children}</body></html>;
}
