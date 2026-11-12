-- Fiyat Dürbün veritabanı şeması (PostgreSQL / Supabase)
-- Katalog (kategori, özellik, ürün) mağaza tekliflerinden ayrı tutulur:
-- bir ürün = bir sayfa; her mağazanın o ürün için verdiği fiyat = bir teklif.

create table if not exists kategori (
  id          serial primary key,
  slug        text unique not null,           -- akilli-telefon
  ad          text not null,                  -- Akıllı Telefon
  ust_id      int references kategori(id),    -- ağaç: Elektronik > Telefon > Akıllı Telefon
  aciklama    text
);

-- Kategoriye özel özellikler = filtreler. Yeni kategori eklemek kod değil veri işidir.
create table if not exists ozellik (
  id          serial primary key,
  kategori_id int not null references kategori(id),
  anahtar     text not null,                  -- ram_gb
  ad          text not null,                  -- RAM
  tur         text not null check (tur in ('sayi','secim','evet_hayir','metin')),
  birim       text,                           -- GB, mAh, inç
  filtre      text not null default 'yok' check (filtre in ('aralik','coklu','evet_hayir','yok')),
  sira        int not null default 0,
  grup        text,                           -- Ekran, Kamera, Pil… (ürün sayfasındaki tablo grupları)
  unique (kategori_id, anahtar)
);

create table if not exists marka (
  id    serial primary key,
  slug  text unique not null,
  ad    text not null
);

-- Ürün: üreticinin tek bir satılabilir varyantı (ör. iPhone 16 128 GB). Renkler aynı üründe toplanır.
create table if not exists urun (
  id          serial primary key,
  kategori_id int not null references kategori(id),
  marka_id    int not null references marka(id),
  model       text not null,                  -- iPhone 16
  varyant     text,                           -- 128 GB
  slug        text unique not null,
  gtin        text[] not null default '{}',   -- barkodlar (renk başına farklı olabilir)
  ozellikler  jsonb not null default '{}',    -- {"ram_gb":8,"depolama_gb":128,"5g":true,…}
  gorsel      text,
  cikis_yili  int,
  eslesme_anahtari text not null,             -- normalize marka+model+varyant, eşleştirme için
  olusturma   timestamptz not null default now()
);
create index if not exists urun_kategori on urun(kategori_id);
create index if not exists urun_ozellik on urun using gin (ozellikler);
create index if not exists urun_eslesme on urun(eslesme_anahtari);

create table if not exists magaza (
  id          serial primary key,
  slug        text unique not null,
  ad          text not null,
  site        text not null,
  besleme_url text,                           -- XML ürün beslemesi
  guven_puani numeric(2,1),                   -- 0-5
  kargo_bedava_esik numeric(12,2),            -- bu tutarın üstü ücretsiz kargo
  kargo_ucret numeric(12,2) not null default 0,
  aktif       boolean not null default true,
  son_okuma   timestamptz,
  -- Güvenilirlik: küçük mağaza da olur ama yayına almadan önce kontrol edilir.
  unvan        text,                           -- ticari unvan
  vergi_no     text,
  mersis_no    text,
  etbis        boolean,                        -- Ticaret Bakanlığı ETBİS kaydı doğrulandı mı
  adres        text,
  telefon      text,
  iade_gun     int,                            -- cayma/iade süresi
  yetkili_satici text,                         -- ör. "Apple Premium Partner", "Samsung yetkili"
  sikayet_puani numeric(3,1),                  -- Şikayetvar memnuniyet / çözüm puanı (elle girilir)
  guven_notu   text,                           -- kontrol eden kişinin notu
  guven_kontrol timestamptz,                   -- son kontrol tarihi
  durum        text not null default 'inceleniyor' check (durum in ('inceleniyor','onayli','uyari','kapali'))
);

-- Teklif: bir mağazanın bir ürün için güncel fiyatı.
create table if not exists teklif (
  id           serial primary key,
  urun_id      int references urun(id),       -- null = henüz eşleşmedi (inceleme kuyruğu)
  magaza_id    int not null references magaza(id),
  magaza_kodu  text not null,                 -- mağazanın kendi ürün kodu
  baslik       text not null,                 -- mağazadaki ham ürün adı
  url          text not null,
  fiyat        numeric(12,2) not null,        -- satış fiyatı (KDV dahil)
  liste_fiyati numeric(12,2),                 -- mağazanın "indirimden önce" dediği fiyat
  kargo        numeric(12,2),                 -- null = mağaza kuralı uygulanır
  taksit_max   int,
  stokta       boolean not null default true,
  gtin         text,
  renk         text,
  satici       text,                          -- pazaryerinde asıl satıcı
  garanti      text,                          -- distribütör / ithalatçı / yurt dışı…
  ozellik_ham  jsonb,                         -- mağazanın teknik özellik tablosu (ham)
  guncelleme   timestamptz not null default now(),
  unique (magaza_id, magaza_kodu)
);
create index if not exists teklif_urun on teklif(urun_id);

-- Fiyat geçmişi: günde mağaza başına en düşük fiyat. Siteye kopyalanamaz değer katan veri budur.
create table if not exists fiyat_gecmisi (
  urun_id   int not null references urun(id),
  magaza_id int not null references magaza(id),
  gun       date not null,
  fiyat     numeric(12,2) not null,
  primary key (urun_id, magaza_id, gun)
);
create index if not exists fiyat_gecmisi_urun_gun on fiyat_gecmisi(urun_id, gun);

-- Eşleşmeyen teklifler için inceleme kuyruğu (kural + yapay zekâ önerisi)
create table if not exists eslesme_kuyrugu (
  teklif_id   int primary key references teklif(id),
  oneri_urun  int references urun(id),
  guven       numeric(3,2),
  neden       text,
  olusturma   timestamptz not null default now()
);

create table if not exists tiklama (
  id        bigserial primary key,
  teklif_id int not null references teklif(id),
  zaman     timestamptz not null default now(),
  kaynak    text                              -- urun-sayfasi, kategori, alarm-epostasi
);

-- Üyelik: e-postayla şifresiz giriş (bağlantı gönderilir)
create table if not exists uye (
  id         serial primary key,
  eposta     text unique not null,
  ad         text,
  olusturma  timestamptz not null default now(),
  son_giris  timestamptz
);

create table if not exists giris_jetonu (
  jeton_ozet text primary key,                -- jetonun SHA-256 özeti (jetonun kendisi saklanmaz)
  eposta     text not null,
  son        timestamptz not null,
  kullanildi timestamptz
);

-- Takip: üye bir ürünü takip eder; fiyat düşünce ya da hedefin altına inince bildirilir.
create table if not exists takip (
  uye_id     int not null references uye(id) on delete cascade,
  urun_id    int not null references urun(id),
  hedef      numeric(12,2),                   -- null = her düşüşte haber ver
  eklenme_fiyati numeric(12,2),
  son_bildirilen numeric(12,2),
  son_bildirim timestamptz,
  olusturma  timestamptz not null default now(),
  primary key (uye_id, urun_id)
);

create table if not exists bildirim (
  id        bigserial primary key,
  uye_id    int not null references uye(id) on delete cascade,
  urun_id   int not null references urun(id),
  eski      numeric(12,2),
  yeni      numeric(12,2) not null,
  magaza_id int references magaza(id),
  kanal     text not null default 'eposta',
  durum     text not null default 'bekliyor',  -- bekliyor / gonderildi / hata
  zaman     timestamptz not null default now()
);
