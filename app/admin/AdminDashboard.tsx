"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import "./admin.css";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "../../lib/content-defaults";

type Page = { id: string; name: string; src: string; position: number };
type Analytics = {
  days: number;
  totals: { page_views: number; visitors: number; sessions: number; interactions: number };
  daily: Array<{ date: string; views: number; visitors: number }>;
  events: Array<{ name: string; count: number }>;
  devices: Array<{ name: string; count: number }>;
  referrers: Array<{ name: string; count: number }>;
  definition: string;
};

const EVENT_LABELS: Record<string, string> = {
  page_viewed: "Halaman dilihat", menu_viewed: "Menu dibuka", reservation_opened: "Reservasi", location_opened: "Lokasi", order_opened: "Pesan online", instagram_opened: "Instagram", menu_pdf_downloaded: "PDF diunduh",
};

const CONTENT_GROUPS: Array<{ title: string; description: string; fields: Array<{ key: keyof SiteContent; label: string; textarea?: boolean; type?: "url" }> }> = [
  { title: "Hero", description: "Bagian pertama yang dilihat pengunjung.", fields: [
    { key: "heroEyebrow", label: "Label kecil" }, { key: "heroTitleLine1", label: "Judul baris pertama" }, { key: "heroTitleLine2", label: "Judul baris kedua" }, { key: "heroDescription", label: "Deskripsi", textarea: true }, { key: "heroPrimaryButton", label: "Tombol menu" }, { key: "heroSecondaryButton", label: "Tombol lokasi" },
  ]},
  { title: "Tentang Restless", description: "Cerita singkat, jam buka, dan alamat.", fields: [
    { key: "aboutKicker", label: "Label bagian" }, { key: "aboutTitleLine1", label: "Judul baris pertama" }, { key: "aboutTitleLine2", label: "Judul baris kedua" }, { key: "aboutDescription", label: "Deskripsi", textarea: true }, { key: "openingLabel", label: "Label jam buka" }, { key: "openingHours", label: "Jam operasional" }, { key: "address", label: "Alamat" },
  ]},
  { title: "Buku Menu", description: "Judul dan pengantar di atas buku menu.", fields: [
    { key: "menuKicker", label: "Label bagian" }, { key: "menuTitleLine1", label: "Judul baris pertama" }, { key: "menuTitleLine2", label: "Judul baris kedua" }, { key: "menuDescription", label: "Deskripsi", textarea: true },
  ]},
  { title: "Kunjungi & Pesan", description: "Teks kartu aksi dan bagian kontak.", fields: [
    { key: "visitKicker", label: "Label bagian" }, { key: "visitTitleLine1", label: "Judul baris pertama" }, { key: "visitTitleLine2", label: "Judul baris kedua" }, { key: "reservationLabel", label: "Judul reservasi" }, { key: "reservationCaption", label: "Keterangan reservasi" }, { key: "locationLabel", label: "Judul lokasi" }, { key: "locationCaption", label: "Keterangan lokasi" }, { key: "orderLabel", label: "Judul pesan online" }, { key: "orderCaption", label: "Keterangan pesan online" }, { key: "deliveryLabel", label: "Label pesan dari rumah" }, { key: "footerTagline", label: "Tagline footer" },
  ]},
  { title: "Tautan", description: "Gunakan alamat lengkap yang dimulai dengan https://.", fields: [
    { key: "whatsappUrl", label: "WhatsApp / reservasi", type: "url" }, { key: "mapsUrl", label: "Google Maps", type: "url" }, { key: "grabUrl", label: "GrabFood", type: "url" }, { key: "gofoodUrl", label: "GoFood", type: "url" }, { key: "instagramUrl", label: "Instagram", type: "url" },
  ]},
];

export default function AdminDashboard({ userName }: { userName: string }) {
  const [tab, setTab] = useState<"traffic" | "menu" | "content">("traffic");
  const [pages, setPages] = useState<Page[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    const response = await fetch("/api/menu");
    const data = await response.json();
    setPages(data.pages);
    setPdfUrl(data.pdfUrl);
  }, []);
  const loadAnalytics = useCallback(async () => {
    const response = await fetch(`/api/analytics?days=${days}`);
    if (response.ok) setAnalytics(await response.json());
  }, [days]);
  const loadContent = useCallback(async () => {
    const response = await fetch("/api/content?mode=admin");
    if (response.ok) { const data = await response.json(); setContent(data.draft); setPublishedAt(data.publishedAt); }
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  useEffect(() => { loadContent(); }, [loadContent]);

  const run = async (work: () => Promise<void>, success: string) => {
    setBusy(true); setMessage("");
    try { await work(); setMessage(success); } catch (error) { setMessage(error instanceof Error ? error.message : "Terjadi kesalahan"); }
    finally { setBusy(false); }
  };

  const bootstrap = () => run(async () => {
    const response = await fetch("/api/menu/bootstrap", { method: "POST" });
    if (!response.ok) throw new Error("Gagal menyiapkan menu");
    await loadMenu();
  }, "Menu resmi siap dikelola.");

  const uploadPage = (event: ChangeEvent<HTMLInputElement>) => run(async () => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const form = new FormData(); form.append("file", file); form.append("kind", "page");
      const response = await fetch("/api/menu/upload", { method: "POST", body: form });
      if (!response.ok) throw new Error((await response.json()).error || "Upload gagal");
    }
    event.target.value = ""; await loadMenu();
  }, "Halaman baru berhasil diunggah.");

  const uploadPdf = (event: ChangeEvent<HTMLInputElement>) => run(async () => {
    const file = event.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append("file", file); form.append("kind", "pdf");
    const response = await fetch("/api/menu/upload", { method: "POST", body: form });
    if (!response.ok) throw new Error((await response.json()).error || "Upload PDF gagal");
    event.target.value = ""; await loadMenu();
  }, "PDF menu berhasil diganti.");

  const saveOrder = () => run(async () => {
    const response = await fetch("/api/menu", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ pages: pages.map((page, position) => ({ ...page, position })) }) });
    if (!response.ok) throw new Error("Gagal menyimpan urutan");
    await loadMenu();
  }, "Urutan dan nama halaman sudah dipublikasikan.");

  const remove = (id: string) => run(async () => {
    const response = await fetch(`/api/menu?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Gagal menghapus halaman");
    await loadMenu();
  }, "Halaman dihapus dari menu publik.");

  const saveContent = (action: "save_draft" | "publish") => run(async () => {
    const response = await fetch("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, content }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Konten gagal disimpan");
    await loadContent();
  }, action === "publish" ? "Konten sudah dipublikasikan ke landing page." : "Draft berhasil disimpan.");

  const dropOn = (id: string) => {
    if (!dragged || dragged === id) return;
    const next = [...pages]; const from = next.findIndex((page) => page.id === dragged); const to = next.findIndex((page) => page.id === id);
    const [item] = next.splice(from, 1); next.splice(to, 0, item); setPages(next); setDragged(null);
  };

  const maxViews = useMemo(() => Math.max(1, ...(analytics?.daily.map((row) => Number(row.views)) || [1])), [analytics]);

  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <a className="admin-logo" href="/">Restless<span>coffee & eatery</span></a>
      <nav><button className={tab === "traffic" ? "active" : ""} onClick={() => setTab("traffic")}>⌁ <span>Traffic</span></button><button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>▤ <span>Menu</span></button><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>Aa <span>Konten</span></button></nav>
      <div className="admin-user"><span>{userName.slice(0, 1).toUpperCase()}</span><div><strong>{userName}</strong><small>Administrator</small></div></div>
    </aside>
    <section className="admin-main">
      <header><div><p>RESTLESS ADMIN</p><h1>{tab === "traffic" ? "Traffic dashboard" : tab === "menu" ? "Kelola buku menu" : "Edit konten situs"}</h1></div><div className="admin-header-actions"><a href="/" target="_blank">Lihat situs ↗</a><a href="/signout-with-chatgpt?return_to=/">Keluar</a></div></header>

      {message && <div className="admin-message">{message}</div>}

      {tab === "traffic" && <>
        <div className="range"><span>Periode laporan</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 hari</option><option value={30}>30 hari</option><option value={90}>90 hari</option></select></div>
        <div className="metric-grid">
          <article><span>Pengunjung unik</span><strong>{Number(analytics?.totals.visitors || 0).toLocaleString("id-ID")}</strong><small>Browser unik</small></article>
          <article><span>Page views</span><strong>{Number(analytics?.totals.page_views || 0).toLocaleString("id-ID")}</strong><small>Total halaman dilihat</small></article>
          <article><span>Sesi</span><strong>{Number(analytics?.totals.sessions || 0).toLocaleString("id-ID")}</strong><small>Kunjungan terpisah</small></article>
          <article className="accent"><span>Interaksi</span><strong>{Number(analytics?.totals.interactions || 0).toLocaleString("id-ID")}</strong><small>Aksi bernilai</small></article>
        </div>
        <div className="dashboard-grid">
          <article className="chart-card"><div className="card-head"><div><span>TRAFFIC TREND</span><h2>Pengunjung harian</h2></div><small>{days} hari terakhir</small></div><div className="bars">{analytics?.daily.length ? analytics.daily.map((row) => <div key={row.date} className="bar-column" title={`${row.date}: ${row.views} views`}><b style={{ height: `${Math.max(5, Number(row.views) / maxViews * 100)}%` }} /><span>{new Date(`${row.date}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span></div>) : <div className="empty-chart">Data mulai terkumpul setelah situs dikunjungi.</div>}</div></article>
          <article className="list-card"><div className="card-head"><div><span>TOP SOURCES</span><h2>Sumber kunjungan</h2></div></div>{analytics?.referrers.map((row) => <div className="list-row" key={row.name}><span>{row.name}</span><strong>{row.count}</strong></div>)}</article>
          <article className="list-card"><div className="card-head"><div><span>ENGAGEMENT</span><h2>Aksi pengunjung</h2></div></div>{analytics?.events.filter((row) => row.name !== "page_viewed").map((row) => <div className="list-row" key={row.name}><span>{EVENT_LABELS[row.name] || row.name}</span><strong>{row.count}</strong></div>)}</article>
          <article className="list-card"><div className="card-head"><div><span>AUDIENCE</span><h2>Perangkat</h2></div></div>{analytics?.devices.map((row) => <div className="list-row" key={row.name}><span>{row.name}</span><strong>{row.count}</strong></div>)}</article>
        </div>
        <p className="definition">{analytics?.definition}</p>
      </>}

      {tab === "menu" && <>
        <div className="menu-toolbar"><div><button onClick={bootstrap} disabled={busy}>Siapkan menu resmi</button><label>+ Tambah halaman<input type="file" accept="image/*" multiple onChange={uploadPage} hidden /></label><label className="outline">Ganti PDF<input type="file" accept="application/pdf" onChange={uploadPdf} hidden /></label></div><button className="publish" onClick={saveOrder} disabled={busy}>Publikasikan perubahan</button></div>
        <div className="pdf-current"><span>PDF menu aktif</span><a href={pdfUrl} target="_blank">Buka PDF ↗</a></div>
        <div className="page-manager">
          {pages.map((page, index) => <article key={page.id} draggable onDragStart={() => setDragged(page.id)} onDragOver={(event: DragEvent) => event.preventDefault()} onDrop={() => dropOn(page.id)}><span className="handle">⠿</span><span className="position">{String(index + 1).padStart(2, "0")}</span><img src={page.src} alt="" /><input value={page.name} aria-label={`Nama ${page.name}`} onChange={(event) => setPages((current) => current.map((item) => item.id === page.id ? { ...item, name: event.target.value } : item))} /><button onClick={() => remove(page.id)} disabled={busy}>Hapus</button></article>)}
        </div>
      </>}

      {tab === "content" && <>
        <div className="content-toolbar"><div><span>Status konten</span><strong>{publishedAt ? `Terakhir dipublikasikan ${new Date(publishedAt).toLocaleString("id-ID")}` : "Menggunakan konten bawaan"}</strong></div><div><button className="draft-button" onClick={() => saveContent("save_draft")} disabled={busy}>Simpan draft</button><button className="publish-button" onClick={() => saveContent("publish")} disabled={busy}>Publikasikan</button></div></div>
        <div className="content-groups">
          {CONTENT_GROUPS.map((group) => <section className="content-group" key={group.title}><header><div><h2>{group.title}</h2><p>{group.description}</p></div></header><div className="content-fields">{group.fields.map((field) => <label key={field.key}><span>{field.label}</span>{field.textarea ? <textarea rows={4} value={content[field.key]} onChange={(event) => setContent((current) => ({ ...current, [field.key]: event.target.value }))} /> : <input type={field.type || "text"} value={content[field.key]} onChange={(event) => setContent((current) => ({ ...current, [field.key]: event.target.value }))} />}</label>)}</div></section>)}
        </div>
      </>}
    </section>
  </main>;
}
