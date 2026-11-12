import type { Metadata } from "next";

export const metadata: Metadata = { title: "FiyatDurbunBot hakkında", alternates: { canonical: "/bot" } };

export default function Bot() {
  return (
    <div className="kutu" style={{ padding: 26, maxWidth: 760 }}>
      <h1 style={{ fontSize: 28 }}>FiyatDurbunBot</h1>
      <p>Sitenize <code>FiyatDurbunBot/0.1 (+https://fiyatdurbun.com/bot)</code> kimliğiyle gelen istekler bize ait. Botumuz alışverişçilerin fiyat karşılaştırması için yalnız herkese açık ürün sayfalarındaki fiyat, stok ve teknik özellik bilgisini okur.</p>
      <h2 style={{ marginTop: 18 }}>Kurallarımız</h2>
      <ul>
        <li>robots.txt dosyanıza uyarız. Kapattığınız hiçbir sayfayı okumayız.</li>
        <li>Aynı siteye en az 3 saniye arayla tek tek istek atarız; Crawl-delay yazdıysanız ona uyarız.</li>
        <li>Giriş gerektiren sayfalara, sepete, kişisel veriye dokunmayız.</li>
        <li>Bot korumasını ya da doğrulama ekranlarını aşmaya çalışmayız. Engellendiğimizde o siteyi okumayı durdururuz.</li>
        <li>Ürün sayfanıza giden her tıklama doğrudan sizin sitenize gider.</li>
      </ul>
      <h2 style={{ marginTop: 18 }}>Mağaza sahipleri</h2>
      <p>Ürün beslemesi (XML) vermek, okuma sıklığını değiştirmek ya da listeden çıkmak için bize yazın: <a href="mailto:magaza@fiyatdurbun.com">magaza@fiyatdurbun.com</a>.</p>
    </div>
  );
}
