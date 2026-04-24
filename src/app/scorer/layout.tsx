import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function ScorerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/scorer");
  if (session.user.role !== "SCORER" && session.user.role !== "ADMIN") redirect("/");
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scorer</h1>
        <Link href="/scorer" className="btn">My matches</Link>
      </div>
      {children}
    </div>
  );
}
