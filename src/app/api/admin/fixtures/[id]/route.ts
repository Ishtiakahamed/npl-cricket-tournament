import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withAdmin(() =>
    prisma.match.update({
      where: { id: params.id },
      data: {
        teamAId: body.teamAId,
        teamBId: body.teamBId,
        venueId: body.venueId,
        groupName: body.groupName,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        overs: body.overs,
        scorerId: body.scorerId ?? undefined,
        tossWinnerId: body.tossWinnerId ?? undefined,
        tossDecision: body.tossDecision ?? undefined,
        status: body.status ?? undefined,
        resultText: body.resultText ?? undefined,
        winnerId: body.winnerId ?? undefined,
      },
    })
  );
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(() => prisma.match.delete({ where: { id: params.id } }));
}
