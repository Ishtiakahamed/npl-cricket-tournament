import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withAdmin(() =>
    prisma.player.update({
      where: { id: params.id },
      data: { name: body.name, role: body.role, teamId: body.teamId },
    })
  );
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(() => prisma.player.delete({ where: { id: params.id } }));
}
