// E-posta gönderimi. Öncelik: SMTP_HOST tanımlıysa kendi posta sunucumuz (ör. info@teknovaelektrik.com, GoDaddy/Titan SMTP),
// yoksa RESEND_API_KEY ile Resend, ikisi de yoksa (geliştirme) konsola yazar.
// Gerekli ortam değişkenleri (Vercel ve GitHub Actions'ta): SMTP_HOST, SMTP_PORT (465), SMTP_USER, SMTP_PASS; isteğe bağlı EPOSTA_KIMDEN.
import nodemailer from "nodemailer";

let tasiyici: nodemailer.Transporter | null = null;
function smtp() {
  if (!process.env.SMTP_HOST) return null;
  tasiyici ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return tasiyici;
}

export async function epostaGonder(kime: string, konu: string, html: string, ek: { kimden?: string; yanit?: string } = {}) {
  const t = smtp();
  if (t) {
    const kimden = ek.kimden ?? process.env.EPOSTA_KIMDEN ?? `Fiyat Dürbün <${process.env.SMTP_USER}>`;
    await t.sendMail({ from: kimden, to: kime, subject: konu, html, ...(ek.yanit ? { replyTo: ek.yanit } : {}) });
    return { gonderildi: true as const };
  }
  const anahtar = process.env.RESEND_API_KEY;
  const kimden = ek.kimden ?? process.env.EPOSTA_KIMDEN ?? "Fiyat Dürbün <bildirim@fiyatdurbun.com>";
  if (!anahtar) {
    console.log(`[e-posta yok, konsola yazıldı] ${kime} | ${konu}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`);
    return { gonderildi: false as const };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${anahtar}`, "content-type": "application/json" },
    body: JSON.stringify({ from: kimden, to: [kime], subject: konu, html, ...(ek.yanit ? { reply_to: ek.yanit } : {}) }),
  });
  if (!r.ok) throw new Error(`e-posta gönderilemedi: ${r.status} ${await r.text()}`);
  return { gonderildi: true as const };
}

export const siteAdresi = () => process.env.SITE_URL ?? "http://localhost:3000";
