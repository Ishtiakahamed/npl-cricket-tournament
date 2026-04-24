import { NextRequest } from "next/server";
import { withScorerForMatch } from "@/lib/api-helpers";
import { changeBowler } from "@/lib/match-ops";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withScorerForMatch(params.id, () => changeBowler(params.id, body.bowlerId));
}
