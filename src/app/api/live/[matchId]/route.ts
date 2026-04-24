import { NextRequest } from "next/server";
import { subscribe } from "@/lib/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: string) =>
        controller.enqueue(enc.encode(`data: ${data}\n\n`));

      send(JSON.stringify({ type: "hello", matchId, ts: Date.now() }));

      const unsubscribe = subscribe(matchId, () => {
        send(JSON.stringify({ type: "update", matchId, ts: Date.now() }));
      });

      // Heartbeat every 25s to keep the connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(enc.encode(`: heartbeat\n\n`));
      }, 25000);

      // Cleanup when client disconnects
      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };

      _req.signal?.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
