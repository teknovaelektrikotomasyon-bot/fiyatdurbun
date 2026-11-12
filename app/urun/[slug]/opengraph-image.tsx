import { ImageResponse } from "next/og";
import { OgSablon } from "@/components/OgSablon";
import { ogFontlari } from "@/lib/ogFontlar.ts";
import { tl, urun as urunAl } from "@/lib/sorgular.ts";

export const alt = "Ürün fiyatı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Paylaşılan ürün bağlantısında bugünkü en ucuz fiyat görünür.
export default async function Gorsel({ params }: { params: Promise<{ slug: string }> }) {
  const u = await urunAl((await params).slug);
  const ad = u ? `${u.marka} ${u.model} ${u.varyant ?? ""}`.trim() : "Ürün bulunamadı";
  // Mağaza görseli bazen indirilemez; o durumda görselsiz şablon çizilir.
  let gorsel: string | null = null;
  if (u?.gorsel) {
    try {
      const r = await fetch(u.gorsel, { signal: AbortSignal.timeout(2500) });
      const tur = r.headers.get("content-type") ?? "";
      if (r.ok && /image\/(png|jpe?g)/.test(tur)) gorsel = `data:${tur};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    } catch { /* görselsiz devam */ }
  }
  return new ImageResponse(
    <OgSablon
      ust={u?.fiyat != null ? `${u.magaza_sayisi} mağazanın en ucuzu` : "Fiyat Dürbün"}
      baslik={ad}
      fiyat={u?.fiyat != null ? tl(u.fiyat) : undefined}
      alt="Fiyat geçmişi ve sahte indirim kontrolü: fiyatdurbun.com"
      gorsel={gorsel}
    />,
    { ...size, fonts: await ogFontlari() },
  );
}
