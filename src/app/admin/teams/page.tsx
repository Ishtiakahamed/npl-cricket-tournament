import { prisma } from "@/lib/prisma";
import { TeamsAdmin } from "./TeamsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const [teams, groups] = await Promise.all([
    prisma.team.findMany({ include: { group: true, players: true }, orderBy: { name: "asc" } }),
    prisma.group.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <TeamsAdmin teams={teams} groups={groups} />;
}
