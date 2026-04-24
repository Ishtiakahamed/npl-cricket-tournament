import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(() =>
    prisma.player.create({
      data: {
        name: body.name,
        role: body.role,
        teamId: body.teamId,
      },
    })
  );
}
