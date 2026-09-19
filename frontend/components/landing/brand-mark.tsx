export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0b1f3a" />
      <circle cx="30" cy="32" r="18" fill="none" stroke="#4da3ff" strokeWidth="1.4" opacity="0.35" />
      <circle cx="30" cy="32" r="12" fill="none" stroke="#4da3ff" strokeWidth="1.4" opacity="0.55" />
      <circle cx="30" cy="32" r="6" fill="none" stroke="#4da3ff" strokeWidth="1.6" />
      <circle cx="30" cy="32" r="2.4" fill="#e2bc5a" />
      <path d="M30 32 L46 18" stroke="#4da3ff" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="47.5" cy="16.5" r="3.2" fill="#4da3ff" />
      <rect x="14" y="42" width="4.5" height="10" rx="1" fill="#2b7fff" />
      <rect x="21" y="37" width="4.5" height="15" rx="1" fill="#4da3ff" />
      <rect x="28" y="32" width="4.5" height="20" rx="1" fill="#93c5fd" />
    </svg>
  );
}
