export const DEFAULT_MENU_PAGES = Array.from({ length: 18 }, (_, index) => ({
  id: `official-${index + 1}`,
  name: index === 0 ? "Sampul" : index === 17 ? "Penutup" : `Halaman ${index + 1}`,
  src: `/menu/page-${String(index + 1).padStart(2, "0")}.jpg`,
  position: index,
}));
