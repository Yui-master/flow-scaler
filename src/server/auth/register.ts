"use server";

import { db } from "~/server/db";

import { hashPassword } from "./password";
import { registerInputSchema, type RegisterInput } from "./validation";

type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerInputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ username: parsed.data.username }, { email: parsed.data.email }],
    },
    select: { username: true, email: true },
  });

  if (existingUser?.username === parsed.data.username) {
    return { ok: false, error: "Username is already taken." };
  }

  if (existingUser?.email === parsed.data.email) {
    return { ok: false, error: "Email is already registered." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email,
      passwordHash,
      timezone: "UTC",
      defaultConfig: {},
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id };
}