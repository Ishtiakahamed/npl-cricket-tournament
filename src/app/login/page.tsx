"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type LoginRole = "admin" | "scorer";

const DEMO_CREDENTIALS: Record<LoginRole, { username: string; password: string; label: string; redirect: string }> = {
  admin: {
    username: "admin@npl.com",
    password: "Admin@12345",
    label: "Admin",
    redirect: "/admin",
  },
  scorer: {
    username: "scorer@npl.com",
    password: "Scorer@12345",
    label: "Scorer",
    redirect: "/scorer",
  },
};

function isLoginRole(value: string | null): value is LoginRole {
  return value === "admin" || value === "scorer";
}

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const roleParam = sp.get("role");
  const callbackUrl = sp.get("callbackUrl") ?? undefined;

  const initialRole: LoginRole = isLoginRole(roleParam) ? roleParam : "admin";
  const [role, setRole] = useState<LoginRole>(initialRole);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Keep tab in sync with URL when user navigates back/forward
  useEffect(() => {
    if (isLoginRole(roleParam)) setRole(roleParam);
  }, [roleParam]);

  const demo = useMemo(() => DEMO_CREDENTIALS[role], [role]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("Invalid username or password");
      return;
    }
    router.push(callbackUrl ?? demo.redirect);
    router.refresh();
  };

  const fillDemo = () => {
    setUsername(demo.username);
    setPassword(demo.password);
    setError(null);
  };

  const switchRole = (next: LoginRole) => {
    setRole(next);
    setError(null);
    // Reflect in the URL without a full navigation
    const params = new URLSearchParams(Array.from(sp.entries()));
    params.set("role", next);
    router.replace(`/login?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <div className="mb-4">
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
            ← Back to home
          </Link>
        </div>

        {/* Role tabs */}
        <div
          role="tablist"
          aria-label="Login role"
          className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1"
        >
          {(Object.keys(DEMO_CREDENTIALS) as LoginRole[]).map((r) => {
            const active = r === role;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchRole(r)}
                className={
                  "rounded-md px-3 py-2 text-sm font-semibold transition " +
                  (active
                    ? "bg-[var(--accent)] text-black"
                    : "text-[var(--muted)] hover:text-[var(--fg)]")
                }
              >
                {DEMO_CREDENTIALS[r].label} Login
              </button>
            );
          })}
        </div>

        <h1 className="mt-5 text-xl font-bold">{demo.label} sign in</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {role === "admin"
            ? "Manage teams, players, fixtures and tournament setup."
            : "Sign in to update live scores for your assigned matches."}
        </p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              autoFocus
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={demo.username}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : `Sign in as ${demo.label}`}
          </button>
        </form>

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)] space-y-1">
          <div className="font-semibold text-[var(--fg)]">Demo credentials</div>
          <div>
            Username: <code className="bg-[var(--surface)] px-1 rounded">{demo.username}</code>
          </div>
          <div>
            Password: <code className="bg-[var(--surface)] px-1 rounded">{demo.password}</code>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="mt-2 text-[var(--accent)] hover:underline"
          >
            Auto-fill demo credentials
          </button>
        </div>
      </div>
    </div>
  );
}
