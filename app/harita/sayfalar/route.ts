import { q } from "@/lib/db";
import { site, urlset, type Adres } from "@/lib/harita";
import { agacSayilari, tumKategoriler } from "@/lib/katalog/agac.ts";
import { kategoriUrunSayilari, markaListesi } from "@/lib/sorgular.ts";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = site();
  const simdi = new Date();
  // Ürünü olan kategoriler (alt kategoriler dahil sayılır); boş kategoriler noindex olduğu için haritaya girmez.
  const sayilar = agacSayilari(await kategoriUrunSayilari());
  const kategoriler = tumKategoriler().filter((k) => (sayilar.get(k.slug) ?? 0) > 0);
  // Kategori içi marka sayfaları ("Samsung Akıllı Telefon fiyatları"): en az 2 ürünü olanlar.
  const markaSayfalari = await q<{ kategori: string; marka: string }>(
    `select k.slug as kategori, lower(mk.ad) as marka from urun u join kategori k on k.id = u.kategori_id join marka mk on mk.id = u.marka_id
     where exists (select 1 from teklif t where t.urun_id = u.id and t.stokta)
     group by k.slug, lower(mk.ad) having count(*) >= 2`);
  const markalar = await markaListesi(3);
  const sabit: [string, string, number][] = [
    ["", "hourly", 1], ["/gercek-indirimler", "daily", 0.9], ["/kategoriler", "weekly", 0.6], ["/markalar", "weekly", 0.6],
    ["/magazalar", "weekly", 0.5], ["/hakkimizda", "monthly", 0.4], ["/magazanizi-ekleyin", "monthly", 0.3],
    ["/kunye", "yearly", 0.2], ["/kullanim-kosullari", "yearly", 0.2], ["/gizlilik", "yearly", 0.2], ["/bot", "monthly", 0.2],
  ];
  const adresler: Adres[] = [
    ...sabit.map(([y, siklik, oncelik]) => ({ url: `${s}${y}`, son: y ? null : simdi, siklik, oncelik })),
    ...kategoriler.map((k) => ({ url: `${s}/kategori/${k.slug}`, son: simdi, siklik: "hourly", oncelik: 0.9 })),
    ...markalar.map((m) => ({ url: `${s}/marka/${m.slug}`, son: simdi, siklik: "daily", oncelik: 0.7 })),
    ...markaSayfalari.map((m) => ({ url: `${s}/kategori/${m.kategori}?marka=${encodeURIComponent(m.marka)}`, son: simdi, siklik: "daily", oncelik: 0.7 })),
  ];
  return urlset(adresler);
}
