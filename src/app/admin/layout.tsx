import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-[220px,1fr]">
      <aside className="card md:self-start md:sticky md:top-20 !p-2 md:!p-4">
        <h2 className="hidden md:block text-sm font-bold mb-2 text-[var(--muted)]">Admin</h2>
        <nav className="flex md:flex-col gap-1 text-sm overflow-x-auto scroll-x -mx-1 px-1 md:mx-0 md:px-0">
          <Link className="btn !min-h-[36px] justify-start whitespace-nowrap shrink-0" href="/admin">Overview</Link>
          <Link className="btn !min-h-[36px] justify-start whitespace-nowrap shrink-0" href="/admin/teams">Teams &amp; Players</Link>
          <Link className="btn !min-h-[36px] justify-start whitespace-nowrap shrink-0" href="/admin/venues">Venues</Link>
          <Link className="btn !min-h-[36px] justify-start whitespace-nowrap shrink-0" href="/admin/groups">Groups</Link>
          <Link className="btn !min-h-[36px] justify-start whitespace-nowrap shrink-0" href="/admin/fixtures">Fixtures</Link>
          <Link className="btn !min-h-[36px] justify-start whitespace-nowrap shrink-0" href="/admin/scorers">Scorers</Link>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
