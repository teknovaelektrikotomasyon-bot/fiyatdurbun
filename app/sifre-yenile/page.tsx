import type { Metadata } from "next";
import Link from "next/link";
import { sifreYenileIslem } from "@/app/giris/islemler";
import { jetonGecerli, uyelikSemasi } from "@/lib/uyelik.ts";

export const metadata: Metadata = { title: "Yeni şifre belirle", robots: { index: false } };
export const dynamic = "force-dynamic";
type P = { searchParams: Promise<{ j?: string; hata?: string }> };

export default async function SifreYenile({ searchParams }: P) {
  const sp = await searchParams;
  await uyelikSemasi();
  if (!sp.j || !(await jetonGecerli(sp.j))) return (
    <div className="kutu dar uyelik">
      <h1>Bağlantı geçersiz</h1>
      <p>Şifre yenileme bağlantısının süresi dolmuş ya da daha önce kullanılmış.</p>
      <p><Link href="/sifremi-unuttum">Yeni bağlantı iste</Link></p>
    </div>
  );
  return (
    <form className="kutu dar uyelik" action={sifreYenileIslem}>
      <h1>Yeni şifre belirle</h1>
      <input type="hidden" name="j" value={sp.j} />
      {sp.hata === "sifre" && <p className="uyelik-hata" role="alert">Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermeli.</p>}
      {sp.hata === "sifre2" && <p className="uyelik-hata" role="alert">Şifreler aynı değil.</p>}
      <label>Yeni şifre<input name="sifre" type="password" required minLength={8} autoComplete="new-password" autoFocus /></label>
      <label>Yeni şifre (tekrar)<input name="sifre2" type="password" required minLength={8} autoComplete="new-password" /></label>
      <button className="dugme">Şifremi kaydet</button>
    </form>
  );
}
