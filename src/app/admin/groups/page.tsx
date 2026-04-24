import { prisma } from "@/lib/prisma";
import { GroupsAdmin } from "./GroupsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const [groups, teams] = await Promise.all([
    prisma.group.findMany({
      include: { teams: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <GroupsAdmin groups={groups} teams={teams} />;
}
