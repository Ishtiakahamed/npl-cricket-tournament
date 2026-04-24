import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withAdmin(async () => {
    const data: { name?: string; passwordHash?: string } = {};
    if (body.name) data.name = body.name;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
    return prisma.user.update({ where: { id: params.id }, data });
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(() => prisma.user.delete({ where: { id: params.id } }));
}
