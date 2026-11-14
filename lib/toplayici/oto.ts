// Otomatik eklenen mağazalarda türe göre izinli bölümler (ana bölüm ya da alt dal slug'ı) (tümüne izin vermek "mobilyada mikser" gibi yanlış eşleşme doğurur).
export const TUR_KOK: Record<string, string[]> = {
  elektronik: ["elektronik"], bilgisayar: ["elektronik"], telefon: ["elektronik"], aksesuar: ["elektronik"], robotik: ["elektronik-hobi", "3d-yazici"],
  "ev-aletleri": ["beyaz-esya-ev-aletleri", "ev-dekorasyon-mutfak"], ev: ["ev-dekorasyon-mutfak", "mobilya"], mobilya: ["mobilya", "ev-dekorasyon-mutfak"],
  kozmetik: ["kozmetik-kisisel-bakim", "anne-bebek-oyuncak"], takviye: ["kozmetik-kisisel-bakim", "supermarket"], pet: ["pet-shop"],
  bebek: ["anne-bebek-oyuncak"], oyuncak: ["anne-bebek-oyuncak"], market: ["supermarket", "kozmetik-kisisel-bakim", "anne-bebek-oyuncak"],
  "yapi-market": ["yapi-market-bahce"], bahce: ["yapi-market-bahce"], kitap: ["kitap-muzik-hobi", "ofis-kirtasiye"], ofis: ["ofis-kirtasiye"],
  spor: ["spor-ve-outdoor", "giyim-ayakkabi-aksesuar"], otomotiv: ["otomotiv"], giyim: ["giyim-ayakkabi-aksesuar"],
};

/** Mağazaya özel izinli bölümler (türün varsayılanından daha doğru olduğu yerler). Veritabanındaki kesif.kokler'den önce gelir. */
export const MAGAZA_KOK: Record<string, string[]> = {
  // Robotik mağazaları: yalnız cihaz/modül düzeyi (geliştirme kartı, sensör, motor sürücü, kit, lehim/ölçüm, 3D, drone).
  // Direnç, kondansatör, konnektör gibi tekil komponentler için kategori yok; eşlenmezler.
  direnc: ["elektronik-hobi", "3d-yazici"], robotistan: ["elektronik-hobi", "3d-yazici"],
  // Erkek giyim markaları: ürün adında cinsiyet geçmese de kadın bölümüne düşmesin.
  kigili: ["erkek-giyim", "ayakkabi", "giyim-aksesuari", "canta-valiz"],
  ramsey: ["erkek-giyim", "ayakkabi", "giyim-aksesuari", "canta-valiz"],
  damattween: ["erkek-giyim", "ayakkabi", "giyim-aksesuari", "canta-valiz"],
};

/** Site haritasındaki Türkçe olmayan dil sürümleri (/en/, /de/, /en-us/ ...): aynı ürünün yabancı dildeki kopyası. */
export const YABANCI_DIL = /^https?:\/\/[^/]+\/(en|de|ar|ru|fr|es|it|nl|az|ka|uk|ro|bg|el|fa|he|pl|ja|zh|ko|sv|da|fi|no|pt|cs|hu)([-_][a-z]{2})?(\/|$)/i;
