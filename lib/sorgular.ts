// Sitenin okuduğu tüm veriler. Fiyatlar ::float8 ile sayıya çevrilir (numeric sürücüden metin gelir).
import { q, q1 } from "./db.ts";

export type Ozellik = { anahtar: string; ad: string; tur: string; birim: string | null; filtre: string; grup: string | null };
export type UrunKart = {
  id: number; slug: string; model: string; varyant: string | null; marka: string; gorsel: string | null; gtin?: string | null;
  ozellikler: Record<string, string | number | boolean>;
  fiyat: number | null; magaza_sayisi: number; once30: number | null; enDusuk30: number | null; enYuksek30: number | null;
};
export type Filtre = Record<string, string | undefined>;

export const tl = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n) + " TL";

export async function kategori(slug: string) {
  return q1<{ id: number; slug: string; ad: string; aciklama: string | null }>("select id, slug, ad, aciklama from kategori where slug=$1", [slug]);
}

export async function ozellikler(kategoriId: number) {
  return q<Ozellik>("select anahtar, ad, tur, birim, filtre, grup from ozellik where kategori_id=$1 order by sira", [kategoriId]);
}

// Her ürün için: stoktaki en ucuz teklif (kargo dahil değil), mağaza sayısı, 30 gün önceki ve son 30 günün en düşük fiyatı.
const URUN_TABAN = `
  with t as (
    select urun_id, min(fiyat)::float8 as fiyat, count(distinct magaza_id)::int as magaza_sayisi
    from teklif tk join magaza m on m.id = tk.magaza_id
    where stokta and not tk.supheli and urun_id is not null and m.aktif and m.durum <> 'kapali' group by urun_id
  ), g as (
    select urun_id,
      (select min(f2.fiyat) from fiyat_gecmisi f2 where f2.urun_id = f.urun_id and f2.gun = (select min(gun) from fiyat_gecmisi f3 where f3.urun_id = f.urun_id and f3.gun >= current_date - 30))::float8 as once30,
      min(fiyat) filter (where gun >= current_date - 30 and gun < current_date)::float8 as en_dusuk30,
      -- Ölçek için: son 30 günde "günün en ucuzu"nun ulaştığı en yüksek değer.
      (select max(dm) from (select min(f4.fiyat) as dm from fiyat_gecmisi f4 where f4.urun_id = f.urun_id and f4.gun >= current_date - 30 group by f4.gun) z)::float8 as en_yuksek30
    from fiyat_gecmisi f group by urun_id
  )
  select u.id, u.slug, u.model, u.varyant, mk.ad as marka, u.gorsel, u.ozellikler, u.gtin, t.fiyat, coalesce(t.magaza_sayisi,0) as magaza_sayisi,
         g.once30 as "once30", g.en_dusuk30 as "enDusuk30", g.en_yuksek30 as "enYuksek30", u.kategori_id
  from urun u join marka mk on mk.id = u.marka_id
  left join t on t.urun_id = u.id left join g on g.urun_id = u.id`;

export async function urunler(kategoriIdler: number[], f: Filtre, ozl: Ozellik[], sirala = "fiyat", limit = 60, atla = 0) {
  const w: string[] = ["kategori_id = any($1::int[])", "fiyat is not null"];
  const p: unknown[] = [kategoriIdler];
  const ekle = (v: unknown) => { p.push(v); return "$" + p.length; };
  if (f.marka) w.push(`lower(marka) = any(${ekle(f.marka.toLowerCase().split(","))})`);
  if (f.fiyat) {
    const [a, b] = f.fiyat.split("-").map(Number);
    if (a) w.push(`fiyat >= ${ekle(a)}`);
    if (b) w.push(`fiyat <= ${ekle(b)}`);
  }
  if (f.q) w.push(`(lower(marka || ' ' || model || ' ' || coalesce(varyant,'')) like ${ekle("%" + f.q.toLowerCase() + "%")})`);
  for (const o of ozl) {
    const v = f[o.anahtar];
    if (!v || o.filtre === "yok") continue;
    const alan = `(ozellikler->>'${o.anahtar.replace(/'/g, "")}')`;
    if (o.filtre === "coklu") w.push(`${alan} = any(${ekle(v.split(","))})`);
    else if (o.filtre === "evet_hayir") w.push(`${alan} = ${ekle(v === "0" ? "false" : "true")}`);
    else if (o.filtre === "aralik") {
      const [a, b] = v.split("-").map(Number);
      if (Number.isFinite(a) && v.split("-")[0] !== "") w.push(`${alan}::numeric >= ${ekle(a)}`);
      if (Number.isFinite(b) && b) w.push(`${alan}::numeric <= ${ekle(b)}`);
    }
  }
  const sira = sirala === "pahali" ? "fiyat desc" : sirala === "dusen" ? "(fiyat - coalesce(once30, fiyat)) / nullif(once30,0) asc nulls last" : sirala === "magaza" ? "magaza_sayisi desc, fiyat" : "fiyat asc";
  return q<UrunKart>(`select * from (${URUN_TABAN}) x where ${w.join(" and ")} order by ${sira}, id limit ${Number(limit)} offset ${Math.max(0, Number(atla) || 0)}`, p);
}

// Filtre kenar çubuğu için: seçenekler ve sayılar (seçili filtrelerden bağımsız; sade tutuyoruz).
export async function filtreSecenekleri(kategoriIdler: number[], ozl: Ozellik[]) {
  const kategoriId = kategoriIdler;
  const markalar = await q<{ ad: string; n: number }>(
    `select mk.ad, count(*)::int as n from urun u join marka mk on mk.id=u.marka_id
     where u.kategori_id = any($1::int[]) and exists (select 1 from teklif t where t.urun_id=u.id and t.stokta) group by mk.ad order by n desc, mk.ad`, [kategoriId]);
  const fiyat = await q1<{ min: number; max: number }>(
    `select min(fiyat)::float8 as min, max(fiyat)::float8 as max from teklif t join urun u on u.id=t.urun_id where u.kategori_id = any($1::int[]) and t.stokta and not t.supheli`, [kategoriId]);
  const secenek: Record<string, { deger: string; n: number }[]> = {};
  const aralik: Record<string, { min: number; max: number }> = {};
  for (const o of ozl) {
    const alan = `ozellikler->>'${o.anahtar}'`;
    if (o.filtre === "coklu" || o.filtre === "evet_hayir") {
      secenek[o.anahtar] = await q(`select ${alan} as deger, count(*)::int as n from urun where kategori_id = any($1::int[]) and ${alan} is not null group by 1 order by ${o.tur === "sayi" ? `(${alan})::numeric` : "n desc"}`, [kategoriId]);
    } else if (o.filtre === "aralik") {
      const r = await q1<{ min: number; max: number }>(`select min((${alan})::numeric)::float8 as min, max((${alan})::numeric)::float8 as max from urun where kategori_id = any($1::int[])`, [kategoriId]);
      if (r?.min != null) aralik[o.anahtar] = r;
    }
  }
  return { markalar, fiyat, secenek, aralik };
}

// Kategori slug'ı → id eşlemesi ve her kategoride stokta fiyatı olan ürün sayısı (alt kategoriler toplanmadan).
export async function kategoriIdleri(sluglar: string[]) {
  if (!sluglar.length) return [];
  return q<{ id: number; slug: string }>("select id, slug from kategori where slug = any($1::text[])", [sluglar]);
}

export async function kategoriUrunSayilari() {
  const r = await q<{ slug: string; n: number }>(
    `select k.slug, count(distinct u.id)::int as n from kategori k join urun u on u.kategori_id = k.id
     where exists (select 1 from teklif t where t.urun_id = u.id and t.stokta) group by k.slug`);
  return new Map(r.map((x) => [x.slug, x.n]));
}

// Başlık ve açıklama metinleri için kategori (ve isteğe bağlı marka) özeti.
export async function kategoriOzet(kategoriIdler: number[], marka?: string) {
  if (!kategoriIdler.length) return null;
  return q1<{ urun: number; magaza: number; min: number | null; max: number | null; en_ucuz: string | null; marka_sayisi: number }>(
    `select count(distinct u.id)::int as urun, count(distinct t.magaza_id)::int as magaza,
            min(t.fiyat)::float8 as min, max(t.fiyat)::float8 as max, count(distinct u.marka_id)::int as marka_sayisi,
            (array_agg(mk.ad || ' ' || u.model || coalesce(' ' || u.varyant, '') order by t.fiyat))[1] as en_ucuz
     from urun u join teklif t on t.urun_id = u.id and t.stokta join marka mk on mk.id = u.marka_id join magaza m on m.id = t.magaza_id and m.aktif
     where u.kategori_id = any($1::int[]) and ($2::text is null or lower(mk.ad) = $2)`, [kategoriIdler, marka?.toLowerCase() ?? null]);
}

// Kategori sayfasındaki marka bağlantıları ve site haritası için: kategoride ürünü olan markalar.
export async function kategoriMarkalari(kategoriIdler: number[]) {
  if (!kategoriIdler.length) return [];
  return q<{ ad: string; n: number }>(
    `select mk.ad, count(distinct u.id)::int as n from urun u join marka mk on mk.id = u.marka_id
     where u.kategori_id = any($1::int[]) and exists (select 1 from teklif t where t.urun_id = u.id and t.stokta)
     group by mk.ad order by n desc, mk.ad`, [kategoriIdler]);
}

export async function urun(slug: string) {
  return q1<UrunKart & { kategori_id: number }>(`select * from (${URUN_TABAN}) x where slug=$1`, [slug]);
}

export type Teklif = {
  id: number; magaza: string; magaza_slug: string; magaza_durum: string; yetkili_satici: string | null; mersis: boolean;
  baslik: string; url: string; fiyat: number; kargo: number | null; stokta: boolean; renk: string | null; satici: string | null;
  garanti: string | null; guncelleme: string; en_dusuk30: number | null; supheli: boolean;
};

export async function teklifler(urunId: number) {
  return q<Teklif>(`
    select t.id, m.ad as magaza, m.slug as magaza_slug, m.durum as magaza_durum, m.yetkili_satici, (m.mersis_no is not null) as mersis,
      t.baslik, t.url, t.fiyat::float8 as fiyat, t.kargo::float8 as kargo, t.stokta, t.renk, t.satici, t.garanti, t.guncelleme::text, t.supheli,
      (select min(f.fiyat)::float8 from fiyat_gecmisi f where f.urun_id=t.urun_id and f.magaza_id=t.magaza_id and f.gun >= current_date-30 and f.gun < current_date) as en_dusuk30
    from teklif t join magaza m on m.id=t.magaza_id
    where t.urun_id=$1 and m.aktif and m.durum <> 'kapali'
    order by t.stokta desc, t.supheli, t.fiyat + coalesce(t.kargo,0)`, [urunId]);
}

export type DisFiyat = { ulke: string; kaynak: string; url: string; fiyat: number; para: string; kur: number; kur_tarihi: string; guncelleme: string };

// Yurt dışı resmî mağaza fiyatları; 3 günden eski okumalar gösterilmez (bayat fiyat yanıltır).
export async function disFiyatlar(urunId: number) {
  try {
    return await q<DisFiyat>(
      `select ulke, kaynak, url, fiyat::float8 as fiyat, para, kur::float8 as kur, kur_tarihi::text, guncelleme::text
       from dis_fiyat where urun_id = $1 and guncelleme > now() - interval '3 days' order by fiyat`, [urunId]);
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") return []; // tablo henüz yok (toplayıcı ilk kez çalışmadı)
    throw e;
  }
}

export async function fiyatGecmisi(urunId: number, gun = 180) {
  return q<{ gun: string; magaza: string; fiyat: number }>(
    `select f.gun::text as gun, m.ad as magaza, f.fiyat::float8 as fiyat from fiyat_gecmisi f join magaza m on m.id=f.magaza_id
     where f.urun_id=$1 and f.gun >= current_date - $2::int order by f.gun`, [urunId, gun]);
}

export async function benzerler(u: { id: number; kategori_id: number; model: string; marka: string }) {
  return q<UrunKart>(`select * from (${URUN_TABAN}) x where kategori_id=$1 and id<>$2 and fiyat is not null and (model=$3 or marka=$4) order by (model=$3) desc, fiyat limit 8`,
    [u.kategori_id, u.id, u.model, u.marka]);
}

export async function enCokDusenler(limit = 8) {
  return q<UrunKart>(`select * from (${URUN_TABAN}) x where fiyat is not null and once30 is not null and fiyat < once30 order by (fiyat - once30)/once30 limit ${Number(limit)}`);
}

export async function populer(limit = 8) {
  return q<UrunKart>(`select * from (${URUN_TABAN}) x where fiyat is not null order by magaza_sayisi desc, (select count(*) from tiklama tk join teklif t on t.id=tk.teklif_id where t.urun_id=x.id) desc, fiyat desc limit ${Number(limit)}`);
}

export async function ara(metin: string, limit = 40) {
  const kelimeler = metin.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!kelimeler.length) return [];
  const w = kelimeler.map((_, i) => `lower(marka || ' ' || model || ' ' || coalesce(varyant,'')) like $${i + 1}`);
  return q<UrunKart>(`select * from (${URUN_TABAN}) x where ${w.join(" and ")} order by fiyat is null, fiyat limit ${Number(limit)}`, kelimeler.map((k) => `%${k}%`));
}

export async function magazalar() {
  return q<{ slug: string; ad: string; site: string; aktif: boolean; durum: string; unvan: string | null; mersis_no: string | null; vergi_no: string | null;
    etbis: boolean | null; adres: string | null; telefon: string | null; iade_gun: number | null; yetkili_satici: string | null; sikayet_puani: number | null;
    guven_notu: string | null; guven_kontrol: string | null; son_okuma: string | null; teklif_sayisi: number }>(
    `select m.*, m.sikayet_puani::float8 as sikayet_puani, m.guven_kontrol::text as guven_kontrol, m.son_okuma::text as son_okuma,
       (select count(*)::int from teklif t where t.magaza_id=m.id and t.stokta) as teklif_sayisi
     from magaza m where m.aktif or m.kaynak <> 'oto' order by m.aktif desc, teklif_sayisi desc`);
}
