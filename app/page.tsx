"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "../lib/content-defaults";

type MenuPage = { id: string; src: string; name: string; position?: number };

const fallbackPages: MenuPage[] = Array.from({ length: 18 }, (_, index) => ({
  id: `page-${index + 1}`,
  src: `/menu/page-${String(index + 1).padStart(2, "0")}.jpg`,
  name: index === 0 ? "Sampul" : index === 17 ? "Penutup" : `Halaman ${index + 1}`,
}));

function Icon({ name }: { name: "arrow" | "pin" | "bag" | "instagram" | "edit" | "close" | "download" }) {
  const paths = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    pin: <><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.3" /></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
    edit: <><path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z" /><path d="m13 7 4 4" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const [pages, setPages] = useState<MenuPage[]>(fallbackPages);
  const [pdfUrl, setPdfUrl] = useState("/menu/menu-restless-2026.pdf");
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/menu").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.pages?.length) setPages(data.pages);
      if (data?.pdfUrl) setPdfUrl(data.pdfUrl);
    }).catch(() => undefined);
    fetch("/api/content").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.content) setContent(data.content);
    }).catch(() => undefined);
  }, []);

  const track = (eventName: string) => {
    try {
      const anonymousId = localStorage.getItem("restless_anonymous_id") || crypto.randomUUID();
      localStorage.setItem("restless_anonymous_id", anonymousId);
      const lastSeen = Number(sessionStorage.getItem("restless_session_started") || 0);
      const sessionId = Date.now() - lastSeen > 30 * 60 * 1000 ? crypto.randomUUID() : (sessionStorage.getItem("restless_session_id") || crypto.randomUUID());
      sessionStorage.setItem("restless_session_id", sessionId);
      sessionStorage.setItem("restless_session_started", String(Date.now()));
      const deviceType = matchMedia("(max-width: 760px)").matches ? "mobile" : matchMedia("(max-width: 1100px)").matches ? "tablet" : "desktop";
      fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true, body: JSON.stringify({ eventName, anonymousId, sessionId, path: location.pathname, referrer: document.referrer, deviceType }) }).catch(() => undefined);
    } catch { /* Analytics must never block the visitor. */ }
  };

  useEffect(() => { track("page_viewed"); }, []);

  const safeCurrent = Math.min(current, Math.max(0, pages.length - 1));
  const progress = pages.length ? ((safeCurrent + 1) / pages.length) * 100 : 0;
  const page = pages[safeCurrent];

  const sectionLinks = useMemo(() => [
    { label: content.reservationLabel, caption: content.reservationCaption, href: content.whatsappUrl, icon: "arrow" as const, event: "reservation_opened" },
    { label: content.locationLabel, caption: content.locationCaption, href: content.mapsUrl, icon: "pin" as const, event: "location_opened" },
    { label: content.orderLabel, caption: content.orderCaption, href: content.gofoodUrl, icon: "bag" as const, event: "order_opened" },
  ], [content]);

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Restless Coffee beranda">
          <img src="/brand/restless-logo.png" alt="Restless Coffee" />
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#menu">Menu</a><a href="#visit">Kunjungi</a><a href={content.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <a className="nav-cta" href={content.whatsappUrl} target="_blank" rel="noreferrer">{content.reservationLabel} <Icon name="arrow" /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grain" />
        <div className="hero-copy shell">
          <p className="eyebrow"><span /> {content.heroEyebrow}</p>
          <h1>{content.heroTitleLine1}<br /><em>{content.heroTitleLine2}</em></h1>
          <p className="hero-text">{content.heroDescription}</p>
          <div className="hero-actions">
            <a className="button light" href="#menu">{content.heroPrimaryButton} <Icon name="arrow" /></a>
            <a className="text-link" href={content.mapsUrl} target="_blank" rel="noreferrer">{content.heroSecondaryButton} <Icon name="pin" /></a>
          </div>
        </div>
        <div className="hero-stamp"><span>COME AND</span><strong>RELAX</strong><span>YOGYAKARTA</span></div>
        <div className="scroll-cue">SCROLL TO EXPLORE <span /></div>
      </section>

      <section className="intro shell">
        <p className="section-no">{content.aboutKicker}</p>
        <div>
          <h2>{content.aboutTitleLine1}<br /><em>{content.aboutTitleLine2}</em></h2>
          <p>{content.aboutDescription}</p>
        </div>
        <div className="hours"><span>{content.openingLabel}</span><strong>{content.openingHours}</strong><small>{content.address}</small></div>
      </section>

      <section className="menu-section" id="menu">
        <div className="menu-heading shell">
          <div><p className="section-no">{content.menuKicker}</p><h2>{content.menuTitleLine1}<br /><em>{content.menuTitleLine2}</em></h2></div>
          <p>{content.menuDescription}</p>
        </div>

        <div className="menu-book shell">
          <div className="book-controls">
            <span>MENU RESTLESS 2026</span>
            <div>
              <a className="icon-button" href="#menu" onClick={() => track("menu_viewed")}><Icon name="edit" /> Buku menu</a>
              <a className="icon-button" href={pdfUrl} target="_blank" onClick={() => track("menu_pdf_downloaded")}><Icon name="download" /> PDF</a>
            </div>
          </div>

          <div className="book-stage">
            <button aria-label="Halaman sebelumnya" className="book-arrow previous" onClick={() => setCurrent(Math.max(0, safeCurrent - 1))} disabled={safeCurrent === 0}>←</button>
            <div className="page-frame">
              {page ? <img key={page.id} src={page.src} alt={`${page.name}, halaman ${safeCurrent + 1} dari menu Restless`} /> : <div className="empty-menu">Belum ada halaman menu.</div>}
            </div>
            <button aria-label="Halaman berikutnya" className="book-arrow next" onClick={() => setCurrent(Math.min(pages.length - 1, safeCurrent + 1))} disabled={safeCurrent >= pages.length - 1}>→</button>
          </div>

          <div className="book-progress"><span>{String(safeCurrent + 1).padStart(2, "0")}</span><div><i style={{ width: `${progress}%` }} /></div><span>{String(pages.length).padStart(2, "0")}</span></div>
          <div className="thumbs" aria-label="Pilih halaman menu">
            {pages.map((item, index) => <button key={item.id} className={index === safeCurrent ? "active" : ""} onClick={() => setCurrent(index)} aria-label={`Buka ${item.name}`}><img src={item.src} alt="" /><span>{index + 1}</span></button>)}
          </div>
        </div>
      </section>

      <section className="visit" id="visit">
        <div className="visit-title shell"><p className="section-no">{content.visitKicker}</p><h2>{content.visitTitleLine1}<br /><em>{content.visitTitleLine2}</em></h2></div>
        <div className="link-grid shell">
          {sectionLinks.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" onClick={() => track(item.event)}><Icon name={item.icon} /><span><strong>{item.label}</strong><small>{item.caption}</small></span><b>↗</b></a>)}
        </div>
        <div className="delivery shell"><span>{content.deliveryLabel}</span><a href={content.grabUrl} target="_blank" rel="noreferrer">GrabFood ↗</a><a href={content.gofoodUrl} target="_blank" rel="noreferrer">GoFood ↗</a></div>
      </section>

      <footer className="footer shell">
        <img src="/brand/restless-logo.png" alt="Restless Coffee" />
        <p>{content.footerTagline}</p>
        <a href={content.instagramUrl} target="_blank" rel="noreferrer" onClick={() => track("instagram_opened")}><Icon name="instagram" /> @restless.coffee</a>
        <small>© 2026 Restless Coffee &amp; Eatery</small>
        <a className="admin-entry" href="/admin" aria-label="Admin">Admin</a>
      </footer>
    </main>
  );
}
