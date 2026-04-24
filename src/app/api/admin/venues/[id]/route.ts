import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withAdmin(() =>
    prisma.venue.update({
      where: { id: params.id },
      data: { name: body.name, city: body.city, capacity: body.capacity },
    })
  );
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAdmin(() => prisma.venue.delete({ where: { id: params.id } }));
}
