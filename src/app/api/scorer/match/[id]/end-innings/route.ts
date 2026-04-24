import { NextRequest } from "next/server";
import { withScorerForMatch } from "@/lib/api-helpers";
import { endInningsManual } from "@/lib/match-ops";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return withScorerForMatch(params.id, () => endInningsManual(params.id));
}
