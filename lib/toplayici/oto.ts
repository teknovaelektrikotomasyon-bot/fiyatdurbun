// Otomatik eklenen mağazalarda türe göre izinli bölümler (ana bölüm ya da alt dal slug'ı) (tümüne izin vermek "mobilyada mikser" gibi yanlış eşleşme doğurur).
export const TUR_KOK: Record<string, string[]> = {
  elektronik: ["elektronik"], bilgisayar: ["elektronik"], telefon: ["elektronik"], aksesuar: ["elektronik"], robotik: ["elektronik-hobi", "3d-yazici"],
  "ev-aletleri": ["beyaz-esya-ev-aletleri", "ev-dekorasyon-mutfak"], ev: ["ev-dekorasyon-mutfak", "mobilya"], mobilya: ["mobilya", "ev-dekorasyon-mutfak"],
  kozmetik: ["kozmetik-kisisel-bakim", "anne-bebek-oyuncak"], takviye: ["kozmetik-kisisel-bakim", "supermarket"], pet: ["pet-shop"],
  bebek: ["anne-bebek-oyuncak"], oyuncak: ["anne-bebek-oyuncak"], market: ["supermarket", "kozmetik-kisisel-bakim", "anne-bebek-oyuncak"],
  "yapi-market": ["yapi-market-bahce"], bahce: ["yapi-market-bahce"], kitap: ["kitap-muzik-hobi", "ofis-kirtasiye"], ofis: ["ofis-kirtasiye"],
  spor: ["spor-ve-outdoor", "giyim-ayakkabi-aksesuar"], otomotiv: ["otomotiv"],
};
