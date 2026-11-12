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
  "havlu-bornoz": ["havlu", "bornoz"],
  "hali": ["kilim", "paspas", "yolluk"],
  "perde": ["tul", "stor"],
  "kirlent": ["kirlent", "minder", "kilif"],
  "mum-oda-kokusu": ["mum", "oda kokusu", "difuzor"],
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
  "kopek-mamasi": ["kopek mamasi", "kopek konserve", "kopek odul"],
  "kopek-tasmasi": ["tasma", "gezdirme", "kopek kiyafeti"],
  "akvaryum": ["akvaryum", "balik yemi", "akvaryum filtre"],
  "kus": ["kus yemi", "kafes", "kus"],
};

// Otomatik kelimeleri tamamen değiştirenler (genel kelimeyi başka kategoriye bırakmak için).
const YALNIZ: Record<string, string[]> = {
  "bilgisayar-kulakligi": ["oyuncu kulakligi", "gaming kulaklik", "oyuncu mikrofonu"],
  "kablosuz-kulaklik": ["kablosuz kulaklik", "bluetooth kulaklik", "tws"],
  "telefon-kilifi": ["telefon kilifi", "kilif", "kiliflar"],
  "ev-ofis-telefonu": ["telsiz telefon", "masaustu telefon"],
};

type Aday = { slug: string; yol: string[]; derinlik: number; kelimeler: string[] };
const ADAYLAR: Aday[] = [];
(function gez(liste: KategoriDugumu[], yol: string[], derinlik: number) {
  for (const d of liste) {
    const parcalar = d.ad.split(/\s+ve\s+|,\s*/i).map(duzMetin).filter((x) => x.length >= 2);
    const kelimeler = YALNIZ[d.slug] ?? [...parcalar, ...(ES_ANLAMLI[d.slug] ?? [])];
    ADAYLAR.push({ slug: d.slug, yol: [...yol, d.slug], derinlik, kelimeler: [...new Set(kelimeler.map(duzMetin))] });
    if (d.alt) gez(d.alt, [...yol, d.slug], derinlik + 1);
  }
})(KATEGORI_AGACI, [], 0);

// Bir metin içinde kelime grubu geçiyor mu? Türkçe ekler için kelime başı eşleşmesi ("tencere" ⊂ "tencereler").
function gecer(metin: string, kelime: string) {
  if (kelime.length < 3) return metin.split(" ").includes(kelime);
  return (" " + metin).includes(" " + kelime);
}

export type EslemeSonucu = { slug: string; puan: number };

/** Mağaza kategori yolu + ürün adı → kategori. `kokler`: mağazanın eşlenebileceği ana bölümler (slug). */
export function kategoriEsle(kategoriYolu: string[] | undefined, ad: string, kokler: string[]): EslemeSonucu | null {
  const yol = (kategoriYolu ?? []).map(duzMetin).filter((x) => x && !/^(ana sayfa|anasayfa|home|tum urunler)$/.test(x));
  const son = yol.at(-1) ?? "";
  const onceki = yol.slice(0, -1).join(" | ");
  const urun = duzMetin(ad);
  let enIyi: EslemeSonucu | null = null;
  for (const a of ADAYLAR) {
    if (!kokler.includes(a.yol[0])) continue;
    // Yolun son halkası en güçlü işaret; ürün adı ve üst halkalar onu destekler.
    let pSon = 0, pAd = 0, pUst = 0;
    for (const k of a.kelimeler) {
      const uzunluk = Math.min(k.length, 12) / 12; // uzun, özgül kelimeler daha değerli
      if (gecer(son, k)) pSon = Math.max(pSon, 6 + 4 * uzunluk);
      if (gecer(urun, k)) pAd = Math.max(pAd, 4 + 4 * uzunluk);
      if (gecer(onceki, k)) pUst = Math.max(pUst, 2 + 2 * uzunluk);
    }
    let puan = Math.max(pSon, pAd, pUst) + 0.5 * (pSon + pAd + pUst - Math.max(pSon, pAd, pUst));
    if (!puan) continue;
    puan += a.derinlik * 1; // aynı puanda daha özgül (yaprak) kategori
    if (!enIyi || puan > enIyi.puan) enIyi = { slug: a.slug, puan };
  }
  if (!enIyi || enIyi.puan < 6) return null;
  // Aksesuar / yedek parça, cihazın kendi kategorisine konmaz (ör. bulaşık makinesi hortumu ≠ bulaşık makinesi).
  const yolAksesuar = /\b(aksesuar\w*|yedek\w*|sarf\w*|hortum\w*|torba\w*|filtre\w*|kilif\w*)/;
  const adAksesuar = /\b(aksesuar\w*|yedek parca\w*|hortum\w*|kilifi?\b)/;
  const hedef = ADAYLAR.find((a) => a.slug === enIyi!.slug)!;
  const hedefAksesuar = hedef.kelimeler.some((k) => yolAksesuar.test(k) || adAksesuar.test(k));
  if ((yolAksesuar.test(yol.join(" ")) || adAksesuar.test(urun)) && !hedefAksesuar) return null;
  return enIyi;
}
