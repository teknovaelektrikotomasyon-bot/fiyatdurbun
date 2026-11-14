import { site, urlset, urunParcasi } from "@/lib/harita";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1) return new Response("Bulunamadı", { status: 404 });
  const s = site();
  const urunler = await urunParcasi(n - 1);
  return urlset(urunler.map((u) => ({ url: `${s}/urun/${u.slug}`, son: u.son, siklik: "daily", oncelik: 0.8 })));
}
