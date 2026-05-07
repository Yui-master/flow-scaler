"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { registerUser } from "~/server/auth/register";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const nameValue = formData.get("name");
    const usernameValue = formData.get("username");
    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");
    const name = typeof nameValue === "string" ? nameValue : "";
    const username = typeof usernameValue === "string" ? usernameValue : "";
    const email = typeof emailValue === "string" ? emailValue : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";

    const result = await registerUser({ name, username, email, password });

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      username,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    setIsSubmitting(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    window.location.href = signInResult?.url ?? "/dashboard";
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-yellow-400/20 bg-zinc-950 p-8 shadow-2xl shadow-yellow-500/10">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
          FlowScaler
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Start building automation workflows with FlowScaler.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-zinc-200">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Enter your name"
          />
        </div>

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
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-200">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Enter your email"
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
            autoComplete="new-password"
            required
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            placeholder="Create a password"
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        <div className="h-px flex-1 bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:border-yellow-400/60 hover:bg-zinc-800"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-yellow-400 hover:text-yellow-300">
          Log in
        </Link>
      </p>
    </section>
  );
}