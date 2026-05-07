"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCredentialsLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      username,
      password,
      callbackUrl,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Username or password is incorrect.");
      return;
    }

    window.location.href = result?.url ?? callbackUrl;
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-yellow-400/20 bg-zinc-950 p-8 shadow-2xl shadow-yellow-500/10">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
          FlowScaler
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Log in to manage your automation workflows.
        </p>
      </div>

      <form onSubmit={handleCredentialsLogin} className="space-y-5">
        <div>
          <label htmlFor="username" className="text-sm font-medium text-zinc-200">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-200">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        <div className="h-px flex-1 bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:border-yellow-400/60 hover:bg-zinc-800"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Need an account?{" "}
        <Link href="/register" className="font-semibold text-yellow-400 hover:text-yellow-300">
          Register
        </Link>
      </p>
    </section>
  );
}
