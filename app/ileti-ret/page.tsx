import type { Metadata } from "next";
import { q } from "@/lib/db.ts";
import { retImza, tanitimTablolari } from "@/lib/tanitim.ts";

export const metadata: Metadata = { title: "E-posta listesinden çıkış", robots: { index: false } };
export const dynamic = "force-dynamic";

// Tanıtım e-postalarındaki "bir daha e-posta almak istemiyorum" bağlantısı (6563 sayılı Kanun: ret hakkı).
export default async function IletiRet({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e, t } = await searchParams;
  const gecerli = Boolean(e && t && retImza(e) === t);
  if (gecerli) { await tanitimTablolari(); await q("insert into ileti_ret (eposta) values ($1) on conflict do nothing", [e!.toLowerCase()]); }
  return (
    <div className="kutu dar uyelik">
      <h1>{gecerli ? "Listeden çıkarıldınız" : "Bağlantı geçersiz"}</h1>
      <p>{gecerli ? `${e} adresine Fiyat Dürbün'den bir daha tanıtım e-postası gönderilmeyecek.` : "Bağlantı eksik ya da hatalı. magaza@fiyatdurbun.com adresine yazarak da listeden çıkabilirsiniz."}</p>
    </div>
  );
}
