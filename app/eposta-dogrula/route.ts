import { NextResponse, type NextRequest } from "next/server";
import { oturumAc } from "@/lib/oturum.ts";
import { epostaDogrula, uyelikSemasi } from "@/lib/uyelik.ts";

// E-postadaki doğrulama bağlantısı: adresi onaylar, oturum açar, takip listesine götürür.
export async function GET(req: NextRequest) {
  await uyelikSemasi();
  const j = req.nextUrl.searchParams.get("j") ?? "";
  const id = j ? await epostaDogrula(j) : null;
  if (!id) return NextResponse.redirect(new URL("/hesabim?dogrulama=gecersiz", req.url));
  await oturumAc(id, true);
  return NextResponse.redirect(new URL("/hesabim?dogrulama=tamam", req.url));
}
