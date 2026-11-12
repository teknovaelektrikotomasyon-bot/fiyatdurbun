import type { Metadata } from "next";
import { UrunKarti } from "@/components/UrunKarti";
import { ara } from "@/lib/sorgular.ts";

export const dynamic = "force-dynamic";
type P = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: P): Promise<Metadata> {
  const m = (await searchParams).q ?? "";
  return { title: m ? `“${m}” fiyatları` : "Ara", robots: { index: false } };
}

export default async function Ara({ searchParams }: P) {
  const m = ((await searchParams).q ?? "").trim().slice(0, 80);
  const sonuc = m ? await ara(m) : [];
  return (
    <>
      <div className="kat-ust"><div><h1>{m ? `“${m}”` : "Ara"}</h1><p>{m ? `${sonuc.length} ürün bulundu` : "Bir ürün, marka ya da model yazın."}</p></div></div>
      {sonuc.length ? <div className="izgara">{sonuc.map((u) => <UrunKarti key={u.id} u={u} />)}</div>
        : m && <div className="kutu bos">Bu aramayla eşleşen ürün yok. Daha kısa yazmayı deneyin, ör. yalnız model adı.</div>}
    </>
  );
}
