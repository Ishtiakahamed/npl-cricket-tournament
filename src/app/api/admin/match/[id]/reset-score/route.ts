import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/events";

// Admin-only: wipe innings to correct a scorer mistake.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const innings = await prisma.innings.findMany({ where: { matchId: params.id } });
    for (const inn of innings) {
      await prisma.ballEvent.deleteMany({ where: { inningsId: inn.id } });
      await prisma.batterCard.deleteMany({ where: { inningsId: inn.id } });
      await prisma.bowlerCard.deleteMany({ where: { inningsId: inn.id } });
      await prisma.fallOfWicket.deleteMany({ where: { inningsId: inn.id } });
    }
    await prisma.innings.deleteMany({ where: { matchId: params.id } });
    await prisma.match.update({
      where: { id: params.id },
      data: {
        status: "SCHEDULED",
        currentInningsNumber: 0,
        winnerId: null,
        resultText: null,
      },
    });
    publish(params.id);
    return { ok: true };
  });
}
