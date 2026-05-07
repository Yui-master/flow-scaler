import { redirect } from "next/navigation";

import { auth } from "~/server/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
      <LoginForm />
    </main>
  );
}
