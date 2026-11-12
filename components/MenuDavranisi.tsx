"use client";
// Menüler CSS ile açılır. Bu bileşen yalnızca iki şeyi düzeltir:
// 1) Menüden bir bağlantıya tıklanınca imleç hâlâ panelin üzerinde olsa da panel kapansın.
// 2) Sayfa değişince mobil çekmece kapansın, Escape tuşu açık menüyü kapatsın.
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function MenuDavranisi({ children }: { children: React.ReactNode }) {
  const kap = useRef<HTMLDivElement>(null);
  const yol = usePathname();

  useEffect(() => {
    kap.current?.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
  }, [yol]);

  useEffect(() => {
    const el = kap.current;
    if (!el) return;
    const tikla = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-kapat]")) {
        el.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
        return;
      }
      if ((e.target as HTMLElement).closest("a")) {
        el.dataset.kapali = "1";
        (document.activeElement as HTMLElement | null)?.blur();
      }
    };
    const ayril = () => delete el.dataset.kapali;
    const tus = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      el.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
      if (el.contains(document.activeElement)) { el.dataset.kapali = "1"; (document.activeElement as HTMLElement).blur(); }
    };
    el.addEventListener("click", tikla);
    el.addEventListener("pointerleave", ayril);
    el.addEventListener("focusin", ayril);
    document.addEventListener("keydown", tus);
    return () => { el.removeEventListener("click", tikla); el.removeEventListener("pointerleave", ayril); el.removeEventListener("focusin", ayril); document.removeEventListener("keydown", tus); };
  }, []);

  return <div ref={kap} className="menu-kap">{children}</div>;
}
