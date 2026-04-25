import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "NPL Cricket Tournament",
  description: "Live scoreboard, fixtures, points table and more for the NPL Cricket Tournament.",
  applicationName: "NPL Cricket",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
          <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/80">
            <div
              className="mx-auto max-w-7xl flex items-center gap-3 px-3 sm:px-4 py-2.5"
              style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
            >
              <MobileNav session={session} />
              <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg min-w-0">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-black font-black">
                  N
                </span>
                <span className="hidden sm:inline truncate">NPL Cricket Tournament</span>
                <span className="sm:hidden">NPL</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4 text-sm ml-3">
                <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
                <Link href="/fixtures" className="hover:text-[var(--accent)]">Fixtures</Link>
                <Link href="/points" className="hover:text-[var(--accent)]">Points Table</Link>
                <Link href="/teams" className="hover:text-[var(--accent)]">Teams</Link>
                <Link href="/venues" className="hover:text-[var(--accent)]">Venues</Link>
              </nav>
              <div className="ml-auto flex items-center gap-2 text-sm">
                {session?.user ? (
                  <>
                    <span className="text-[var(--muted)] hidden lg:inline">
                      {session.user.role === "ADMIN" ? "Admin" : "Scorer"}: {session.user.username}
                    </span>
                    {session.user.role === "ADMIN" && (
                      <Link href="/admin" className="btn-primary !py-1.5 !px-3">Admin</Link>
                    )}
                    {session.user.role === "SCORER" && (
                      <Link href="/scorer" className="btn-primary !py-1.5 !px-3">Scorer</Link>
                    )}
                    <Link href="/api/auth/signout" className="btn !py-1.5 !px-3 hidden sm:inline-flex">
                      Sign out
                    </Link>
                  </>
                ) : (
                  <Link href="/login" className="btn-primary !py-1.5 !px-3">Sign in</Link>
                )}
              </div>
            </div>
          </header>
          <main
            className="mx-auto max-w-7xl w-full flex-1 px-3 sm:px-4 py-4 sm:py-6"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {children}
          </main>
          <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-4 text-center text-xs text-[var(--muted)]">
            NPL Cricket Tournament · Live scoring powered by SSE
          </footer>
        </Providers>
      </body>
    </html>
  );
}
