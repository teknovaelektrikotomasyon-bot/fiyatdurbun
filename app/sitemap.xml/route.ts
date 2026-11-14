import { dizin, site, URUN_PARCA, urunSayisi } from "@/lib/harita";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = site();
  const parca = Math.max(1, Math.ceil((await urunSayisi()) / URUN_PARCA));
  return dizin([`${s}/harita/sayfalar`, ...Array.from({ length: parca }, (_, i) => `${s}/harita/urunler/${i + 1}`)]);
}
