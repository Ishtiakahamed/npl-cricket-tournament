import { prisma } from "@/lib/prisma";
import { VenuesAdmin } from "./VenuesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });
  return <VenuesAdmin venues={venues} />;
}
