"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type MenuPage = { id: string; src: string; name: string; custom?: boolean };

const links = {
  whatsapp: "https://wa.me/6287866885757",
  maps: "https://maps.app.goo.gl/S7FGFkZqBssgReYw5?g_st=ic",
  grab: "https://r.grab.com/g/6-20240317_203531_C7E4957027A948B29E7699639ABB8166_MEXMPS-6-C6DYGTMXN6JYKA",
  gofood: "https://gofood.link/a/JqyUbMo",
  instagram: "https://instagram.com/restless.coffee",
};

const defaultPages: MenuPage[] = Array.from({ length: 18 }, (_, index) => ({
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

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [pages, setPages] = useState<MenuPage[]>(defaultPages);
  const [current, setCurrent] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("restless-menu-pages-v1");
      if (saved) setPages(JSON.parse(saved));
    } catch { /* Keep the official menu when local data is unavailable. */ }
  }, []);

  const safeCurrent = Math.min(current, Math.max(0, pages.length - 1));
  const progress = pages.length ? ((safeCurrent + 1) / pages.length) * 100 : 0;
  const page = pages[safeCurrent];

  const persist = (next: MenuPage[]) => {
    setPages(next);
    setCurrent((value) => Math.min(value, Math.max(0, next.length - 1)));
    try {
      localStorage.setItem("restless-menu-pages-v1", JSON.stringify(next));
    } catch {
      setNotice("Penyimpanan browser penuh. Hapus beberapa halaman tambahan lalu coba lagi.");
    }
  };

  const move = (id: string, direction: -1 | 1) => {
    const from = pages.findIndex((item) => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= pages.length) return;
    const next = [...pages];
    [next[from], next[to]] = [next[to], next[from]];
    persist(next);
  };

  const dropOn = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = [...pages];
    const from = next.findIndex((item) => item.id === draggedId);
    const to = next.findIndex((item) => item.id === targetId);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persist(next);
    setDraggedId(null);
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setNotice("Menyiapkan halaman baru...");
    const additions = await Promise.all(files.map(async (file, index) => ({
      id: `custom-${Date.now()}-${index}`,
      src: await compressImage(file),
      name: file.name.replace(/\.[^.]+$/, ""),
      custom: true,
    })));
    persist([...pages, ...additions]);
    setNotice(`${additions.length} halaman ditambahkan.`);
    event.target.value = "";
  };

  const sectionLinks = useMemo(() => [
    { label: "Reservasi", caption: "Book your table", href: links.whatsapp, icon: "arrow" as const },
    { label: "Lokasi", caption: "Jl. Gayam No. 3", href: links.maps, icon: "pin" as const },
    { label: "Pesan Online", caption: "GrabFood & GoFood", href: links.gofood, icon: "bag" as const },
  ], []);

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Restless Coffee beranda">
          <img src="/brand/restless-logo.png" alt="Restless Coffee" />
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#menu">Menu</a><a href="#visit">Kunjungi</a><a href={links.instagram} target="_blank" rel="noreferrer">Instagram</a>
        </nav>
        <a className="nav-cta" href={links.whatsapp} target="_blank" rel="noreferrer">Reservasi <Icon name="arrow" /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grain" />
        <div className="hero-copy shell">
          <p className="eyebrow"><span /> RESTLESS COFFEE &amp; EATERY</p>
          <h1>Take a pause.<br /><em>Stay a while.</em></h1>
          <p className="hero-text">Kopi, comfort food, dan sudut tenang di tengah Yogyakarta. Datang untuk secangkir, tinggal untuk suasananya.</p>
          <div className="hero-actions">
            <a className="button light" href="#menu">Lihat menu <Icon name="arrow" /></a>
            <a className="text-link" href={links.maps} target="_blank" rel="noreferrer">Temukan kami <Icon name="pin" /></a>
          </div>
        </div>
        <div className="hero-stamp"><span>COME AND</span><strong>RELAX</strong><span>YOGYAKARTA</span></div>
        <div className="scroll-cue">SCROLL TO EXPLORE <span /></div>
      </section>

      <section className="intro shell">
        <p className="section-no">01 / ABOUT</p>
        <div>
          <h2>Ruang untuk bernapas,<br />rasa untuk <em>diingat.</em></h2>
          <p>Di Restless, kami percaya jeda yang baik dimulai dari meja yang nyaman. Nikmati sarapan, makanan hangat, dan racikan kopi yang dibuat untuk menemani hari—pelan-pelan.</p>
        </div>
        <div className="hours"><span>OPEN DAILY</span><strong>09.00 — 23.00</strong><small>Jl. Gayam No. 3, Yogyakarta</small></div>
      </section>

      <section className="menu-section" id="menu">
        <div className="menu-heading shell">
          <div><p className="section-no">02 / OUR MENU</p><h2>What are you<br /><em>in the mood for?</em></h2></div>
          <p>Dari sarapan santai sampai kopi sore, temukan pilihan yang pas untuk jedamu.</p>
        </div>

        <div className="menu-book shell">
          <div className="book-controls">
            <span>MENU RESTLESS 2026</span>
            <div>
              <button className="icon-button" onClick={() => setManagerOpen(true)}><Icon name="edit" /> Atur halaman</button>
              <a className="icon-button" href="/menu/menu-restless-2026.pdf" download><Icon name="download" /> PDF</a>
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
        <div className="visit-title shell"><p className="section-no">03 / FIND YOUR PAUSE</p><h2>See you at<br /><em>Restless.</em></h2></div>
        <div className="link-grid shell">
          {sectionLinks.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer"><Icon name={item.icon} /><span><strong>{item.label}</strong><small>{item.caption}</small></span><b>↗</b></a>)}
        </div>
        <div className="delivery shell"><span>Pesan dari rumah</span><a href={links.grab} target="_blank" rel="noreferrer">GrabFood ↗</a><a href={links.gofood} target="_blank" rel="noreferrer">GoFood ↗</a></div>
      </section>

      <footer className="footer shell">
        <img src="/brand/restless-logo.png" alt="Restless Coffee" />
        <p>Come and relax ✦</p>
        <a href={links.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" /> @restless.coffee</a>
        <small>© 2026 Restless Coffee &amp; Eatery</small>
      </footer>

      {managerOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setManagerOpen(false)}>
        <section className="manager" role="dialog" aria-modal="true" aria-labelledby="manager-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="manager-head"><div><p className="section-no">MENU MANAGER</p><h2 id="manager-title">Atur halaman</h2><p>Geser kartu atau gunakan panah untuk mengubah urutan.</p></div><button className="close" onClick={() => setManagerOpen(false)} aria-label="Tutup"><Icon name="close" /></button></div>
          <div className="manager-actions">
            <button className="button dark" onClick={() => fileRef.current?.click()}>+ Tambah halaman</button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={upload} />
            <button className="reset" onClick={() => { persist(defaultPages); setNotice("Menu resmi dipulihkan."); }}>Pulihkan menu asli</button>
          </div>
          {notice && <p className="notice" role="status">{notice}</p>}
          <div className="manager-list">
            {pages.map((item, index) => <article key={item.id} draggable onDragStart={() => setDraggedId(item.id)} onDragOver={(event: DragEvent) => event.preventDefault()} onDrop={() => dropOn(item.id)}>
              <span className="drag">⠿</span><img src={item.src} alt="" /><div><strong>{item.name}</strong><small>Posisi {index + 1}</small></div>
              <button onClick={() => move(item.id, -1)} disabled={index === 0} aria-label={`Naikkan ${item.name}`}>↑</button>
              <button onClick={() => move(item.id, 1)} disabled={index === pages.length - 1} aria-label={`Turunkan ${item.name}`}>↓</button>
              <button className="delete" onClick={() => persist(pages.filter((pageItem) => pageItem.id !== item.id))} aria-label={`Hapus ${item.name}`}>Hapus</button>
            </article>)}
          </div>
          <button className="done" onClick={() => setManagerOpen(false)}>Selesai</button>
        </section>
      </div>}
    </main>
  );
}
