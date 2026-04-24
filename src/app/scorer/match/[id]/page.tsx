import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMatchWithState } from "@/lib/match-ops";
import { ScorerConsole } from "./ScorerConsole";

export const dynamic = "force-dynamic";

export default async function ScorerMatchPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/scorer/match/${params.id}`);
  const match = await getMatchWithState(params.id);
  if (!match) notFound();
  if (session.user.role !== "ADMIN" && match.scorerId !== session.user.id) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold">Not assigned</h2>
        <p className="text-sm text-[var(--muted)]">You are not assigned to this match.</p>
      </div>
    );
  }
  return <ScorerConsole match={match} />;
}
