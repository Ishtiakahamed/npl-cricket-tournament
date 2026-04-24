// Simple in-process event bus for SSE live updates.
// Note: In single-instance deployments this works fine. For multi-instance,
// swap this for Redis pub/sub or similar. SQLite makes multi-instance unlikely.

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(matchId: string, fn: Listener): () => void {
  if (!listeners.has(matchId)) listeners.set(matchId, new Set());
  listeners.get(matchId)!.add(fn);
  return () => {
    listeners.get(matchId)?.delete(fn);
  };
}

export function publish(matchId: string): void {
  const set = listeners.get(matchId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
