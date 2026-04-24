import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withAdmin(() =>
    prisma.team.update({
      where: { id: params.id },
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(() => prisma.team.delete({ where: { id: params.id } }));
}
