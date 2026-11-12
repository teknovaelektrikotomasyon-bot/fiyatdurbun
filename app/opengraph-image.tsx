import { ImageResponse } from "next/og";
import { OgSablon } from "@/components/OgSablon";
import { ogFontlari } from "@/lib/ogFontlar.ts";

export const alt = "Fiyat Dürbün — fiyat karşılaştırma ve fiyat geçmişi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Gorsel() {
  return new ImageResponse(
    <OgSablon ust="Fiyat karşılaştırma" baslik="Fiyatı yakından görün." alt="Mağaza fiyatları, 30 günlük fiyat geçmişi ve sahte indirim kontrolü" />,
    { ...size, fonts: await ogFontlari() },
  );
}
