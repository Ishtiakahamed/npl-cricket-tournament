import { prisma } from "@/lib/prisma";
import { FixturesAdmin } from "./FixturesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminFixturesPage() {
  const [fixtures, teams, venues, scorers] = await Promise.all([
    prisma.match.findMany({
      include: { teamA: true, teamB: true, venue: true, scorer: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.venue.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "SCORER" }, orderBy: { username: "asc" } }),
  ]);
  return <FixturesAdmin fixtures={fixtures} teams={teams} venues={venues} scorers={scorers} />;
}
