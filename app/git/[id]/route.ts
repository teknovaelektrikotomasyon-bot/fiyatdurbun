// Mağazaya yönlendirme: tıklamayı sayar, sonra mağaza sayfasına gönderir.
// Mağazanın satış ortaklığı şablonu varsa (magaza.ortaklik, ör. "https://ad.admitad.com/g/XXXX/?ulp={url}") adres o şablonla sarılır.
import { NextResponse, type NextRequest } from "next/server";
import { q, q1 } from "@/lib/db.ts";

let sutunVar: boolean | null = null;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (sutunVar === null) {
    sutunVar = Boolean(await q1("select 1 from information_schema.columns where table_name='magaza' and column_name='ortaklik'").catch(() => null));
    if (!sutunVar) { await q("alter table magaza add column if not exists ortaklik text").catch(() => {}); sutunVar = true; }
  }
  const t = Number.isInteger(id)
    ? await q1<{ url: string; ortaklik: string | null }>("select t.url, m.ortaklik from teklif t join magaza m on m.id=t.magaza_id where t.id=$1", [id])
    : undefined;
  if (!t) return NextResponse.redirect(new URL("/", req.url));
  const kaynak = (req.nextUrl.searchParams.get("k") ?? "").slice(0, 40) || null;
  await q("insert into tiklama (teklif_id, kaynak) values ($1,$2)", [id, kaynak]).catch(() => {});
  const hedef = t.ortaklik && t.ortaklik.includes("{url}") ? t.ortaklik.replace("{url}", encodeURIComponent(t.url)) : t.url;
  const r = NextResponse.redirect(hedef, 302);
  r.headers.set("x-robots-tag", "noindex, nofollow");
  return r;
}
