import { NextResponse, type NextRequest } from "next/server";
import { jetonuKullan, oturumAc } from "@/lib/oturum.ts";
import { uyelikSemasi } from "@/lib/uyelik.ts";

export async function GET(req: NextRequest) {
  const j = req.nextUrl.searchParams.get("j") ?? "";
  const d = req.nextUrl.searchParams.get("donus") ?? "/hesabim";
  const donus = d.startsWith("/") && !d.startsWith("//") ? d : "/hesabim";
  await uyelikSemasi();
  const id = j ? await jetonuKullan(j) : null;
  if (!id) return NextResponse.redirect(new URL("/giris?hata=baglanti", req.url));
  await oturumAc(id);
  return NextResponse.redirect(new URL(donus, req.url));
}
