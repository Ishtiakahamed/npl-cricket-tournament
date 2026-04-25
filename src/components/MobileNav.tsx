"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/points", label: "Points Table" },
  { href: "/teams", label: "Teams" },
  { href: "/venues", label: "Venues" },
];

export function MobileNav({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] active:scale-95 transition"
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs border-r border-[var(--border)] p-4 flex flex-col gap-1 shadow-2xl overflow-y-auto"
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top))",
              backgroundColor: "#131a26",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">NPL Cricket</span>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
                onClick={() => setOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-3 text-base ${active ? "bg-[var(--accent)] text-black font-semibold" : "hover:bg-[var(--surface-2)]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-1">
              {session?.user ? (
                <>
                  <div className="text-xs text-[var(--muted)] px-3">
                    Signed in as <strong>{session.user.username}</strong>
                  </div>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin" className="block rounded-lg px-3 py-3 text-base hover:bg-[var(--surface-2)]">Admin panel</Link>
                  )}
                  {session.user.role === "SCORER" && (
                    <Link href="/scorer" className="block rounded-lg px-3 py-3 text-base hover:bg-[var(--surface-2)]">Scorer panel</Link>
                  )}
                  <Link href="/api/auth/signout" className="block rounded-lg px-3 py-3 text-base hover:bg-[var(--surface-2)]">
                    Sign out
                  </Link>
                </>
              ) : (
                <Link href="/login" className="block rounded-lg px-3 py-3 text-base bg-[var(--accent)] text-black font-semibold">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
