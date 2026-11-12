import { jsonLdMetni } from "@/lib/seo.ts";

// Yapısal veri (schema.org). Google zengin sonuçlar ve bilgi kutuları için okur.
export function JsonLd({ veri }: { veri: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdMetni(veri) }} />;
}
