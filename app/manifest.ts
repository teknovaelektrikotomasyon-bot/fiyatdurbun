import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fiyat Dürbün — Fiyat karşılaştırma",
    short_name: "Fiyat Dürbün",
    description: "Ürün fiyatlarını mağaza mağaza karşılaştırın, fiyat geçmişini görün.",
    start_url: "/",
    display: "standalone",
    lang: "tr",
    background_color: "#f3f6f7",
    theme_color: "#102a3a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
