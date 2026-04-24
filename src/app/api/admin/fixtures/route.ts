import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => {
    // auto increment matchNumber
    const last = await prisma.match.findFirst({ orderBy: { matchNumber: "desc" } });
    const matchNumber = (last?.matchNumber ?? 0) + 1;
    return prisma.match.create({
      data: {
        matchNumber,
        teamAId: body.teamAId,
        teamBId: body.teamBId,
        venueId: body.venueId,
        groupName: body.groupName,
        scheduledAt: new Date(body.scheduledAt),
        overs: body.overs ?? 20,
        scorerId: body.scorerId || null,
      },
    });
  });
}
