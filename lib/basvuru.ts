// Mağaza başvurusu: doğrulama yardımcıları ve tablo.
import { q } from "./db.ts";

/** Vergi kimlik numarası (10 hane, Gelir İdaresi algoritması) ya da şahıs şirketi için T.C. kimlik no (11 hane). */
export function vergiNoGecerli(no: string) {
  const d = no.replace(/\D/g, "");
  if (d.length === 10) {
    const r = [...d].map(Number);
    let top = 0;
    for (let i = 0; i < 9; i++) {
      const t = (r[i] + 9 - i) % 10;
      let v = (t * 2 ** (9 - i)) % 9;
      if (t !== 0 && v === 0) v = 9;
      top += v;
    }
    return (10 - (top % 10)) % 10 === r[9];
  }
  if (d.length === 11) {
    const r = [...d].map(Number);
    if (r[0] === 0) return false;
    const tek = r[0] + r[2] + r[4] + r[6] + r[8], cift = r[1] + r[3] + r[5] + r[7];
    if (((tek * 7 - cift) % 10 + 10) % 10 !== r[9]) return false;
    return r.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === r[10];
  }
  return false;
}

export const mersisGecerli = (no: string) => /^\d{16}$/.test(no.replace(/\D/g, ""));

/** https://alan.com biçimine getirir; geçersizse null. */
export function siteDuzelt(s: string) {
  try {
    const u = new URL(/^https?:\/\//i.test(s.trim()) ? s.trim() : `https://${s.trim()}`);
    if (!/\.[a-z]{2,}$/i.test(u.hostname)) return null;
    return `https://${u.hostname.toLowerCase()}`;
  } catch { return null; }
}

export async function basvuruTablosu() {
  await q(`create table if not exists magaza_basvuru (
    id          serial primary key,
    sirket_turu text not null,
    unvan       text not null,
    vergi_dairesi text not null,
    vergi_no    text not null,
    mersis_no   text,
    etbis       boolean not null default false,
    site        text not null,
    tur         text not null default '',
    feed        text,
    yetkili     text not null,
    eposta      text not null,
    telefon     text not null,
    durum       text not null default 'bekliyor',   -- bekliyor / eklendi / olmadi / reddedildi
    sonuc       text,
    olusturma   timestamptz not null default now(),
    islenme     timestamptz
  )`);
}

/** Başvuru formundaki "ne satıyorsunuz" seçenekleri → lib/toplayici/oto.ts TUR_KOK anahtarları. */
export const BASVURU_TURLERI: [string, string][] = [
  ["elektronik", "Elektronik, bilgisayar, telefon"], ["robotik", "Robotik, elektronik komponent, 3D yazıcı"],
  ["ev-aletleri", "Beyaz eşya, küçük ev aletleri"], ["ev", "Ev, dekorasyon, mutfak"], ["mobilya", "Mobilya"],
  ["kozmetik", "Kozmetik, kişisel bakım, dermokozmetik"], ["takviye", "Sporcu gıdası, vitamin"], ["market", "Market, gıda"],
  ["bebek", "Anne, bebek"], ["oyuncak", "Oyuncak"], ["pet", "Pet shop"], ["yapi-market", "Yapı market, hırdavat, bahçe"],
  ["kitap", "Kitap, kırtasiye, hobi"], ["ofis", "Ofis, kırtasiye"], ["spor", "Spor, outdoor"], ["giyim", "Giyim, ayakkabı, aksesuar"],
  ["otomotiv", "Otomotiv, yedek parça"],
];
