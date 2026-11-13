"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { q, q1 } from "@/lib/db.ts";
import { epostaGecerli, girisJetonuOlustur, oturumKapat, uye } from "@/lib/oturum.ts";
import { epostaGonder, siteAdresi } from "@/lib/eposta.ts";

const guvenliDonus = (d: unknown) => (typeof d === "string" && d.startsWith("/") && !d.startsWith("//") ? d : "/hesabim");

export async function girisBaglantisiGonder(form: FormData) {
  const eposta = String(form.get("eposta") ?? "").trim().toLowerCase();
  const donus = guvenliDonus(form.get("donus"));
  if (!epostaGecerli(eposta)) redirect(`/giris?hata=eposta&donus=${encodeURIComponent(donus)}`);
  // Kötüye kullanım sınırı: aynı adrese 10 dakikada en çok 3 bağlantı
  const son = await q1<{ n: number }>("select count(*)::int as n from giris_jetonu where eposta=$1 and son > now() + interval '5 minutes'", [eposta]);
  if ((son?.n ?? 0) < 3) {
    const jeton = await girisJetonuOlustur(eposta);
    const link = `${siteAdresi()}/giris/dogrula?j=${jeton}&donus=${encodeURIComponent(donus)}`;
    await epostaGonder(eposta, "Fiyat Dürbün giriş bağlantınız",
      `<p>Merhaba,</p><p>Fiyat Dürbün'e girmek için aşağıdaki bağlantıya tıklayın. Bağlantı 15 dakika geçerli ve tek kullanımlık.</p>
       <p><a href="${link}">Giriş yap</a></p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`);
  }
  redirect(`/giris?gonderildi=1`);
}

export async function takipEt(form: FormData) {
  const ben = await uye();
  const slug = String(form.get("slug") ?? "");
  if (!ben) redirect(`/giris?donus=/urun/${slug}`);
  const urunId = Number(form.get("urun"));
  const hedefHam = String(form.get("hedef") ?? "").replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
  const hedef = hedefHam ? Number(hedefHam) : null;
  const simdi = await q1<{ f: number }>("select min(fiyat)::float8 as f from teklif where urun_id=$1 and stokta and not supheli", [urunId]);
  await q(`insert into takip (uye_id, urun_id, hedef, eklenme_fiyati, son_bildirilen) values ($1,$2,$3,$4,$4)
           on conflict (uye_id, urun_id) do update set hedef=excluded.hedef`, [ben.id, urunId, hedef && hedef > 0 ? hedef : null, simdi?.f ?? null]);
  revalidatePath(`/urun/${slug}`);
  redirect(`/urun/${slug}?takip=eklendi`);
}

export async function takiptenCik(form: FormData) {
  const ben = await uye();
  if (!ben) redirect("/giris");
  await q("delete from takip where uye_id=$1 and urun_id=$2", [ben.id, Number(form.get("urun"))]);
  const slug = form.get("slug");
  redirect(slug ? `/urun/${slug}` : "/hesabim");
}

export async function cikisYap() {
  await oturumKapat();
  redirect("/");
}
