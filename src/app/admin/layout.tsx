import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="grid gap-6 md:grid-cols-[220px,1fr]">
      <aside className="card self-start sticky top-4">
        <h2 className="text-sm font-bold mb-2 text-[var(--muted)]">Admin</h2>
        <nav className="flex md:flex-col gap-1 text-sm overflow-x-auto">
          <Link className="btn justify-start" href="/admin">Overview</Link>
          <Link className="btn justify-start" href="/admin/teams">Teams &amp; Players</Link>
          <Link className="btn justify-start" href="/admin/venues">Venues</Link>
          <Link className="btn justify-start" href="/admin/groups">Groups</Link>
          <Link className="btn justify-start" href="/admin/fixtures">Fixtures</Link>
          <Link className="btn justify-start" href="/admin/scorers">Scorers</Link>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
