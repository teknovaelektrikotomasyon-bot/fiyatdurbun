// 1200x630 paylaşım görseli şablonu: WhatsApp, X, Facebook ve Google Discover'da görünen kart.
export function OgSablon({ ust, baslik, fiyat, alt, gorsel }: { ust: string; baslik: string; fiyat?: string; alt?: string; gorsel?: string | null }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#102a3a", color: "#fff", fontFamily: "Geologica, GeologicaExt", padding: 64 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: gorsel ? 40 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 500 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 22, height: 22, borderRadius: 11, background: "#6f97ad" }} /></div>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 22, height: 22, borderRadius: 11, background: "#e8a317" }} /></div>
          </div>
          <span>fiyat</span><span style={{ color: "#e8a317", fontWeight: 700, marginLeft: -16 }}>dürbün</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, color: "#9db4c1" }}>{ust}</div>
          <div style={{ fontSize: baslik.length > 40 ? 52 : 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{baslik}</div>
          {fiyat && <div style={{ fontSize: 76, fontWeight: 700, color: "#e8a317", letterSpacing: -2 }}>{fiyat}</div>}
        </div>
        <div style={{ fontSize: 26, color: "#c9d8e0" }}>{alt ?? "fiyatdurbun.com"}</div>
      </div>
      {gorsel && (
        <div style={{ width: 400, height: "100%", background: "#fff", borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={gorsel} width={320} height={320} style={{ objectFit: "contain" }} alt="" />
        </div>
      )}
    </div>
  );
}
