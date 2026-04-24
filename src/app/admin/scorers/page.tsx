import { prisma } from "@/lib/prisma";
import { ScorersAdmin } from "./ScorersAdmin";

export const dynamic = "force-dynamic";

export default async function AdminScorersPage() {
  const scorers = await prisma.user.findMany({
    where: { role: "SCORER" },
    orderBy: { username: "asc" },
    include: { assignedMatches: { include: { teamA: true, teamB: true } } },
  });
  return <ScorersAdmin scorers={scorers} />;
}
