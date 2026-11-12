// Okunan teklifi veritabanına yazar: mağaza → ürün eşleştirme → teklif → günlük fiyat geçmişi.
// Eşleştirme sırası: barkod (GTIN) → normalize marka|model|depolama. Eşleşemeyen teklif kuyruğa düşer.
import { q, q1 } from "./db.ts";
import type { OkunanTeklif } from "./toplayici/okuyucu.ts";
import { TELEFON_OZELLIKLERI, bellekBul, eslesmeAnahtari, markaBul, modelBul, ozellikleriCevir, duzle } from "./katalog/telefon.ts";
import { MAGAZALAR } from "./toplayici/magazalar.ts";
import { tumKategoriler } from "./katalog/agac.ts";

const KATEGORILER = [{ slug: "akilli-telefon", ad: "Akıllı Telefon", aciklama: "Akıllı telefon fiyatlarını mağaza mağaza karşılaştır." }];

const slugla = (s: string) => duzle(s).replace(/\s+/g, "-").replace(/\+/g, "-plus");

// Kod içindeki kategori ağacını tabloya eşitler (toplu, tek sorguda). Eski veritabanları için sütunları da ekler.
async function kategoriAgaciniEsitle() {
  // ALTER TABLE, sütun varken bile tabloyu kilitlemeye çalışır ve sitenin okumalarını bekler; yalnızca eksikse çalıştır.
  const sutunlar = new Set((await q<{ c: string }>("select column_name as c from information_schema.columns where table_name = 'kategori'")).map((x) => x.c));
  if (!sutunlar.has("sira")) await q("alter table kategori add column sira int not null default 0");
  if (!sutunlar.has("google_id")) await q("alter table kategori add column google_id int");
  const k = tumKategoriler();
  await q(`insert into kategori (slug, ad, sira, google_id)
           select * from unnest($1::text[], $2::text[], $3::int[], $4::int[])
           on conflict (slug) do update set ad=excluded.ad, sira=excluded.sira, google_id=excluded.google_id
           where (kategori.ad, kategori.sira, kategori.google_id) is distinct from (excluded.ad, excluded.sira, excluded.google_id)`,
    [k.map((x) => x.slug), k.map((x) => x.ad), k.map((x) => x.sira), k.map((x) => x.g)]);
  // Yalnızca değişen satırları günceller (her çalıştırmada 415 satırı yeniden yazmamak için).
  await q(`update kategori c set ust_id = u.id
           from unnest($1::text[], $2::text[]) as x(slug, ust) left join kategori u on u.slug = x.ust
           where c.slug = x.slug and c.ust_id is distinct from u.id`,
    [k.map((x) => x.slug), k.map((x) => x.ust)]);
}

export async function katalogHazirla() {
  await kategoriAgaciniEsitle();
  for (const k of KATEGORILER) {
    await q("insert into kategori (slug, ad, aciklama) values ($1,$2,$3) on conflict (slug) do update set ad=excluded.ad, aciklama=excluded.aciklama", [k.slug, k.ad, k.aciklama]);
  }
  const kat = await q1<{ id: number }>("select id from kategori where slug='akilli-telefon'");
  let sira = 0;
  for (const o of TELEFON_OZELLIKLERI) {
    await q(`insert into ozellik (kategori_id, anahtar, ad, tur, birim, filtre, sira, grup) values ($1,$2,$3,$4,$5,$6,$7,$8)
             on conflict (kategori_id, anahtar) do update set ad=excluded.ad, tur=excluded.tur, birim=excluded.birim, filtre=excluded.filtre, sira=excluded.sira, grup=excluded.grup`,
      [kat!.id, o.anahtar, o.ad, o.tur, o.birim ?? null, o.filtre, sira++, o.grup]);
  }
  for (const m of MAGAZALAR) {
    await q(`insert into magaza (slug, ad, site, aktif) values ($1,$2,$3,$4)
             on conflict (slug) do update set ad=excluded.ad, site=excluded.site, aktif=excluded.aktif`, [m.slug, m.ad, m.site, m.durum === "acik"]);
  }
}

export type Kayit = OkunanTeklif & { ozellikHam?: Record<string, string> };

export async function kaydet(magazaSlug: string, kategoriSlug: string, t: Kayit, gun = new Date().toISOString().slice(0, 10)) {
  const mg = await q1<{ id: number }>("select id from magaza where slug=$1", [magazaSlug]);
  const kat = await q1<{ id: number }>("select id from kategori where slug=$1", [kategoriSlug]);
  if (!mg || !kat) throw new Error("mağaza/kategori yok: " + magazaSlug + "/" + kategoriSlug);

  // Mağazanın kendi özellik tablosu ürün adından daha güvenilir: "Standart Model Adı" + "Marka" varsa onları kullan.
  const ham = t.ozellikHam ?? {};
  const hamBul = (re: RegExp) => Object.entries(ham).find(([k]) => re.test(duzle(k)))?.[1];
  const marka = markaBul(t.ad, t.marka ?? hamBul(/^marka$/));
  const ozellik = ozellikleriCevir(ham, t.ad);
  const depolama = (ozellik.depolama_gb as number | undefined) ?? bellekBul(t.ad).depolama;
  const standart = hamBul(/standart model/);
  const model = marka ? modelBul(standart && standart.length > 2 ? `${standart} ${depolama ?? ""} GB` : t.ad, marka) : undefined;
  const anahtar = marka && model ? eslesmeAnahtari(marka, model, depolama) : null;

  let urunId: number | undefined;
  if (t.gtin) urunId = (await q1<{ id: number }>("select id from urun where $1 = any(gtin)", [t.gtin]))?.id;
  if (!urunId && anahtar) urunId = (await q1<{ id: number }>("select id from urun where eslesme_anahtari=$1 and kategori_id=$2", [anahtar, kat.id]))?.id;

  if (!urunId && anahtar && marka && model && depolama) {
    const mSlug = slugla(marka);
    await q("insert into marka (slug, ad) values ($1,$2) on conflict (slug) do nothing", [mSlug, marka]);
    const mk = await q1<{ id: number }>("select id from marka where slug=$1", [mSlug]);
    const varyant = depolama >= 1024 ? `${depolama / 1024} TB` : `${depolama} GB`;
    const slug = slugla(`${marka} ${model} ${varyant}`);
    const y = await q1<{ id: number }>(
      `insert into urun (kategori_id, marka_id, model, varyant, slug, gtin, ozellikler, gorsel, eslesme_anahtari)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (slug) do update set slug=excluded.slug returning id`,
      [kat.id, mk!.id, model, varyant, slug, t.gtin ? [t.gtin] : [], JSON.stringify({ ...ozellik, depolama_gb: depolama }), t.gorsel ?? null, anahtar]);
    urunId = y!.id;
  } else if (urunId) {
    // Eksik özellikleri ve görseli tamamla; var olanı ezme (ilk güvenilir kaynak kalır).
    await q(`update urun set ozellikler = $2::jsonb || ozellikler,
               gorsel = coalesce(gorsel, $3),
               gtin = case when $4::text is null or $4 = any(gtin) then gtin else array_append(gtin, $4) end
             where id=$1`, [urunId, JSON.stringify(ozellik), t.gorsel ?? null, t.gtin ?? null]);
  }

  const kod = t.sku ?? t.url;
  // Renk: yapılandırılmış veride yoksa başlıkta bellek ifadesinden sonra gelen kısım ("iPhone 17 256GB Ada Çayı").
  const renk = t.renk ?? (t.ad.split(/\d+(?:[.,]\d+)?\s*(?:GB|TB)\b/i).pop()?.replace(/^[\s,-]+/, "").trim() || null);
  const garanti = hamBul(/garanti/);
  const tk = await q1<{ id: number }>(
    `insert into teklif (urun_id, magaza_id, magaza_kodu, baslik, url, fiyat, kargo, stokta, gtin, renk, satici, garanti, ozellik_ham, guncelleme)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
     on conflict (magaza_id, magaza_kodu) do update set urun_id=coalesce(teklif.urun_id, excluded.urun_id), baslik=excluded.baslik, url=excluded.url,
       fiyat=excluded.fiyat, kargo=excluded.kargo, stokta=excluded.stokta, gtin=excluded.gtin, renk=excluded.renk, satici=excluded.satici,
       garanti=excluded.garanti, ozellik_ham=excluded.ozellik_ham, guncelleme=now()
     returning id, urun_id`,
    [urunId ?? null, mg.id, kod, t.ad, t.url, t.fiyat, t.kargo ?? null, t.stokta, t.gtin ?? null, renk, t.satici ?? null, garanti ?? null, Object.keys(ham).length ? JSON.stringify(ham) : null]);

  const sonUrun = (tk as unknown as { urun_id: number | null }).urun_id;
  if (sonUrun && t.stokta) {
    await q(`insert into fiyat_gecmisi (urun_id, magaza_id, gun, fiyat) values ($1,$2,$3,$4)
             on conflict (urun_id, magaza_id, gun) do update set fiyat = least(fiyat_gecmisi.fiyat, excluded.fiyat)`, [sonUrun, mg.id, gun, t.fiyat]);
  } else if (!sonUrun) {
    await q(`insert into eslesme_kuyrugu (teklif_id, neden) values ($1,$2) on conflict (teklif_id) do nothing`,
      [tk!.id, anahtar ? "depolama bulunamadı" : "marka/model çözülemedi"]);
  }
  await q("update magaza set son_okuma=now() where id=$1", [mg.id]);
  return { urunId: sonUrun, anahtar };
}
