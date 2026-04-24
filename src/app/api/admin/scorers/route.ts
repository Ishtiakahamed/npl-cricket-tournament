import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => {
    const hash = await bcrypt.hash(body.password, 10);
    return prisma.user.create({
      data: {
        username: body.username,
        name: body.name,
        passwordHash: hash,
        role: "SCORER",
      },
    });
  });
}
