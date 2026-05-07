import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "~/server/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const displayName = session.user.name ?? session.user.email;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-bold uppercase tracking-[0.3em] text-[#ffd84d]">
              FlowScaler
            </Link>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.03em] md:text-6xl">
              Welcome, {displayName}
            </h1>
            <p className="mt-4 max-w-2xl text-white/60">
              Manage AI media workflows, monitor queue health, and launch new
              processing canvases from your protected dashboard.
            </p>
          </div>
          <form
            action={async () => {
              "use server";

              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:border-[#ffd84d]/60 hover:text-[#ffd84d]"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <Link
            href="/workflows/editor"
            className="rounded-[1.5rem] border border-[#ffd84d]/30 bg-[#ffd84d]/10 p-6 transition hover:bg-[#ffd84d]/15"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#ffd84d]">
              Canvas
            </p>
            <h2 className="mt-4 text-2xl font-black">Open workflow editor</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Build upscale, generate, and delivery pipelines on the node editor.
            </p>
          </Link>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/45">
              Recent jobs
            </p>
            <h2 className="mt-4 text-2xl font-black">No jobs yet</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Queue activity and render history will appear here after your first
              workflow run.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/45">
              OAuth
            </p>
            <h2 className="mt-4 text-2xl font-black">Google OAuth ready</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Sign-in plumbing is ready for Google provider configuration.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
