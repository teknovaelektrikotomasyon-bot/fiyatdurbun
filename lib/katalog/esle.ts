// Mağazanın kategori yolu ("Ev & Yaşam > Mutfak > Tencere Setleri") ve ürün adı → bizim kategori ağacındaki yer.
// Anahtar kelimeler kategori adlarından otomatik çıkarılır, eş anlamlılar elle eklenir. Mağaza yalnızca kendisine
// izin verilen ana bölümlere eşlenebilir (ör. pet mağazası → Pet Shop); bu, yanlış eşleşmeyi büyük ölçüde önler.
// Emin olunamazsa (puan eşiğin altında) null döner; ürün yanlış kategoriye konmaz, atlanır.
import { KATEGORI_AGACI, type KategoriDugumu } from "./agac.ts";

export const duzMetin = (s: string) =>
  s.toLocaleLowerCase("tr").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ").trim();

// Kategori adlarında olmayan ama mağazalarda sık geçen karşılıklar (slug → ek kelimeler).
const ES_ANLAMLI: Record<string, string[]> = {
  "kopek-oyuncak": ["kopek oyuncagi", "kopek oyuncaklari", "isirma oyuncagi", "kong", "kopek topu", "halat oyuncak"],
  "kopek-odul": ["kopek odul", "kopek odulu", "kopek kemigi", "cigneme kemigi", "kopek bisküvisi", "kopek biskuvisi", "dental stick"],
  "kopek-kiyafet": ["kopek yagmurlugu", "kopek montu", "kopek kazagi", "kopek kiyafeti", "kopek ayakkabisi", "kopek kulotu"],
  "kedi-tuvaleti": ["kedi tuvaleti", "kapali kedi tuvaleti", "kum kabi", "kum kuregi"],
  "kedi-odul": ["kedi odulu", "kedi odul", "kedi corbasi", "kedi krema", "sivi odul", "catnip"],
  "mama-su-kabi": ["mama kabi", "su kabi", "mama ve su kabi", "otomatik mamalik", "su pinari", "suluk"],
  "pet-vitamin": ["kedi vitamini", "kopek vitamini", "pet vitamin", "malt macunu", "biotin", "sakinlestirici sprey", "pire", "kene", "diş temizleme suyu", "dis temizleme"],
  "orta-sehpa": ["sehpa", "kahve sehpasi", "yan sehpa", "zigon sehpa", "orta sehpa"],
  "bebek-cilt-bakimi": ["bebek kremi", "bebek yagi", "bebek losyonu", "bebek sampuani", "pisik kremi", "bebek kolonyasi", "bebek bakim sutu", "bebek masaj yagi", "baby cream", "baby oil"],
  "gelistirme-karti": ["arduino", "raspberry pi", "esp32", "esp8266", "stm32", "deneyap", "micro bit", "microbit", "pico", "nodemcu", "gelistirme kartlari", "mikrodenetleyici"],
  "sensor-modul": ["sensor", "sensorler", "modul", "moduller", "role", "role karti", "lcd ekran", "oled", "rfid", "gps modul", "bluetooth modul", "wifi modul", "kamera modulu"],
  "motor-surucu": ["servo", "servo motor", "step motor", "dc motor", "motor surucu", "redektorlu motor", "motor driver", "esc"],
  "robot-kiti": ["robot kiti", "robot kitleri", "stem", "egitim seti", "kodlama seti", "robotik set", "lego education", "mbot"],
  "elektronik-komponent": ["direnc", "kondansator", "transistor", "diyot", "led", "entegre", "potansiyometre", "buton", "regulator", "mosfet", "komponent", "pasif komponent", "yari iletken"],
  "prototip-malzemesi": ["breadboard", "jumper", "jumper kablo", "pertinaks", "delikli plaket", "header", "konnektor", "klemens"],
  "lehim-olcum": ["lehim", "havya", "lehim istasyonu", "multimetre", "osiloskop", "olcu aleti", "pens ampermetre", "guc kaynagi laboratuvar"],
  "robotik-guc": ["lipo", "li ion", "18650", "pil", "batarya", "pil yuvasi", "voltaj regulatoru", "buck", "boost", "sarj modulu"],
  "3d-filament": ["filament", "pla filament", "abs filament", "petg", "3d yazici parca", "nozzle", "hotend"],
  "drone-rc-parca": ["drone", "pervane", "ucus kontrol karti", "fpv", "rc araba", "kumanda alici"],
  "akilli-telefon": ["cep telefonu", "android telefon", "ios telefon", "iphone"],
  "dizustu-bilgisayar": ["laptop", "notebook"],
  "masaustu-bilgisayar": ["hazir sistem", "masaustu pc"],
  "ekran-karti": ["grafik karti", "gpu"],
  "islemci": ["cpu"],
  "ram-bellek": ["ram", "bellek"],
  "ssd": ["m 2 ssd", "nvme"],
  "guc-kaynagi": ["psu", "power supply"],
  "bilgisayar-kasasi": ["kasa"],
  "islemci-sogutucu": ["sivi sogutma", "fan"],
  "monitor": ["oyuncu monitoru"],
  "mouse": ["fare"],
  "oyuncu-koltugu": ["oyuncu koltugu", "gaming koltuk"],
  "kulaklik": ["kulak ustu", "kulak ici"],
  "bulasik-makinesi": ["bulasik makineleri"],
  "camasir-makinesi": ["camasir makineleri"],
  "kurutma-makinesi": ["kurutma makineleri"],
  "firin": ["ankastre firin"],
  "ocak": ["ankastre ocak"],
  "davlumbaz": ["aspirator", "davlumbazlar"],
  "elektrikli-supurge": ["toz torbali", "torbasiz supurge"],
  "kahve-makinesi": ["espresso", "filtre kahve makinesi", "turk kahvesi makinesi"],
  "blender-mutfak-robotu": ["el blender", "rondo", "dograyici"],
  "tencere-tava": ["tencere", "tava", "duduklu", "wok", "tencere seti"],
  "yemek-takimi": ["yemek seti", "tabak"],
  "catal-bicak": ["catal kasik", "catal bicak"],
  "bardak-kupa": ["bardak", "kupa", "fincan", "kadeh"],
  "saklama-kabi": ["saklama", "erzak"],
  "caydanlik": ["caydanlik", "demlik"],
  "nevresim": ["nevresim takimi", "carsaf", "pike", "yatak ortusu"],
  "yorgan-battaniye": ["yorgan", "battaniye", "uyku seti"],
  "yastik": ["yastik"],
  "hali": ["kilim", "paspas", "yolluk"],
  "perde": ["tul", "stor"],
  "kirlent": ["kirlent", "minder", "kilif"],
  "vazo-yapay-cicek": ["vazo", "yapay cicek"],
  "tablo-duvar-dekoru": ["tablo", "duvar dekoru", "cerceve"],
  "masa-lambasi": ["abajur"],
  "banyo-aksesuari": ["sabunluk", "dis fircaligi"],
  "yag": ["aycicek yagi", "zeytinyagi", "zeytin yagi"],
  "bakliyat-pirinc": ["bakliyat", "pirinc", "bulgur", "mercimek", "nohut"],
  "un-seker": ["un", "seker"],
  "salca-konserve": ["salca", "konserve", "tursu"],
  "baharat": ["baharat", "tuz"],
  "peynir": ["peynir"],
  "bal-recel": ["bal", "recel", "pekmez", "tahin"],
  "kahvaltilik-gevrek": ["gevrek", "musli", "granola", "corn flakes"],
  "cikolata": ["cikolata", "sekerleme", "gofret"],
  "biskuvi": ["biskuvi", "kraker", "kek"],
  "kuruyemis-cips": ["kuruyemis", "cips", "cerez"],
  "cay": ["cay", "bitki cayi"],
  "kahve": ["kahve", "turk kahvesi", "hazir kahve"],
  "su": ["su", "maden suyu", "soda"],
  "mesrubat": ["gazli icecek", "meyve suyu", "kola", "ayran", "enerji icecegi"],
  "camasir-deterjani": ["camasir deterjani", "yumusatici"],
  "bulasik-deterjani": ["bulasik deterjani", "bulasik tableti", "bulasik makinesi deterjani"],
  "yuzey-temizleyici": ["yuzey temizleyici", "camasir suyu", "temizlik"],
  "kagit-urunleri": ["tuvalet kagidi", "kagit havlu", "pecete", "mendil"],
  "bebek-bezi-paket": ["bebek bezi", "kulot bez"],
  "islak-mendil": ["islak mendil", "islak havlu"],
  "mama": ["bebek mamasi", "devam sutu", "kavanoz mama"],
  "biberon-emzik": ["biberon", "emzik"],
  "bebek-arabasi": ["bebek arabasi", "puset", "travel sistem"],
  "oto-koltugu": ["oto koltugu", "araba koltugu"],
  "kanguru": ["kanguru", "portbebe", "ana kucagi"],
  "bebek-banyo": ["bebek banyo", "bebek sampuani"],
  "kadin-parfum": ["kadin parfum", "edp", "edt"],
  "deodorant": ["deodorant", "roll on"],
  "fondoten": ["fondoten", "kapatici", "pudra"],
  "ruj": ["ruj", "dudak"],
  "maskara": ["maskara", "rimel", "eyeliner", "far"],
  "oje": ["oje", "tirnak"],
  "yuz-kremi": ["yuz kremi", "nemlendirici", "goz kremi"],
  "gunes-kremi": ["gunes kremi", "spf", "gunes koruyucu"],
  "yuz-temizleyici": ["yuz temizleme", "tonik", "misel", "yuz yikama"],
  "sampuan": ["sampuan", "sac kremi", "sac maskesi"],
  "sac-boyasi": ["sac boyasi"],
  "dis-macunu": ["dis macunu", "agiz bakim suyu"],
  "dis-fircasi": ["dis fircasi"],
  "vitamin": ["vitamin", "takviye", "gida takviyesi"],
  "kedi-mamasi": ["kedi mamasi", "kedi konserve", "kedi odul"],
  "kedi-kumu": ["kedi kumu"],
  "kedi-oyuncak": ["kedi oyuncagi", "tirmalama"],
  "kopek-mamasi": ["kopek mamasi", "kopek konserve", "kopek odul", "kemik", "cigneme", "chew"],
  "kopek-tasmasi": ["tasma", "gezdirme", "kopek kiyafeti"],
  "kus": ["kus yemi", "kafes", "kus"],
  // 13 Kasım: ilk turda kategorisiz kalan yolların karşılıkları
  "sut": ["sut", "laktozsuz", "kefir"],
  "yogurt-ayran": ["yogurt", "ayran", "kefir"],
  "tereyagi-margarin": ["tereyagi", "margarin"],
  "kirmizi-et": ["kirmizi et", "dana", "kuzu", "kiyma", "kofte"],
  "tavuk": ["tavuk", "pilic", "hindi"],
  "sucuk-salam": ["sucuk", "salam", "sosis", "jambon", "pastirma", "fume", "sarkuteri"],
  "balik": ["balik", "ton baligi", "deniz urunleri", "karides"],
  "meyve": ["meyve"],
  "sebze": ["sebze", "yesillik"],
  "ekmek": ["ekmek", "lavas", "tortilla", "simit"],
  "tatli-malzemesi": ["tatli", "puding", "pasta malzemesi", "kek karisimi", "pasta susu"],
  "dondurma": ["dondurma"],
  "dondurulmus-gida": ["dondurulmus"],
  "bar": ["bar", "protein bar", "kaplamali", "meyve topu"],
  "sakiz-sekerleme": ["sakiz", "sekerleme", "lokum", "jelibon"],
  "tuvalet-temizlik": ["tuvalet temizleyici", "wc", "klozet", "tuvalet kokusu"],
  "hasere": ["hasere", "sinek", "bocek", "sivrisinek"],
  "goz-makyaji": ["far", "far paleti", "goz kalemi", "eyeliner", "kas", "maskara"],
  "allik": ["allik", "highlighter", "aydinlatici", "bronzer", "kontur"],
  "makyaj-fircasi": ["makyaj fircasi", "allik fircasi", "makyaj sungeri", "firca"],
  "el-vucut-kremi": ["el kremi", "vucut losyonu", "vucut kremi", "nemlendirici krem"],
  "dus-jeli": ["dus jeli", "banyo kopugu"],
  "sabun": ["sabun", "sivi sabun", "katı sabun"],
  "kolonya": ["kolonya"],
  "hijyenik-ped": ["ped", "hijyenik ped", "tampon", "gunluk ped", "kadin hijyen"],
  "tiras-bicagi": ["tiras", "tiras bicagi", "tiras kopugu", "jilet"],
  "agda": ["agda", "tuy dokucu", "epilasyon"],
  "tarak": ["tarak", "sac fircasi"],
  "kase-tabak": ["kase", "tabak", "pasta tabagi", "servis tabagi", "kahvalti tabagi"],
  "surahi": ["surahi", "karaf"],
  "servis-sunum": ["servis", "sunum", "sunumluk", "tepsi", "kek fanusu"],
  "masa-ortusu": ["masa ortusu", "runner", "amerikan servis"],
  "bebek-guvenligi": ["bebek guvenligi", "emniyet", "kilit", "koruyucu", "kapi bariyeri"],
  "surungen": ["surungen", "teraryum", "kaplumbaga"],
  "pet-sampuan": ["pet sampuan", "temizlik mendili", "sampuan", "kulak temizleme"],
  "pet-tarak": ["tarak", "tuy", "firca"],
  "pet-tasima-cantasi": ["tasima cantasi", "tasima kafesi", "tasima"],
  "pet-yatak": ["yatak", "minder", "kulube"],
  "kablo-donusturucu": ["kablo", "donusturucu", "cevirici", "adaptor", "hdmi", "displayport"],
  "usb-coklayici": ["usb hub", "coklayici", "dock", "cogaltici"],
  "kamera-aksesuari": ["aksiyon kamera aksesuari", "kamera aksesuari", "tripod", "kamera kilifi"],
  "akilli-saat-aksesuari": ["akilli saat kordonu", "kordon", "bileklik kayisi", "saat aksesuari"],
  "sarj-aleti-ve-kablo": ["sarj aleti", "sarj cihazi", "sarj kablosu", "sarj istasyonu", "arac ici sarj", "kablosuz sarj"],
  "powerbank": ["powerbank", "tasinabilir sarj"],
  "telefon-tutucu": ["telefon tutucu", "arac ici tutucu", "tutucu", "stand"],
  "akilli-saat": ["akilli saat", "smartwatch"],
  "avize": ["avize", "aplik", "sarkit", "tavan lambasi"],
  "havlu-bornoz": ["havlu", "bornoz", "pestamal", "kurulama bezi", "mutfak havlusu"],
  "termos": ["termos", "matara", "karaf termos"],
  "mum-oda-kokusu": ["mum", "oda kokusu", "difuzor", "kokulu kese", "koku"],
  "akvaryum": ["akvaryum", "balik yemi", "hava motoru", "akvaryum filtre", "su duzenleyici"],
};

// Otomatik kelimeleri tamamen değiştirenler (genel kelimeyi başka kategoriye bırakmak için).
const YALNIZ: Record<string, string[]> = {
  "bilgisayar-kulakligi": ["oyuncu kulakligi", "gaming kulaklik", "oyuncu mikrofonu"],
  "kablosuz-kulaklik": ["kablosuz kulaklik", "bluetooth kulaklik", "tws"],
  "telefon-kilifi": ["telefon kilifi", "kilif", "kiliflar"],
  "ev-ofis-telefonu": ["telsiz telefon", "masaustu telefon"],
  // Mobilya oda başlıkları genel kelimelerden ("mutfak", "bebek", "yatak") eşleşmesin; yalnız mobilya sözcükleriyle.
  "oturma-odasi": ["oturma odasi mobilya", "oturma grubu", "salon takimi"],
  "yatak-odasi": ["yatak odasi takimi", "yatak odasi mobilya"],
  "yemek-odasi": ["yemek odasi takimi", "yemek odasi mobilya", "mutfak masasi"],
  "calisma-odasi": ["calisma odasi mobilya", "ofis mobilyasi"],
  "bebek-genc-odasi": ["bebek odasi takimi", "genc odasi takimi", "cocuk odasi mobilya", "bebek mobilyasi"],
  "bahce-mobilyasi": ["bahce mobilyasi", "balkon takimi"],
};

type Aday = { slug: string; yol: string[]; derinlik: number; kelimeler: string[]; aksesuar: boolean; altVar: boolean };
const YOL_AKSESUAR = /\b(aksesuar\w*|yedek\w*|sarf\w*|hortum\w*|torba\w*|filtre\w*|kilif\w*)/;
const AD_AKSESUAR = /\b(aksesuar\w*|yedek parca\w*|hortum\w*|kilifi?\b|yedek\b)/;
const GENEL_KELIME = new Set(["aksesuar", "aksesuarlar", "aksesuarlari", "aksesuarlar", "urunler", "urunleri", "malzemeleri", "diger", "cesitleri", "yedek parca", "parcalari", "bakim", "setler", "setleri"]);
const ADAYLAR: Aday[] = [];
(function gez(liste: KategoriDugumu[], yol: string[], derinlik: number) {
  for (const d of liste) {
    // "Cep Telefonu ve Aksesuarları" → "aksesuarlari" tek başına kelime olmasın (her aksesuar buraya akıyordu).
    const parcalar = d.ad.split(/\s+ve\s+|,\s*/i).map(duzMetin).filter((x) => x.length >= 2 && !GENEL_KELIME.has(x));
    const kelimeler = YALNIZ[d.slug] ?? [...parcalar, ...(ES_ANLAMLI[d.slug] ?? [])];
    const k = [...new Set(kelimeler.map(duzMetin))];
    ADAYLAR.push({ slug: d.slug, yol: [...yol, d.slug], derinlik, altVar: Boolean(d.alt?.length), kelimeler: k, aksesuar: k.some((x) => YOL_AKSESUAR.test(x) || AD_AKSESUAR.test(x)) || /aksesuar|kilif|kablo|tutucu|koruyucu|sarj|kordon/.test(duzMetin(d.ad)) });
    if (d.alt) gez(d.alt, [...yol, d.slug], derinlik + 1);
  }
})(KATEGORI_AGACI, [], 0);

// Bir metin içinde kelime grubu geçiyor mu? Türkçe ekler için kelime başı eşleşmesi ("tencere" ⊂ "tencereler").
function gecer(metin: string, kelime: string) {
  if (kelime.length < 3) return metin.split(" ").includes(kelime);
  return (" " + metin).includes(" " + kelime);
}

export type EslemeSonucu = { slug: string; puan: number };

/** Bazı bölümlere ürün girebilmesi için ad ya da mağaza yolunda o bölüme özgü bir bağlam kelimesi şart.
 *  Örn. "1210 Kılıf SMD Kondansatör" kılıf kelimesi yüzünden telefon kılıfına düşmesin. */
const OZEL_DAL = new Set(["elektronik-hobi"]);
const BAGLAM: Record<string, RegExp> = {
  "cep-telefonu-ve-aksesuarlari": /\b(telefon|cep|iphone|samsung|galaxy|xiaomi|redmi|huawei|oppo|realme|honor|vivo|poco|tecno|infinix|nokia|motorola|reeder|casper via|general mobile|magsafe|android|ios|gsm|smartphone|powerbank|power bank|tasinabilir sarj|sarj aleti|sarj cihazi|sarj adaptoru|hizli sarj|lightning|type c|usb c|ekran koruyucu|kablosuz sarj|arac ici tutucu)\b/,
};

/** Mağaza kategori yolu + ürün adı → kategori. `kokler`: mağazanın eşlenebileceği bölümler (ana bölüm ya da herhangi bir alt dalın slug'ı). */
export function kategoriEsle(kategoriYolu: string[] | undefined, ad: string, kokler: string[]): EslemeSonucu | null {
  const yol = (kategoriYolu ?? []).map(duzMetin).filter((x) => x && !/^(ana sayfa|anasayfa|home|tum urunler)$/.test(x));
  const urunDuz = duzMetin(ad);
  // Bazı mağazalar yolun sonuna ürünün kendi adını ya da kodunu koyar; o halka kategori değildir.
  while (yol.length && (/^\d+$/.test(yol.at(-1)!) || yol.at(-1) === urunDuz || (yol.at(-1)!.length > 15 && urunDuz.startsWith(yol.at(-1)!.slice(0, 15))))) yol.pop();
  const son = yol.at(-1) ?? "";
  const ikinci = yol.at(-2) ?? "";            // bir üst halka ("Baharat > Pul Biber" → Baharat)
  const onceki = yol.slice(0, -2).join(" | ");
  const urun = urunDuz;
  // Aksesuar / yedek parça ürünü yalnızca aksesuar türü kategorilere konabilir
  // (ör. bulaşık makinesi hortumu ≠ bulaşık makinesi, iPhone kılıfı ≠ akıllı telefon).
  // Yalnızca yolun son halkasına bakılır: "Telefon & Aksesuarları > Şarj Cihazları > Powerbank" aksesuar değildir.
  const baglamMetni = `${urun} | ${yol.join(" | ")}`;
  const urunAksesuar = YOL_AKSESUAR.test(son) || AD_AKSESUAR.test(urun);
  let enIyi: EslemeSonucu | null = null;
  for (const a of ADAYLAR) {
    if (!a.yol.some((s) => kokler.includes(s))) continue; // mağazanın izinli bölümleri (ana bölüm ya da alt dal)
    // Robotik dalı yalnız onu açıkça kapsamına almış (robotik/elektronik malzeme) mağazalara açık; yoksa "LED", "pil",
    // "buton" gibi genel kelimelerle fener, oyuncak vb. buraya düşer.
    if (a.yol.some((s) => OZEL_DAL.has(s)) && !a.yol.some((s) => OZEL_DAL.has(s) && kokler.includes(s))) continue;
    if (a.yol.some((s) => BAGLAM[s] && !BAGLAM[s].test(baglamMetni))) continue;
    if (a.derinlik === 0) continue; // ana bölümün kendisine ürün konmaz
    if (urunAksesuar && !a.aksesuar) continue;
    // Yolun son halkası en güçlü işaret; ürün adı ve üst halkalar onu destekler.
    let pSon = 0, pAd = 0, pUst = 0, pIkinci = 0;
    for (const k of a.kelimeler) {
      const uzunluk = Math.min(k.length, 12) / 12; // uzun, özgül kelimeler daha değerli
      if (gecer(son, k)) pSon = Math.max(pSon, 6 + 4 * uzunluk);
      if (gecer(urun, k)) pAd = Math.max(pAd, 4 + 4 * uzunluk);
      if (gecer(ikinci, k)) pIkinci = Math.max(pIkinci, 5 + 3 * uzunluk);
      if (gecer(onceki, k)) pUst = Math.max(pUst, 2 + 2 * uzunluk);
    }
    const enBuyuk = Math.max(pSon, pAd, pIkinci, pUst);
    let puan = enBuyuk + 0.5 * (pSon + pAd + pIkinci + pUst - enBuyuk);
    if (!puan) continue;
    puan += a.derinlik * 1; // aynı puanda daha özgül (yaprak) kategori
    if (!enIyi || puan > enIyi.puan) enIyi = { slug: a.slug, puan };
  }
  if (!enIyi || enIyi.puan < 6) return null;
  return enIyi;
}
