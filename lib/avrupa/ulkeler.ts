// Avrupa fiyatı okunan ülkeler (euro bölgesi; TL karşılığı tek kurla hesaplanır).
export const AVRUPA_ULKELERI = [
  { kod: "DE", ad: "Almanya", yol: "de" },
  { kod: "FR", ad: "Fransa", yol: "fr" },
  { kod: "IT", ad: "İtalya", yol: "it" },
  { kod: "ES", ad: "İspanya", yol: "es" },
  { kod: "NL", ad: "Hollanda", yol: "nl" },
] as const;

export const ULKE_ADI: Record<string, string> = Object.fromEntries(AVRUPA_ULKELERI.map((u) => [u.kod, u.ad]));
export const KAYNAK_ADI: Record<string, string> = { apple: "Apple Store", samsung: "Samsung Shop" };

export type DisSatir = { marka: string; model: string; depolamaGb: number; fiyat: number; para: string; url: string; gorsel?: string };
