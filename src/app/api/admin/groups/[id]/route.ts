import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(() => prisma.group.delete({ where: { id: params.id } }));
}
