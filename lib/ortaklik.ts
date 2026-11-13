// Satış ortaklığı (affiliate) kimlikleri. Amazon.com.tr Ortaklar Programı: ortak kimliği fiyatdurbun-21.
// API (Creators API) erişimi ilk nitelikli satıştan sonra açılır; o zamana kadar yalnız arama bağlantısı verilir,
// fiyat gösterilmez (Amazon politikası: API dışından alınmış Amazon fiyatı gösterilemez).
export const AMAZON_ORTAK = "fiyatdurbun-21";

export function amazonAramaLinki(sorgu: string) {
  return `https://www.amazon.com.tr/s?k=${encodeURIComponent(sorgu)}&tag=${AMAZON_ORTAK}`;
}
