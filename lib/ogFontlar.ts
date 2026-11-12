// Paylaşım görselleri (Open Graph) için yazı tipi dosyaları. Satori woff okur; Türkçe harfler latin-ext dosyasında.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const oku = (ad: string) => readFile(join(process.cwd(), "assets", "fonts", ad));

export async function ogFontlari() {
  const [l5, e5, l7, e7] = await Promise.all([
    oku("geologica-latin-500-normal.woff"), oku("geologica-latin-ext-500-normal.woff"),
    oku("geologica-latin-700-normal.woff"), oku("geologica-latin-ext-700-normal.woff"),
  ]);
  return [
    { name: "Geologica", data: l5, weight: 500 as const, style: "normal" as const },
    { name: "GeologicaExt", data: e5, weight: 500 as const, style: "normal" as const },
    { name: "Geologica", data: l7, weight: 700 as const, style: "normal" as const },
    { name: "GeologicaExt", data: e7, weight: 700 as const, style: "normal" as const },
  ];
}
