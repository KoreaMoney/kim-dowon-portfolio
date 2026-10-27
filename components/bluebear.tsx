"use client";

export function BlueBear({ mood = "happy", className = "" }: { mood?: "happy" | "shocked" | "smug"; className?: string }) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" focusable="false" className={`wc-bear ${className}`}>
      <circle className="wc-bear-ear" cx="20" cy="15" r="10" />
      <circle className="wc-bear-ear" cx="60" cy="15" r="10" />
      <circle className="wc-bear-inner-ear" cx="20" cy="15" r="5" />
      <circle className="wc-bear-inner-ear" cx="60" cy="15" r="5" />
      <path className="wc-bear-head" d="M12 20q28 -8 56 0v30q0 16 -16 16H28q-16 0 -16 -16z" />
      <rect className="wc-bear-eye" x="25" y="34" width="6" height={mood === "shocked" ? 9 : 6} />
      <rect className="wc-bear-eye" x="49" y="34" width="6" height={mood === "shocked" ? 9 : 6} />
      <ellipse className="wc-bear-muzzle" cx="40" cy="50" rx="11" ry="8" />
      <rect className="wc-bear-nose" x="37" y="44" width="6" height="4" />
      {mood === "shocked"
        ? <rect className="wc-bear-mouth" x="36" y="52" width="8" height="5" />
        : <path className="wc-bear-mouth" d="m34 51 6 4 6 -4" />}
      {mood === "smug" && <path className="wc-bear-brow" d="m23 30 10 -3m24 1 -10 -1" />}
    </svg>
  );
}

export function BearBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="wc-bubble-row">
      <BlueBear className="wc-bubble-bear" />
      <div className="wc-bubble"><span>푸른곰 · BLUEBEAR AI</span><p>{children}</p></div>
    </div>
  );
}
