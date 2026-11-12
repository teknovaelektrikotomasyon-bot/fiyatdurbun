// Mağazaya yönlendirme: tıklamayı sayar, sonra mağaza sayfasına gönderir. (Satış ortaklığı kodu ileride burada eklenir.)
import { NextResponse, type NextRequest } from "next/server";
import { q, q1 } from "@/lib/db.ts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const t = Number.isInteger(id) ? await q1<{ url: string }>("select url from teklif where id=$1", [id]) : undefined;
  if (!t) return NextResponse.redirect(new URL("/", req.url));
  const kaynak = (req.nextUrl.searchParams.get("k") ?? "").slice(0, 40) || null;
  await q("insert into tiklama (teklif_id, kaynak) values ($1,$2)", [id, kaynak]).catch(() => {});
  const r = NextResponse.redirect(t.url, 302);
  r.headers.set("x-robots-tag", "noindex, nofollow");
  return r;
}
