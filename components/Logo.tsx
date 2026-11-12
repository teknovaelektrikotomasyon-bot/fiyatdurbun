// Dürbün: iki mercek, sağdakinde fiyat parıltısı.
export function Logo({ boyut = 30 }: { boyut?: number }) {
  return (
    <span className="logo">
      <svg width={boyut * 1.55} height={boyut} viewBox="0 0 62 40" aria-hidden="true">
        <rect x="24" y="10" width="14" height="8" rx="3" fill="var(--murekkep)" />
        <circle cx="16" cy="22" r="14" fill="var(--murekkep)" />
        <circle cx="46" cy="22" r="14" fill="var(--murekkep)" />
        <circle cx="16" cy="22" r="8.5" fill="var(--mercek-ic)" />
        <circle cx="46" cy="22" r="8.5" fill="var(--mercek)" />
        <path d="M41.5 19.5a6 6 0 0 1 5-3.4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".9" />
      </svg>
      <span className="logo-yazi">fiyat<b>dürbün</b></span>
    </span>
  );
}
