"use server";
import { redirect } from "next/navigation";
import { q, q1 } from "@/lib/db.ts";
import { epostaGecerli, oturumAc } from "@/lib/oturum.ts";
import { epostaGonder, siteAdresi } from "@/lib/eposta.ts";
import {
  denemeSiniri, girisDogrula, hataliDeneme, kullaniciAdiGecerli, sifirlamaJetonu, sifreGuclu, sifreOzetle, sifreYenile, uyelikSemasi,
} from "@/lib/uyelik.ts";

const guvenliDonus = (d: unknown) => (typeof d === "string" && d.startsWith("/") && !d.startsWith("//") ? d : "/hesabim");
const al = (f: FormData, k: string) => String(f.get(k) ?? "").trim().slice(0, 200);
const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function girisYap(form: FormData) {
  await uyelikSemasi();
  const kimlik = al(form, "kimlik"), sifre = String(form.get("sifre") ?? ""), donus = guvenliDonus(form.get("donus"));
  const geri = (h: string) => redirect(`/giris?hata=${h}&kimlik=${encodeURIComponent(kimlik)}&donus=${encodeURIComponent(donus)}`);
  if (!kimlik || !sifre) geri("bos");
  if (await denemeSiniri(kimlik)) geri("sinir");
  const id = await girisDogrula(kimlik, sifre);
  if (!id) { await hataliDeneme(kimlik); geri("yanlis"); }
  await oturumAc(id!, form.get("hatirla") === "evet");
  redirect(donus);
}

export async function kayitOl(form: FormData) {
  await uyelikSemasi();
  const v = { ad: al(form, "ad"), kullanici: al(form, "kullanici_adi"), eposta: al(form, "eposta").toLowerCase(),
    sifre: String(form.get("sifre") ?? ""), sifre2: String(form.get("sifre2") ?? ""), donus: guvenliDonus(form.get("donus")) };
  const h: string[] = [];
  if (v.ad.length < 2) h.push("ad");
  if (!kullaniciAdiGecerli(v.kullanici)) h.push("kullanici");
  if (!epostaGecerli(v.eposta)) h.push("eposta");
  if (!sifreGuclu(v.sifre)) h.push("sifre");
  if (v.sifre !== v.sifre2) h.push("sifre2");
  if (form.get("onay") !== "evet") h.push("onay");
  const geri = (hatalar: string[]) => redirect(`/kayit?hata=${hatalar.join(",")}&ad=${encodeURIComponent(v.ad)}&kullanici_adi=${encodeURIComponent(v.kullanici)}&eposta=${encodeURIComponent(v.eposta)}&donus=${encodeURIComponent(v.donus)}`);
  if (h.length) geri(h);
  if (await q1("select 1 from uye where lower(kullanici_adi)=lower($1)", [v.kullanici])) geri(["kullanici_alinmis"]);
  const var_ = await q1<{ id: number; sifre_ozet: string | null }>("select id, sifre_ozet from uye where lower(eposta)=$1", [v.eposta]);
  // Şifresi olan bir hesap varsa yeni kayıt açılmaz; eski şifresiz (e-posta bağlantılı) hesap şifre sıfırlamayla sahiplenilir.
  if (var_) geri([var_.sifre_ozet ? "eposta_kayitli" : "eposta_eski"]);
  const ileti = form.get("ileti") === "evet";
  const r = await q1<{ id: number }>(`insert into uye (eposta, ad, kullanici_adi, sifre_ozet, kvkk_onay, ileti_izni, son_giris)
    values ($1,$2,$3,$4, now(), $5, now()) returning id`, [v.eposta, v.ad, v.kullanici, await sifreOzetle(v.sifre), ileti]);
  await oturumAc(r!.id, true);
  try {
    await epostaGonder(v.eposta, "Fiyat Dürbün'e hoş geldiniz",
      `<p>Merhaba ${kacis(v.ad)},</p><p>Fiyat Dürbün hesabınız oluşturuldu. Kullanıcı adınız: <b>${kacis(v.kullanici)}</b></p>
       <p>Takip ettiğiniz ürünlerin fiyatı düşünce bu adrese haber vereceğiz: <a href="${siteAdresi()}/hesabim">Takip listem</a></p>
       <p>Bu kaydı siz yapmadıysanız bu e-postayı yanıtlayın.</p>`);
  } catch (e) { console.error("hoş geldin e-postası:", (e as Error).message); }
  redirect(v.donus);
}

export async function sifreUnuttum(form: FormData) {
  await uyelikSemasi();
  const kimlik = al(form, "kimlik").toLowerCase();
  // Hesap var mı yok mu belli edilmez; her durumda aynı mesaj gösterilir.
  const u = await q1<{ eposta: string }>("select eposta from uye where lower(eposta)=$1 or lower(kullanici_adi)=$1 limit 1", [kimlik]);
  if (u) {
    const son = await q1<{ n: number }>("select count(*)::int n from giris_jetonu where eposta=$1 and amac='sifre' and son > now()", [u.eposta]);
    if ((son?.n ?? 0) < 3) {
      const jeton = await sifirlamaJetonu(u.eposta);
      try {
        await epostaGonder(u.eposta, "Fiyat Dürbün şifre yenileme",
          `<p>Merhaba,</p><p>Şifrenizi yenilemek için aşağıdaki bağlantıya tıklayın. Bağlantı 30 dakika geçerli ve tek kullanımlıktır.</p>
           <p><a href="${siteAdresi()}/sifre-yenile?j=${jeton}">Şifremi yenile</a></p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.</p>`);
      } catch (e) {
        console.error("şifre e-postası:", (e as Error).message);
        redirect("/sifremi-unuttum?hata=gonderilemedi");
      }
    }
  }
  redirect("/sifremi-unuttum?gonderildi=1");
}

export async function sifreYenileIslem(form: FormData) {
  await uyelikSemasi();
  const j = String(form.get("j") ?? ""), s1 = String(form.get("sifre") ?? ""), s2 = String(form.get("sifre2") ?? "");
  if (!sifreGuclu(s1)) redirect(`/sifre-yenile?j=${encodeURIComponent(j)}&hata=sifre`);
  if (s1 !== s2) redirect(`/sifre-yenile?j=${encodeURIComponent(j)}&hata=sifre2`);
  const id = await sifreYenile(j, s1);
  if (!id) redirect("/sifremi-unuttum?hata=jeton");
  await q("delete from giris_denemesi where kimlik in (select lower(eposta) from uye where id=$1 union select lower(kullanici_adi) from uye where id=$1)", [id]);
  await oturumAc(id!, true);
  redirect("/hesabim?sifre=yenilendi");
}
