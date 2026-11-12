import { NextResponse, type NextRequest } from "next/server";

// Üretim yayını *.vercel.app adresinden de açılır; bu adres sitenin kopyası gibi görünmesin diye
// asıl alan adına kalıcı (308) yönlendirilir. Önizleme yayınları (Preview) etkilenmez.
export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const site = process.env.SITE_URL;
  if (site && process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app")) {
    const hedef = new URL(req.nextUrl.pathname + req.nextUrl.search, site);
    return NextResponse.redirect(hedef, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Statik dosyalar ve görseller için çalışmasın.
  matcher: ["/((?!_next/|favicon|icon|apple-icon|.*\\.(?:png|svg|jpg|txt|xml|webmanifest)$).*)"],
};
