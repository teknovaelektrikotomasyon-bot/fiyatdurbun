// db/kaynak/kategori-agaci.txt dosyasından db/kaynak/agac_uret.py ile üretilir; elle değil, kaynak dosyadan düzenleyin.
// g = Google ürün taksonomisi kimliği (satış ortaklığı beslemelerindeki google_product_category ile eşlemek için).
export type KategoriDugumu = { ad: string; slug: string; g: number | null; alt?: KategoriDugumu[] };

// 415 kategori, 3 seviye. Sıra = menüdeki sıra.
export const KATEGORI_AGACI: KategoriDugumu[] = [
  { ad: "Elektronik", slug: "elektronik", g: 222, alt: [
    { ad: "Cep Telefonu ve Aksesuarları", slug: "cep-telefonu-ve-aksesuarlari", g: 270, alt: [
      { ad: "Akıllı Telefon", slug: "akilli-telefon", g: 267 },
      { ad: "Tuşlu Telefon", slug: "tuslu-telefon", g: 267 },
      { ad: "Telefon Kılıfı", slug: "telefon-kilifi", g: 2353 },
      { ad: "Ekran Koruyucu", slug: "ekran-koruyucu", g: 5468 },
      { ad: "Şarj Aleti ve Kablo", slug: "sarj-aleti-ve-kablo", g: 505295 },
      { ad: "Powerbank", slug: "powerbank", g: 7167 },
      { ad: "Telefon Tutucu", slug: "telefon-tutucu", g: 5566 },
      { ad: "Ev ve Ofis Telefonu", slug: "ev-ofis-telefonu", g: 271 }
    ] },
    { ad: "Bilgisayar", slug: "bilgisayar", g: 278, alt: [
      { ad: "Dizüstü Bilgisayar", slug: "dizustu-bilgisayar", g: 328 },
      { ad: "Masaüstü Bilgisayar", slug: "masaustu-bilgisayar", g: 325 },
      { ad: "Tablet", slug: "tablet", g: 4745 },
      { ad: "All-in-One Bilgisayar", slug: "all-in-one-bilgisayar", g: 325 },
      { ad: "Oyun Bilgisayarı", slug: "oyun-bilgisayari", g: 325 },
      { ad: "E-Kitap Okuyucu", slug: "e-kitap-okuyucu", g: 3539 },
      { ad: "Mini PC", slug: "mini-pc", g: 325 }
    ] },
    { ad: "Bilgisayar Bileşenleri", slug: "bilgisayar-bilesenleri", g: 285, alt: [
      { ad: "İşlemci", slug: "islemci", g: 292 },
      { ad: "Ekran Kartı", slug: "ekran-karti", g: 297 },
      { ad: "Anakart", slug: "anakart", g: 289 },
      { ad: "RAM Bellek", slug: "ram-bellek", g: 285 },
      { ad: "SSD", slug: "ssd", g: 2414 },
      { ad: "Harddisk", slug: "harddisk", g: 380 },
      { ad: "Güç Kaynağı", slug: "guc-kaynagi", g: 291 },
      { ad: "Bilgisayar Kasası", slug: "bilgisayar-kasasi", g: 285 },
      { ad: "İşlemci Soğutucu", slug: "islemci-sogutucu", g: 295 }
    ] },
    { ad: "Bilgisayar Çevre Birimleri", slug: "bilgisayar-cevre-birimleri", g: 1928, alt: [
      { ad: "Monitör", slug: "monitor", g: 305 },
      { ad: "Klavye", slug: "klavye", g: 303 },
      { ad: "Mouse", slug: "mouse", g: 304 },
      { ad: "Kulaklık ve Mikrofon", slug: "bilgisayar-kulakligi", g: 543626 },
      { ad: "Web Kamerası", slug: "web-kamerasi", g: 312 },
      { ad: "Harici Disk", slug: "harici-disk", g: 2414 },
      { ad: "USB Bellek", slug: "usb-bellek", g: 3712 },
      { ad: "Hafıza Kartı", slug: "hafiza-karti", g: 3387 },
      { ad: "Laptop Çantası", slug: "laptop-cantasi", g: 1928 }
    ] },
    { ad: "Yazıcı ve Tarayıcı", slug: "yazici-ve-tarayici", g: 345, alt: [
      { ad: "Yazıcı", slug: "yazici", g: 500106 },
      { ad: "3D Yazıcı", slug: "3d-yazici", g: 6865 },
      { ad: "Tarayıcı", slug: "tarayici", g: 306 },
      { ad: "Toner ve Kartuş", slug: "toner-ve-kartus", g: 356 }
    ] },
    { ad: "Ağ Ürünleri", slug: "ag-urunleri", g: 342, alt: [
      { ad: "Modem", slug: "modem", g: 343 },
      { ad: "Router ve Mesh Wi-Fi", slug: "router", g: 5497 },
      { ad: "Menzil Genişletici", slug: "menzil-genisletici", g: 5496 },
      { ad: "Network Switch", slug: "network-switch", g: 2455 },
      { ad: "NAS", slug: "nas", g: 5269 }
    ] },
    { ad: "TV ve Görüntü", slug: "tv-ve-goruntu", g: 386, alt: [
      { ad: "Televizyon", slug: "televizyon", g: 404 },
      { ad: "Projeksiyon Cihazı", slug: "projeksiyon-cihazi", g: 396 },
      { ad: "Medya Oynatıcı", slug: "medya-oynatici", g: 5276 },
      { ad: "Uydu Alıcısı", slug: "uydu-alicisi", g: 5561 },
      { ad: "TV Askı Aparatı", slug: "tv-aski-aparati", g: 386 }
    ] },
    { ad: "Ses Sistemleri", slug: "ses-sistemleri", g: 223, alt: [
      { ad: "Kulaklık", slug: "kulaklik", g: 543626 },
      { ad: "Kablosuz Kulaklık", slug: "kablosuz-kulaklik", g: 543626 },
      { ad: "Bluetooth Hoparlör", slug: "bluetooth-hoparlor", g: 249 },
      { ad: "Soundbar", slug: "soundbar", g: 249 },
      { ad: "Ev Sinema Sistemi", slug: "ev-sinema-sistemi", g: 252 },
      { ad: "Mikrofon", slug: "mikrofon", g: 234 },
      { ad: "Pikap ve Hi-Fi", slug: "pikap", g: 256 }
    ] },
    { ad: "Fotoğraf ve Kamera", slug: "fotograf-ve-kamera", g: 141, alt: [
      { ad: "Fotoğraf Makinesi", slug: "fotograf-makinesi", g: 152 },
      { ad: "Aksiyon Kamerası", slug: "aksiyon-kamerasi", g: 142 },
      { ad: "Video Kamera", slug: "video-kamera", g: 155 },
      { ad: "Objektif", slug: "objektif", g: 4432 },
      { ad: "Drone", slug: "drone", g: 141 },
      { ad: "Dürbün ve Teleskop", slug: "durbun-teleskop", g: 157 }
    ] },
    { ad: "Oyun ve Konsol", slug: "oyun-ve-konsol", g: 1294, alt: [
      { ad: "Oyun Konsolu", slug: "oyun-konsolu", g: 1294 },
      { ad: "Konsol Oyunları", slug: "konsol-oyunlari", g: 1279 },
      { ad: "Oyun Kolu", slug: "oyun-kolu", g: 301 },
      { ad: "Oyuncu Koltuğu", slug: "oyuncu-koltugu", g: 6800 },
      { ad: "VR Gözlük", slug: "vr-gozluk", g: 1294 }
    ] },
    { ad: "Giyilebilir Teknoloji", slug: "giyilebilir-teknoloji", g: 2082, alt: [
      { ad: "Akıllı Saat", slug: "akilli-saat", g: 201 },
      { ad: "Akıllı Bileklik", slug: "akilli-bileklik", g: 500009 },
      { ad: "Akıllı Yüzük", slug: "akilli-yuzuk", g: 500009 }
    ] },
    { ad: "Akıllı Ev", slug: "akilli-ev", g: 359, alt: [
      { ad: "Güvenlik Kamerası", slug: "guvenlik-kamerasi", g: 362 },
      { ad: "Akıllı Priz ve Ampul", slug: "akilli-priz-ampul", g: 2425 },
      { ad: "Akıllı Kapı Zili", slug: "akilli-kapi-zili", g: 359 },
      { ad: "Alarm Sistemi", slug: "alarm-sistemi", g: 3873 }
    ] }
  ] },
  { ad: "Beyaz Eşya ve Ev Aletleri", slug: "beyaz-esya-ev-aletleri", g: 604, alt: [
    { ad: "Beyaz Eşya", slug: "beyaz-esya", g: 604, alt: [
      { ad: "Buzdolabı", slug: "buzdolabi", g: 686 },
      { ad: "Çamaşır Makinesi", slug: "camasir-makinesi", g: 2549 },
      { ad: "Bulaşık Makinesi", slug: "bulasik-makinesi", g: 680 },
      { ad: "Kurutma Makinesi", slug: "kurutma-makinesi", g: 2612 },
      { ad: "Fırın", slug: "firin", g: 683 },
      { ad: "Ankastre Set", slug: "ankastre-set", g: 683 },
      { ad: "Ocak", slug: "ocak", g: 679 },
      { ad: "Derin Dondurucu", slug: "derin-dondurucu", g: 681 },
      { ad: "Davlumbaz ve Aspiratör", slug: "davlumbaz", g: 684 }
    ] },
    { ad: "Isıtma ve Soğutma", slug: "isitma-ve-sogutma", g: 1626, alt: [
      { ad: "Klima", slug: "klima", g: 605 },
      { ad: "Kombi", slug: "kombi", g: 621 },
      { ad: "Isıtıcı", slug: "isitici", g: 611 },
      { ad: "Vantilatör", slug: "vantilator", g: 608 },
      { ad: "Hava Temizleyici", slug: "hava-temizleyici", g: 606 },
      { ad: "Nem Alma Cihazı", slug: "nem-alma-cihazi", g: 607 },
      { ad: "Su Isıtıcı ve Termosifon", slug: "termosifon", g: 621 }
    ] },
    { ad: "Elektrikli Süpürge ve Temizlik", slug: "elektrikli-supurge-ve-temizlik", g: 619, alt: [
      { ad: "Elektrikli Süpürge", slug: "elektrikli-supurge", g: 619 },
      { ad: "Robot Süpürge", slug: "robot-supurge", g: 619 },
      { ad: "Dikey Şarjlı Süpürge", slug: "dikey-supurge", g: 619 },
      { ad: "Buharlı Temizleyici", slug: "buharli-temizleyici", g: 543603 },
      { ad: "Halı Yıkama Makinesi", slug: "hali-yikama-makinesi", g: 543600 }
    ] },
    { ad: "Mutfak Aletleri", slug: "mutfak-aletleri", g: 730, alt: [
      { ad: "Kahve Makinesi", slug: "kahve-makinesi", g: 736 },
      { ad: "Çay Makinesi", slug: "cay-makinesi", g: 730 },
      { ad: "Airfryer", slug: "airfryer", g: 738 },
      { ad: "Blender ve Mutfak Robotu", slug: "blender-mutfak-robotu", g: 730 },
      { ad: "Mikser", slug: "mikser", g: 730 },
      { ad: "Tost Makinesi", slug: "tost-makinesi", g: 759 },
      { ad: "Kettle", slug: "kettle", g: 751 },
      { ad: "Mikrodalga Fırın", slug: "mikrodalga-firin", g: 753 },
      { ad: "Mini Fırın", slug: "mini-firin", g: 761 },
      { ad: "Su Sebili ve Arıtma", slug: "su-aritma", g: 765 },
      { ad: "Ekmek Yapma Makinesi", slug: "ekmek-yapma-makinesi", g: 730 }
    ] },
    { ad: "Kişisel Bakım Aletleri", slug: "kisisel-bakim-aletleri", g: 2915, alt: [
      { ad: "Saç Kurutma Makinesi", slug: "sac-kurutma-makinesi", g: 490 },
      { ad: "Saç Düzleştirici", slug: "sac-duzlestirici", g: 3407 },
      { ad: "Tıraş Makinesi", slug: "tiras-makinesi", g: 532 },
      { ad: "Epilasyon Cihazı", slug: "epilasyon", g: 4510 },
      { ad: "Elektrikli Diş Fırçası", slug: "elektrikli-dis-fircasi", g: 2915 },
      { ad: "Tartı", slug: "tarti", g: 2915 }
    ] },
    { ad: "Ütü ve Dikiş", slug: "utu-dikis", g: 2706, alt: [
      { ad: "Ütü", slug: "utu", g: 5139 },
      { ad: "Buhar Kazanlı Ütü", slug: "buhar-kazanli-utu", g: 5139 },
      { ad: "Dikiş Makinesi", slug: "dikis-makinesi", g: 615 }
    ] }
  ] },
  { ad: "Ev, Dekorasyon ve Mutfak", slug: "ev-dekorasyon-mutfak", g: 536, alt: [
    { ad: "Mutfak Gereçleri", slug: "mutfak-gerecleri", g: 638, alt: [
      { ad: "Tencere ve Tava", slug: "tencere-tava", g: 654 },
      { ad: "Yemek Takımı", slug: "yemek-takimi", g: 673 },
      { ad: "Çatal Bıçak Takımı", slug: "catal-bicak", g: 675 },
      { ad: "Bardak ve Kupa", slug: "bardak-kupa", g: 674 },
      { ad: "Saklama Kabı", slug: "saklama-kabi", g: 667 },
      { ad: "Çaydanlık ve Demlik", slug: "caydanlik", g: 638 },
      { ad: "Bıçak ve Doğrama", slug: "bicak", g: 665 }
    ] },
    { ad: "Ev Tekstili", slug: "ev-tekstili", g: 4171, alt: [
      { ad: "Nevresim Takımı", slug: "nevresim", g: 2541 },
      { ad: "Yorgan ve Battaniye", slug: "yorgan-battaniye", g: 1985 },
      { ad: "Yastık", slug: "yastik", g: 2700 },
      { ad: "Havlu ve Bornoz", slug: "havlu-bornoz", g: 4077 },
      { ad: "Halı", slug: "hali", g: 598 },
      { ad: "Perde", slug: "perde", g: 2882 }
    ] },
    { ad: "Dekorasyon", slug: "dekorasyon", g: 696, alt: [
      { ad: "Duvar Dekorasyonu ve Tablo", slug: "tablo-duvar-dekoru", g: 9 },
      { ad: "Ayna", slug: "ayna", g: 595 },
      { ad: "Duvar Saati", slug: "duvar-saati", g: 3890 },
      { ad: "Vazo ve Yapay Çiçek", slug: "vazo-yapay-cicek", g: 602 },
      { ad: "Mum ve Oda Kokusu", slug: "mum-oda-kokusu", g: 588 },
      { ad: "Kırlent ve Minder", slug: "kirlent", g: 4454 }
    ] },
    { ad: "Aydınlatma", slug: "aydinlatma", g: 594, alt: [
      { ad: "Avize", slug: "avize", g: 2524 },
      { ad: "Lambader", slug: "lambader", g: 594 },
      { ad: "Masa Lambası", slug: "masa-lambasi", g: 594 },
      { ad: "Ampul", slug: "ampul", g: 2425 },
      { ad: "Şerit LED", slug: "serit-led", g: 2608 }
    ] },
    { ad: "Banyo", slug: "banyo", g: 574, alt: [
      { ad: "Banyo Dolabı", slug: "banyo-dolabi", g: 574 },
      { ad: "Duş Seti", slug: "dus-seti", g: 581 },
      { ad: "Banyo Aksesuarı", slug: "banyo-aksesuari", g: 574 }
    ] },
    { ad: "Ev Düzenleme ve Temizlik", slug: "ev-duzenleme-ve-temizlik", g: 630, alt: [
      { ad: "Çamaşır Kurutmalık", slug: "camasir-kurutmalik", g: 630 },
      { ad: "Düzenleyici ve Kutu", slug: "duzenleyici-kutu", g: 636 },
      { ad: "Temizlik Gereçleri", slug: "temizlik-gerecleri", g: 623 },
      { ad: "Ütü Masası", slug: "utu-masasi", g: 633 }
    ] }
  ] },
  { ad: "Mobilya", slug: "mobilya", g: 436, alt: [
    { ad: "Oturma Odası", slug: "oturma-odasi", g: 436, alt: [
      { ad: "Koltuk Takımı", slug: "koltuk-takimi", g: 460 },
      { ad: "Köşe Koltuk", slug: "kose-koltuk", g: 460 },
      { ad: "Tekli Koltuk ve Berjer", slug: "berjer", g: 443 },
      { ad: "TV Ünitesi", slug: "tv-unitesi", g: 457 },
      { ad: "Orta Sehpa", slug: "orta-sehpa", g: 1395 },
      { ad: "Kitaplık", slug: "kitaplik", g: 465 }
    ] },
    { ad: "Yatak Odası", slug: "yatak-odasi", g: 6433, alt: [
      { ad: "Yatak", slug: "yatak", g: 2696 },
      { ad: "Karyola ve Baza", slug: "baza-karyola", g: 505764 },
      { ad: "Gardırop", slug: "gardirop", g: 4063 },
      { ad: "Şifonyer ve Komodin", slug: "komodin", g: 462 }
    ] },
    { ad: "Yemek Odası ve Mutfak", slug: "yemek-odasi", g: 6392, alt: [
      { ad: "Yemek Masası", slug: "yemek-masasi", g: 4355 },
      { ad: "Sandalye", slug: "sandalye", g: 5886 },
      { ad: "Bar Taburesi", slug: "bar-taburesi", g: 1463 }
    ] },
    { ad: "Çalışma Odası", slug: "calisma-odasi", g: 6362, alt: [
      { ad: "Çalışma Masası", slug: "calisma-masasi", g: 4191 },
      { ad: "Ofis Koltuğu", slug: "ofis-koltugu", g: 2045 },
      { ad: "Dosya Dolabı", slug: "dosya-dolabi", g: 6362 }
    ] },
    { ad: "Bebek ve Genç Odası", slug: "bebek-genc-odasi", g: 554, alt: [
      { ad: "Bebek Beşiği", slug: "besik", g: 6394 },
      { ad: "Çocuk Odası Takımı", slug: "cocuk-odasi-takimi", g: 554 }
    ] },
    { ad: "Bahçe Mobilyası", slug: "bahce-mobilyasi", g: 4299, alt: [
      { ad: "Bahçe Takımı", slug: "bahce-takimi", g: 6367 },
      { ad: "Şezlong", slug: "sezlong", g: 4105 },
      { ad: "Salıncak", slug: "bahce-salincagi", g: 4299 }
    ] }
  ] },
  { ad: "Yapı Market, Bahçe ve El Aletleri", slug: "yapi-market-bahce", g: 632, alt: [
    { ad: "Elektrikli El Aletleri", slug: "elektrikli-el-aletleri", g: 1167, alt: [
      { ad: "Akülü Vidalama", slug: "akulu-vidalama", g: 1217 },
      { ad: "Darbeli Matkap", slug: "darbeli-matkap", g: 1217 },
      { ad: "Kırıcı Delici", slug: "kirici-delici", g: 1167 },
      { ad: "Taşlama Makinesi", slug: "taslama", g: 1219 },
      { ad: "Dekupaj Testere", slug: "dekupaj", g: 3725 },
      { ad: "Daire Testere", slug: "daire-testere", g: 1167 },
      { ad: "Zımpara Makinesi", slug: "zimpara-makinesi", g: 1188 },
      { ad: "Kaynak Makinesi", slug: "kaynak-makinesi", g: 1167 },
      { ad: "Kompresör", slug: "kompresor", g: 1167 },
      { ad: "Basınçlı Yıkama Makinesi", slug: "basincli-yikama", g: 1226 }
    ] },
    { ad: "El Aletleri", slug: "el-aletleri", g: 1167, alt: [
      { ad: "Alet Çantası ve Seti", slug: "alet-seti", g: 4919 },
      { ad: "Tornavida", slug: "tornavida", g: 1203 },
      { ad: "Pense ve Kerpeten", slug: "pense", g: 1958 },
      { ad: "Anahtar Takımı", slug: "anahtar-takimi", g: 1632 },
      { ad: "Çekiç", slug: "cekic", g: 1186 },
      { ad: "Ölçüm Aletleri", slug: "olcum-aletleri", g: 1305 },
      { ad: "Lazer Metre ve Hizalama", slug: "lazer-metre", g: 1305 }
    ] },
    { ad: "Elektrik Malzemeleri", slug: "elektrik-malzemeleri", g: 127, alt: [
      { ad: "Uzatma Kablosu ve Priz", slug: "uzatma-kablosu", g: 3160 },
      { ad: "Jeneratör", slug: "jenerator", g: 1218 },
      { ad: "Solar Panel", slug: "solar-panel", g: 4714 },
      { ad: "Akü ve Pil", slug: "aku-pil", g: 276 }
    ] },
    { ad: "Boya ve Yapı Malzemeleri", slug: "boya-ve-yapi-malzemeleri", g: 115, alt: [
      { ad: "Duvar Boyası", slug: "duvar-boyasi", g: 1361 },
      { ad: "Silikon ve Yapıştırıcı", slug: "silikon-yapistirici", g: 115 },
      { ad: "Fayans ve Parke", slug: "fayans-parke", g: 2826 }
    ] },
    { ad: "Tesisat ve Hırdavat", slug: "tesisat-hirdavat", g: 133, alt: [
      { ad: "Batarya ve Musluk", slug: "batarya-musluk", g: 2032 },
      { ad: "Hidrofor ve Pompa", slug: "hidrofor-pompa", g: 500096 },
      { ad: "Kilit ve Kapı Donanımı", slug: "kilit", g: 1974 }
    ] },
    { ad: "Bahçe", slug: "bahce", g: 689, alt: [
      { ad: "Çim Biçme Makinesi", slug: "cim-bicme-makinesi", g: 694 },
      { ad: "Tırpan ve Çit Budama", slug: "tirpan-cit-budama", g: 3120 },
      { ad: "Bahçe Hortumu ve Sulama", slug: "sulama", g: 3568 },
      { ad: "Barbekü ve Mangal", slug: "mangal-barbeku", g: 689 },
      { ad: "Saksı ve Tohum", slug: "saksi-tohum", g: 721 }
    ] }
  ] },
  { ad: "Süpermarket", slug: "supermarket", g: 412, alt: [
    { ad: "Temel Gıda", slug: "temel-gida", g: 422, alt: [
      { ad: "Yağ", slug: "yag", g: 2126 },
      { ad: "Bakliyat ve Pirinç", slug: "bakliyat-pirinc", g: 4682 },
      { ad: "Makarna", slug: "makarna", g: 434 },
      { ad: "Un ve Şeker", slug: "un-seker", g: 2775 },
      { ad: "Salça ve Konserve", slug: "salca-konserve", g: 5798 },
      { ad: "Baharat", slug: "baharat", g: 4608 }
    ] },
    { ad: "Kahvaltılık", slug: "kahvaltilik", g: 422, alt: [
      { ad: "Peynir", slug: "peynir", g: 429 },
      { ad: "Zeytin", slug: "zeytin", g: 5760 },
      { ad: "Bal ve Reçel", slug: "bal-recel", g: 4947 },
      { ad: "Kahvaltılık Gevrek", slug: "kahvaltilik-gevrek", g: 4689 }
    ] },
    { ad: "Atıştırmalık", slug: "atistirmalik", g: 423, alt: [
      { ad: "Çikolata ve Şekerleme", slug: "cikolata", g: 4748 },
      { ad: "Bisküvi ve Kraker", slug: "biskuvi", g: 2229 },
      { ad: "Cips ve Kuruyemiş", slug: "kuruyemis-cips", g: 433 }
    ] },
    { ad: "İçecek", slug: "icecek", g: 413, alt: [
      { ad: "Çay", slug: "cay", g: 2073 },
      { ad: "Kahve", slug: "kahve", g: 1868 },
      { ad: "Su ve Maden Suyu", slug: "su", g: 420 },
      { ad: "Meşrubat ve Meyve Suyu", slug: "mesrubat", g: 2628 }
    ] },
    { ad: "Ev Temizlik Ürünleri", slug: "ev-temizlik-urunleri", g: 623, alt: [
      { ad: "Çamaşır Deterjanı", slug: "camasir-deterjani", g: 2754 },
      { ad: "Bulaşık Deterjanı", slug: "bulasik-deterjani", g: 4975 },
      { ad: "Yüzey Temizleyici", slug: "yuzey-temizleyici", g: 7330 },
      { ad: "Kağıt Havlu ve Tuvalet Kağıdı", slug: "kagit-urunleri", g: 629 },
      { ad: "Çöp Torbası", slug: "cop-torbasi", g: 623 }
    ] }
  ] },
  { ad: "Anne, Bebek ve Oyuncak", slug: "anne-bebek-oyuncak", g: 537, alt: [
    { ad: "Bebek Bezi ve Islak Mendil", slug: "bebek-bezi", g: 548, alt: [
      { ad: "Bebek Bezi", slug: "bebek-bezi-paket", g: 551 },
      { ad: "Islak Mendil", slug: "islak-mendil", g: 553 }
    ] },
    { ad: "Bebek Beslenme", slug: "bebek-beslenme", g: 561, alt: [
      { ad: "Mama", slug: "mama", g: 562 },
      { ad: "Biberon ve Emzik", slug: "biberon-emzik", g: 564 },
      { ad: "Göğüs Pompası", slug: "gogus-pompasi", g: 565 },
      { ad: "Mama Sandalyesi", slug: "mama-sandalyesi", g: 559 }
    ] },
    { ad: "Bebek Taşıma", slug: "bebek-tasima", g: 2764, alt: [
      { ad: "Bebek Arabası", slug: "bebek-arabasi", g: 568 },
      { ad: "Oto Koltuğu", slug: "oto-koltugu", g: 547 },
      { ad: "Kanguru ve Ana Kucağı", slug: "kanguru", g: 538 }
    ] },
    { ad: "Bebek Bakım ve Güvenlik", slug: "bebek-bakim", g: 5252, alt: [
      { ad: "Bebek Telsizi ve Kamerası", slug: "bebek-telsizi", g: 541 },
      { ad: "Bebek Banyo", slug: "bebek-banyo", g: 4678 },
      { ad: "Ateş Ölçer", slug: "ates-olcer", g: 501 }
    ] },
    { ad: "Oyuncak", slug: "oyuncak", g: 1253, alt: [
      { ad: "Lego ve Yapı Oyuncakları", slug: "yapi-oyuncaklari", g: 1254 },
      { ad: "Oyuncak Bebek", slug: "oyuncak-bebek", g: 1257 },
      { ad: "Uzaktan Kumandalı Oyuncak", slug: "uzaktan-kumandali", g: 2546 },
      { ad: "Eğitici Oyuncak", slug: "egitici-oyuncak", g: 1262 },
      { ad: "Akülü Araba", slug: "akulu-araba", g: 1253 },
      { ad: "Kutu Oyunu", slug: "kutu-oyunu", g: 1246 },
      { ad: "Puzzle", slug: "puzzle", g: 2618 }
    ] }
  ] },
  { ad: "Kozmetik ve Kişisel Bakım", slug: "kozmetik-kisisel-bakim", g: 469, alt: [
    { ad: "Parfüm", slug: "parfum", g: 479, alt: [
      { ad: "Kadın Parfüm", slug: "kadin-parfum", g: 479 },
      { ad: "Erkek Parfüm", slug: "erkek-parfum", g: 479 },
      { ad: "Deodorant", slug: "deodorant", g: 484 }
    ] },
    { ad: "Makyaj", slug: "makyaj", g: 477, alt: [
      { ad: "Fondöten ve Kapatıcı", slug: "fondoten", g: 2765 },
      { ad: "Ruj", slug: "ruj", g: 3021 },
      { ad: "Maskara", slug: "maskara", g: 2834 },
      { ad: "Oje", slug: "oje", g: 2683 }
    ] },
    { ad: "Cilt Bakımı", slug: "cilt-bakimi", g: 567, alt: [
      { ad: "Yüz Kremi", slug: "yuz-kremi", g: 2592 },
      { ad: "Güneş Kremi", slug: "gunes-kremi", g: 2844 },
      { ad: "Yüz Temizleyici", slug: "yuz-temizleyici", g: 2526 },
      { ad: "Serum", slug: "serum", g: 567 }
    ] },
    { ad: "Saç Bakımı", slug: "sac-bakimi", g: 486, alt: [
      { ad: "Şampuan", slug: "sampuan", g: 2441 },
      { ad: "Saç Boyası", slug: "sac-boyasi", g: 2814 },
      { ad: "Saç Şekillendirici", slug: "sac-sekillendirici", g: 1901 }
    ] },
    { ad: "Ağız ve Diş Bakımı", slug: "agiz-dis-bakimi", g: 526, alt: [
      { ad: "Diş Macunu", slug: "dis-macunu", g: 1360 },
      { ad: "Diş Fırçası", slug: "dis-fircasi", g: 527 }
    ] },
    { ad: "Sağlık", slug: "saglik", g: 491, alt: [
      { ad: "Tansiyon Aleti", slug: "tansiyon-aleti", g: 495 },
      { ad: "Vitamin ve Takviye", slug: "vitamin", g: 525 },
      { ad: "Masaj Aleti", slug: "masaj-aleti", g: 471 },
      { ad: "Lens ve Solüsyon", slug: "lens", g: 2923 }
    ] }
  ] },
  { ad: "Giyim, Ayakkabı ve Aksesuar", slug: "giyim-ayakkabi-aksesuar", g: 166, alt: [
    { ad: "Kadın Giyim", slug: "kadin-giyim", g: 1604, alt: [
      { ad: "Elbise", slug: "elbise", g: 2271 },
      { ad: "Kadın Mont ve Kaban", slug: "kadin-mont", g: 203 },
      { ad: "Kadın Pantolon ve Jean", slug: "kadin-pantolon", g: 204 }
    ] },
    { ad: "Erkek Giyim", slug: "erkek-giyim", g: 1604, alt: [
      { ad: "Erkek Mont ve Kaban", slug: "erkek-mont", g: 203 },
      { ad: "Erkek Gömlek", slug: "erkek-gomlek", g: 212 },
      { ad: "Erkek Pantolon ve Jean", slug: "erkek-pantolon", g: 204 }
    ] },
    { ad: "Ayakkabı", slug: "ayakkabi", g: 187, alt: [
      { ad: "Spor Ayakkabı", slug: "spor-ayakkabi", g: 187 },
      { ad: "Bot ve Çizme", slug: "bot-cizme", g: 187 },
      { ad: "Klasik Ayakkabı", slug: "klasik-ayakkabi", g: 187 }
    ] },
    { ad: "Saat ve Takı", slug: "saat-taki", g: 188, alt: [
      { ad: "Kol Saati", slug: "kol-saati", g: 201 },
      { ad: "Altın", slug: "altin", g: 188 },
      { ad: "Gümüş Takı", slug: "gumus-taki", g: 188 }
    ] },
    { ad: "Çanta ve Valiz", slug: "canta-valiz", g: 5181, alt: [
      { ad: "Sırt Çantası", slug: "sirt-cantasi", g: 100 },
      { ad: "Valiz", slug: "valiz", g: 107 },
      { ad: "El Çantası", slug: "el-cantasi", g: 3032 },
      { ad: "Cüzdan", slug: "cuzdan", g: 2668 }
    ] },
    { ad: "Gözlük", slug: "gozluk", g: 178, alt: [
      { ad: "Güneş Gözlüğü", slug: "gunes-gozlugu", g: 178 }
    ] }
  ] },
  { ad: "Spor ve Outdoor", slug: "spor-ve-outdoor", g: 988, alt: [
    { ad: "Fitness", slug: "fitness", g: 990, alt: [
      { ad: "Koşu Bandı", slug: "kosu-bandi", g: 997 },
      { ad: "Kondisyon Bisikleti", slug: "kondisyon-bisikleti", g: 994 },
      { ad: "Dambıl ve Ağırlık", slug: "dambil", g: 3164 },
      { ad: "Pilates ve Yoga", slug: "yoga-pilates", g: 999 }
    ] },
    { ad: "Bisiklet ve Scooter", slug: "bisiklet-scooter", g: 1025, alt: [
      { ad: "Bisiklet", slug: "bisiklet", g: 1026 },
      { ad: "Elektrikli Bisiklet", slug: "elektrikli-bisiklet", g: 1026 },
      { ad: "Elektrikli Scooter", slug: "elektrikli-scooter", g: 5879 },
      { ad: "Kask", slug: "kask", g: 1029 }
    ] },
    { ad: "Kamp ve Outdoor", slug: "kamp-outdoor", g: 1013, alt: [
      { ad: "Çadır", slug: "cadir", g: 1022 },
      { ad: "Uyku Tulumu", slug: "uyku-tulumu", g: 1020 },
      { ad: "Kamp Sandalyesi", slug: "kamp-sandalyesi", g: 1014 },
      { ad: "Termos", slug: "termos", g: 3800 },
      { ad: "Avcılık ve Balıkçılık", slug: "balikcilik", g: 3334 }
    ] },
    { ad: "Takım Sporları", slug: "takim-sporlari", g: 988, alt: [
      { ad: "Futbol Topu", slug: "futbol-topu", g: 1112 },
      { ad: "Basketbol", slug: "basketbol", g: 1081 }
    ] },
    { ad: "Sporcu Besini", slug: "sporcu-besini", g: 5723, alt: [
      { ad: "Protein Tozu", slug: "protein-tozu", g: 525 }
    ] }
  ] },
  { ad: "Otomotiv ve Motosiklet", slug: "otomotiv", g: 888, alt: [
    { ad: "Oto Elektronik", slug: "oto-elektronik", g: 8526, alt: [
      { ad: "Araç Kamerası", slug: "arac-kamerasi", g: 8526 },
      { ad: "Oto Teyp ve Multimedya", slug: "oto-teyp", g: 8526 },
      { ad: "Navigasyon", slug: "navigasyon", g: 339 }
    ] },
    { ad: "Oto Bakım", slug: "oto-bakim", g: 913, alt: [
      { ad: "Motor Yağı", slug: "motor-yagi", g: 1753 },
      { ad: "Oto Lastik", slug: "oto-lastik", g: 913 },
      { ad: "Akü", slug: "oto-aku", g: 913 },
      { ad: "Silecek", slug: "silecek", g: 913 }
    ] },
    { ad: "Oto Aksesuar", slug: "oto-aksesuar", g: 5613, alt: [
      { ad: "Araç İçi Telefon Tutucu", slug: "arac-ici-tutucu", g: 5566 },
      { ad: "Oto Paspas ve Kılıf", slug: "oto-paspas", g: 5613 }
    ] },
    { ad: "Motosiklet", slug: "motosiklet-urunleri", g: 1267, alt: [
      { ad: "Motosiklet Kaskı", slug: "motosiklet-kaski", g: 2110 },
      { ad: "Motosiklet Ekipmanı", slug: "motosiklet-ekipmani", g: 5547 }
    ] }
  ] },
  { ad: "Kitap, Müzik ve Hobi", slug: "kitap-muzik-hobi", g: 783, alt: [
    { ad: "Kitap", slug: "kitap", g: 784, alt: [
      { ad: "Roman", slug: "roman", g: 784 },
      { ad: "Çocuk Kitapları", slug: "cocuk-kitaplari", g: 784 },
      { ad: "Sınav ve Eğitim Kitapları", slug: "egitim-kitaplari", g: 784 }
    ] },
    { ad: "Müzik Aletleri", slug: "muzik-aletleri", g: 54, alt: [
      { ad: "Gitar", slug: "gitar", g: 80 },
      { ad: "Piyano ve Klavye", slug: "piyano", g: 76 },
      { ad: "Bağlama ve Saz", slug: "baglama", g: 77 }
    ] },
    { ad: "Hobi ve Sanat", slug: "hobi-sanat", g: 5710, alt: [
      { ad: "Boya ve Resim Malzemeleri", slug: "resim-malzemeleri", g: 505372 },
      { ad: "Maket ve Puzzle", slug: "maket", g: 5999 },
      { ad: "Elektronik Hobi ve Robotik", slug: "elektronik-hobi", g: 3702 }
    ] }
  ] },
  { ad: "Pet Shop", slug: "pet-shop", g: 2, alt: [
    { ad: "Kedi", slug: "kedi", g: 4, alt: [
      { ad: "Kedi Maması", slug: "kedi-mamasi", g: 3367 },
      { ad: "Kedi Kumu", slug: "kedi-kumu", g: 4999 },
      { ad: "Kedi Tırmalama ve Oyuncak", slug: "kedi-oyuncak", g: 5001 }
    ] },
    { ad: "Köpek", slug: "kopek", g: 5, alt: [
      { ad: "Köpek Maması", slug: "kopek-mamasi", g: 3530 },
      { ad: "Köpek Tasması ve Gezdirme", slug: "kopek-tasmasi", g: 6249 }
    ] },
    { ad: "Kuş ve Akvaryum", slug: "kus-akvaryum", g: 6, alt: [
      { ad: "Akvaryum", slug: "akvaryum", g: 3238 },
      { ad: "Kuş Yemi ve Kafes", slug: "kus", g: 3 }
    ] }
  ] },
  { ad: "Ofis ve Kırtasiye", slug: "ofis-kirtasiye", g: 922, alt: [
    { ad: "Kırtasiye", slug: "kirtasiye", g: 932, alt: [
      { ad: "Kalem", slug: "kalem", g: 977 },
      { ad: "Defter ve Ajanda", slug: "defter-ajanda", g: 961 },
      { ad: "Okul Çantası", slug: "okul-cantasi", g: 100 },
      { ad: "Fotokopi Kağıdı", slug: "fotokopi-kagidi", g: 962 }
    ] },
    { ad: "Ofis Ekipmanları", slug: "ofis-ekipmanlari", g: 950, alt: [
      { ad: "Hesap Makinesi", slug: "hesap-makinesi", g: 333 },
      { ad: "Laminasyon ve Ciltleme", slug: "laminasyon", g: 1625 },
      { ad: "Evrak İmha Makinesi", slug: "evrak-imha", g: 953 },
      { ad: "Etiket Yazıcı", slug: "etiket-yazici", g: 952 }
    ] }
  ] }
];
