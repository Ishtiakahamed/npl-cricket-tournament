import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NPL Cricket Tournament",
  description: "Live scoreboard, fixtures, points table and more for the NPL Cricket Tournament.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <header className="border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-black font-black">
                  N
                </span>
                <span className="hidden sm:inline">NPL Cricket Tournament</span>
                <span className="sm:hidden">NPL</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4 text-sm">
                <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
                <Link href="/fixtures" className="hover:text-[var(--accent)]">Fixtures</Link>
                <Link href="/points" className="hover:text-[var(--accent)]">Points Table</Link>
                <Link href="/teams" className="hover:text-[var(--accent)]">Teams</Link>
                <Link href="/venues" className="hover:text-[var(--accent)]">Venues</Link>
              </nav>
              <div className="ml-auto flex items-center gap-3 text-sm">
                {session?.user ? (
                  <>
                    <span className="text-[var(--muted)] hidden sm:inline">
                      {session.user.role === "ADMIN" ? "Admin" : "Scorer"}: {session.user.username}
                    </span>
                    {session.user.role === "ADMIN" && (
                      <Link href="/admin" className="btn-primary">Admin</Link>
                    )}
                    {session.user.role === "SCORER" && (
                      <Link href="/scorer" className="btn-primary">Scorer</Link>
                    )}
                    <Link href="/api/auth/signout" className="btn">Sign out</Link>
                  </>
                ) : (
                  <Link href="/login" className="btn">Sign in</Link>
                )}
              </div>
            </div>
            <nav className="md:hidden border-t border-[var(--border)]">
              <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-4 text-sm overflow-x-auto">
                <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
                <Link href="/fixtures" className="hover:text-[var(--accent)]">Fixtures</Link>
                <Link href="/points" className="hover:text-[var(--accent)]">Points</Link>
                <Link href="/teams" className="hover:text-[var(--accent)]">Teams</Link>
                <Link href="/venues" className="hover:text-[var(--accent)]">Venues</Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-7xl w-full flex-1 px-4 py-6">{children}</main>
          <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-4 text-center text-xs text-[var(--muted)]">
            NPL Cricket Tournament · Live scoring powered by SSE
          </footer>
        </Providers>
      </body>
    </html>
  );
}
