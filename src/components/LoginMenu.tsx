"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function LoginMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-primary inline-flex items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Login menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Login</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden"
        >
          <Link
            role="menuitem"
            href="/login?role=admin"
            onClick={() => setOpen(false)}
            className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition"
          >
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold">Admin Login</span>
              <span className="block text-xs text-[var(--muted)]">
                Manage tournament
              </span>
            </span>
          </Link>
          <Link
            role="menuitem"
            href="/login?role=scorer"
            onClick={() => setOpen(false)}
            className="flex items-start gap-3 border-t border-[var(--border)] px-4 py-3 hover:bg-[var(--surface-2)] transition"
          >
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-2)] text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 7h18M3 12h18M3 17h12" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold">Scorer Login</span>
              <span className="block text-xs text-[var(--muted)]">
                Update live scores
              </span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
