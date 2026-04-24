import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withAdmin(() => prisma.team.findMany({ include: { group: true, players: true } }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(() =>
    prisma.team.create({
      data: {
        name: body.name,
        shortName: body.shortName,
        captain: body.captain,
        logoUrl: body.logoUrl,
        groupId: body.groupId || null,
      },
    })
  );
}
