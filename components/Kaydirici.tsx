"use client";
// Ana sayfa kaydırıcısı: CSS scroll-snap ile JS olmadan da kaydırılır; JS yalnız 7 sn'de bir ilerletir ve noktaları günceller.
// Kullanıcı etkileşince ya da "hareketi azalt" açıksa otomatik ilerleme durur.
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Kaydirici({ children, adlar }: { children: ReactNode[]; adlar: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(0);
  const [dur, setDur] = useState(false);
  const git = (i: number) => { const el = ref.current; if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" }); };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kay = () => setAktif(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", kay, { passive: true });
    return () => el.removeEventListener("scroll", kay);
  }, []);
  useEffect(() => {
    if (dur || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => git((aktif + 1) % children.length), 7000);
    return () => clearInterval(t);
  }, [aktif, dur, children.length]);
  return (
    <div className="kaydirici" onPointerDown={() => setDur(true)} onFocus={() => setDur(true)}>
      <div className="kaydirici-iz" ref={ref} aria-roledescription="kaydırıcı">
        {children.map((c, i) => <div className="kaydirici-sayfa" key={i} aria-label={`${i + 1} / ${children.length}: ${adlar[i]}`}>{c}</div>)}
      </div>
      <div className="kaydirici-noktalar">
        {children.map((_, i) => <button key={i} type="button" aria-label={adlar[i]} aria-current={i === aktif} onClick={() => { setDur(true); git(i); }} />)}
      </div>
    </div>
  );
}
