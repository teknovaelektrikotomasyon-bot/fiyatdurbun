# Kullanım: python3 db/kaynak/agac_uret.py <taxonomy-with-ids.en-US.txt yolu> [-v]
# Google taksonomi dosyası: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
import re, json, sys, os
BURA = os.path.dirname(os.path.abspath(__file__))
tx = {}
for line in open(sys.argv[1]):
    if line.startswith("#"): continue
    i, p = line.rstrip("\n").split(" - ", 1); tx[int(i)] = p
by_last = {}
for i, p in tx.items(): by_last.setdefault(p.split(" > ")[-1].lower(), []).append(i)
TR = str.maketrans("çğıöşüÇĞİÖŞÜâî", "cgiosucgiosuai")
def slugla(s): return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.translate(TR).lower())).strip("-")
dugumler=[]; yigin=[]; rapor=[]; sluglar={}
for line in open(os.path.join(BURA, "kategori-agaci.txt")):
    if not line.strip() or line.startswith("#"): continue
    sev = (len(line) - len(line.lstrip(" "))) // 2
    parca = [x.strip() for x in line.strip().split("|")]
    ad, ipucu = parca[0], parca[1]
    slug = parca[2] if len(parca) > 2 and parca[2] else slugla(ad)
    if slug in sluglar: sys.exit(f"YİNELENEN SLUG {slug}: {ad} / {sluglar[slug]}")
    sluglar[slug] = ad
    yigin = yigin[:sev]
    ust = yigin[-1] if yigin else None
    h = ipucu.rstrip("?").strip()
    if h.isdigit():
        adaylar_sabit = [int(h)]
    else:
        adaylar_sabit = None
    adaylar = adaylar_sabit if adaylar_sabit else [i for i, p in tx.items() if p.lower() == h.lower() or p.lower().endswith(" > " + h.lower())] if ">" in h else by_last.get(h.lower(), [])
    gid = None
    if adaylar:
        kok = None
        if ust:
            r = ust
            while r["ust"]: r = r["ust"]
            kok = tx.get(r["g"], "").split(" > ")[0] if r["g"] else None
        tercih = [a for a in adaylar if kok and tx[a].startswith(kok)] or adaylar
        if ust and ust["g"]:
            alt = [a for a in tercih if tx[a].startswith(tx[ust["g"]])]
            tercih = alt or tercih
        gid = sorted(tercih, key=lambda a: len(tx[a]))[0]
    else:
        gid = ust["g"] if ust else None
        rapor.append(f"BULUNAMADI '{h}' ({ad}) -> üst: {tx.get(gid)}")
    d = {"ad": ad, "slug": slug, "g": gid, "ust": ust, "sev": sev, "alt": []}
    if ust: ust["alt"].append(d)
    else: dugumler.append(d)
    yigin.append(d)
def ts(d, g=0):
    s = "  " * g + f'{{ ad: {json.dumps(d["ad"], ensure_ascii=False)}, slug: "{d["slug"]}", g: {d["g"] or "null"}'
    if d["alt"]: s += ", alt: [\n" + ",\n".join(ts(c, g + 1) for c in d["alt"]) + "\n" + "  " * g + "] }"
    else: s += " }"
    return s
toplam = len(sluglar)
out = "// db/kaynak/kategori-agaci.txt dosyasından db/kaynak/agac_uret.py ile üretilir; elle değil, kaynak dosyadan düzenleyin.\n// g = Google ürün taksonomisi kimliği (satış ortaklığı beslemelerindeki google_product_category ile eşlemek için).\n"
out += "export type KategoriDugumu = { ad: string; slug: string; g: number | null; alt?: KategoriDugumu[] };\n\n"
out += f"// {toplam} kategori, 3 seviye. Sıra = menüdeki sıra.\nexport const KATEGORI_AGACI: KategoriDugumu[] = [\n" + ",\n".join(ts(d, 1) for d in dugumler) + "\n];\n"
open(os.path.join(BURA, "..", "..", "lib", "katalog", "agac-veri.ts"), "w").write(out)
print(toplam, "kategori,", len(dugumler), "kök")
for r in rapor: print(r)
# eşleşme özeti (göz kontrolü)
def gez(d):
    if d["sev"] <= 2: print("  "*d["sev"] + f'{d["ad"]} -> {d["g"]} {tx.get(d["g"], "-")}')
    for c in d["alt"]: gez(c)
if "-v" in sys.argv:
    for d in dugumler: gez(d)
