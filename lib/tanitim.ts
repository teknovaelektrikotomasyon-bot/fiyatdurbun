// Mağazalara tanıtım e-postası: tablo, ret (listeden çıkma) imzası.
import { createHmac } from "node:crypto";
import { q } from "./db.ts";

const sir = () => process.env.OTURUM_SIRRI ?? process.env.DATABASE_URL ?? "gelistirme";
export const retImza = (eposta: string) => createHmac("sha256", "ret:" + sir()).update(eposta.toLowerCase()).digest("base64url").slice(0, 22);

export async function tanitimTablolari() {
  await q(`create table if not exists magaza_tanitim (
    alan text primary key, eposta text not null, gonderim timestamptz, durum text not null default 'bekliyor', hata text)`);
  await q(`create table if not exists ileti_ret (eposta text primary key, zaman timestamptz not null default now())`);
}
