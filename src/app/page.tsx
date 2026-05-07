import Link from "next/link";

import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black tracking-tight text-[#ffd84d]">
          FlowScaler
        </Link>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-[#ffd84d] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#ffe680]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-[#ffd84d]/60 hover:text-[#ffd84d]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#ffd84d] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#ffe680]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-[#ffd84d]/30 bg-[#ffd84d]/10 px-4 py-2 text-sm font-semibold text-[#ffd84d]">
            AI media workflows at browser speed
          </p>
          <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] sm:text-7xl">
            Scale every render, upscale, and delivery workflow from one canvas.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            FlowScaler helps teams compose AI media pipelines, route jobs, and
            monitor outputs without leaving the browser.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={isSignedIn ? "/dashboard" : "/register"}
              className="rounded-full bg-[#ffd84d] px-8 py-4 text-center text-base font-black text-black shadow-[0_0_40px_rgba(255,216,77,0.25)] transition hover:bg-[#ffe680]"
            >
              {isSignedIn ? "Open dashboard" : "Start scaling"}
            </Link>
            <Link
              href="/workflows/editor"
              className="rounded-full border border-white/15 px-8 py-4 text-center text-base font-bold text-white transition hover:border-[#ffd84d]/60 hover:text-[#ffd84d]"
            >
              Preview workflow editor
            </Link>
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/50">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ffd84d]/20 blur-3xl" />
          <div className="relative rounded-[1.5rem] border border-white/10 bg-[#101010] p-5">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-sm font-bold text-white/70">Workflow mockup</span>
              <span className="rounded-full bg-[#ffd84d]/15 px-3 py-1 text-xs font-bold text-[#ffd84d]">
                Ready
              </span>
            </div>
            <div className="space-y-4">
              {[
                ["Upload source", "4K interview footage"],
                ["Enhance", "AI upscale + denoise"],
                ["Generate variants", "Social crops + previews"],
                ["Deliver", "Queue exports to storage"],
              ].map(([title, detail], index) => (
                <div
                  key={title}
                  className="grid grid-cols-[2.5rem_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd84d] font-black text-black">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="font-bold text-white">{title}</h2>
                    <p className="text-sm text-white/55">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}