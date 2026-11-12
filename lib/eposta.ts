// E-posta gönderimi: RESEND_API_KEY varsa Resend ile gönderir, yoksa (geliştirme) konsola yazar.
export async function epostaGonder(kime: string, konu: string, html: string) {
  const anahtar = process.env.RESEND_API_KEY;
  const kimden = process.env.EPOSTA_KIMDEN ?? "Fiyat Dürbün <bildirim@fiyatdurbun.com>";
  if (!anahtar) {
    console.log(`[e-posta yok, konsola yazıldı] ${kime} | ${konu}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`);
    return { gonderildi: false as const };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${anahtar}`, "content-type": "application/json" },
    body: JSON.stringify({ from: kimden, to: [kime], subject: konu, html }),
  });
  if (!r.ok) throw new Error(`e-posta gönderilemedi: ${r.status} ${await r.text()}`);
  return { gonderildi: true as const };
}

export const siteAdresi = () => process.env.SITE_URL ?? "http://localhost:3000";
