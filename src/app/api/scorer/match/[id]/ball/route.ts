import { NextRequest } from "next/server";
import { withScorerForMatch } from "@/lib/api-helpers";
import { addBall } from "@/lib/match-ops";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  return withScorerForMatch(params.id, () => addBall(params.id, body));
}
