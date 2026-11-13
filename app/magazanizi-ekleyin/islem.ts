"use server";
import { redirect } from "next/navigation";
import { q, q1 } from "@/lib/db.ts";
import { epostaGecerli } from "@/lib/oturum.ts";
import { epostaGonder } from "@/lib/eposta.ts";
import { BASVURU_TURLERI, basvuruTablosu, mersisGecerli, siteDuzelt, vergiNoGecerli } from "@/lib/basvuru.ts";

const YONETICI = process.env.BASVURU_EPOSTA ?? "info@teknovaelektrik.com";
const TURLER = ["sahis", "limited", "anonim", "diger"];
const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function basvuruGonder(form: FormData) {
  const al = (k: string) => String(form.get(k) ?? "").trim().slice(0, 300);
  if (al("web_sitesi")) redirect("/magazanizi-ekleyin?gonderildi=1"); // bot tuzağı (gizli alan)

  const v = {
    sirket_turu: al("sirket_turu"), unvan: al("unvan"), vergi_dairesi: al("vergi_dairesi"),
    vergi_no: al("vergi_no").replace(/\D/g, ""), mersis_no: al("mersis_no").replace(/\D/g, "") || null,
    etbis: al("etbis") === "evet", site: siteDuzelt(al("site")), tur: al("tur"), feed: al("feed") || null,
    yetkili: al("yetkili"), eposta: al("eposta").toLowerCase(), telefon: al("telefon"),
  };
  const hatalar: string[] = [];
  if (!TURLER.includes(v.sirket_turu)) hatalar.push("tur");
  if (v.unvan.length < 5) hatalar.push("unvan");
  if (v.vergi_dairesi.length < 2) hatalar.push("vd");
  if (!vergiNoGecerli(v.vergi_no)) hatalar.push("vergi");
  if (v.sirket_turu !== "sahis" && !(v.mersis_no && mersisGecerli(v.mersis_no))) hatalar.push("mersis");
  if (v.mersis_no && !mersisGecerli(v.mersis_no)) hatalar.push("mersis");
  if (!v.site) hatalar.push("site");
  if (!BASVURU_TURLERI.some(([d]) => d === v.tur)) hatalar.push("urun");
  if (v.feed && !/^https?:\/\/\S+$/i.test(v.feed)) hatalar.push("feed");
  if (v.yetkili.length < 3) hatalar.push("yetkili");
  if (!epostaGecerli(v.eposta)) hatalar.push("eposta");
  if (v.telefon.replace(/\D/g, "").length < 10) hatalar.push("telefon");
  if (form.get("onay") !== "evet") hatalar.push("onay");
  if (hatalar.length) redirect(`/magazanizi-ekleyin?hata=${[...new Set(hatalar)].join(",")}`);

  await basvuruTablosu();
  // Kötüye kullanım sınırı: aynı site ya da e-postadan günde en çok 3 başvuru
  const son = await q1<{ n: number }>("select count(*)::int n from magaza_basvuru where (site=$1 or eposta=$2) and olusturma > now() - interval '1 day'", [v.site, v.eposta]);
  if ((son?.n ?? 0) >= 3) redirect("/magazanizi-ekleyin?hata=sinir");

  const r = await q1<{ id: number }>(`insert into magaza_basvuru (sirket_turu, unvan, vergi_dairesi, vergi_no, mersis_no, etbis, site, tur, feed, yetkili, eposta, telefon)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
    [v.sirket_turu, v.unvan, v.vergi_dairesi, v.vergi_no, v.mersis_no, v.etbis, v.site, v.tur, v.feed, v.yetkili, v.eposta, v.telefon]);

  const satir = (a: string, b: string | null | boolean) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${a}</td><td>${kacis(String(b ?? "-"))}</td></tr>`;
  try {
    await epostaGonder(YONETICI, `Yeni mağaza başvurusu #${r!.id}: ${v.unvan}`,
      `<table>${satir("Site", v.site)}${satir("Unvan", v.unvan)}${satir("Tür", v.sirket_turu)}${satir("Vergi", `${v.vergi_dairesi} / ${v.vergi_no}`)}
       ${satir("MERSİS", v.mersis_no)}${satir("ETBİS", v.etbis ? "var" : "yok")}${satir("Ürün grubu", v.tur)}${satir("Feed", v.feed)}${satir("Yetkili", v.yetkili)}
       ${satir("E-posta", v.eposta)}${satir("Telefon", v.telefon)}</table><p>Başvuru otomatik kontrol kuyruğunda.</p>`);
    await epostaGonder(v.eposta, "Fiyat Dürbün mağaza başvurunuzu aldık",
      `<p>Merhaba ${kacis(v.yetkili)},</p><p>${kacis(v.site!)} için mağaza başvurunuzu aldık (başvuru no: ${r!.id}).
       Sitenizi ve firma bilgilerinizi kontrol ettikten sonra sonucu bu adrese bildireceğiz.</p>
       <p>Fiyat Dürbün · Teknova Elektrik &amp; Otomasyon</p>`);
  } catch (e) { console.log("başvuru e-postası:", (e as Error).message); }
  redirect("/magazanizi-ekleyin?gonderildi=1");
}
