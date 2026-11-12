import { ImageResponse } from "next/og";
import { OgSablon } from "@/components/OgSablon";
import { ogFontlari } from "@/lib/ogFontlar.ts";
import { agacSayilari, kategoriBul } from "@/lib/katalog/agac.ts";
import { kategoriUrunSayilari } from "@/lib/sorgular.ts";

export const alt = "Kategori fiyatları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Gorsel({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const d = kategoriBul(slug);
  const n = agacSayilari(await kategoriUrunSayilari()).get(slug) ?? 0;
  return new ImageResponse(
    <OgSablon ust={n ? `${n} ürünün mağaza fiyatları` : "Kategori"} baslik={`${d?.ad ?? "Kategori"} fiyatları`} alt="Fiyat geçmişi ve sahte indirim kontrolü: fiyatdurbun.com" />,
    { ...size, fonts: await ogFontlari() },
  );
}
