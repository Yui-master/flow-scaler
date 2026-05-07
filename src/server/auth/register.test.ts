import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { registerUser } from "./register";

const { userFindFirst, userCreate } = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    user: {
      findFirst: userFindFirst,
      create: userCreate,
    },
  },
}));

vi.mock("./password", () => ({
  hashPassword: vi.fn(async () => "hashed-password"),
}));

describe("registerUser", () => {
  beforeEach(() => {
    userFindFirst.mockReset();
    userCreate.mockReset();
  });

  it("creates a user with normalized username/email and hashed password", async () => {
    userFindFirst.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      id: "user_1",
      name: "Yui",
      username: "yui_master",
      email: "yui@example.com",
    });

    const result = await registerUser({
      name: "Yui",
      username: "Yui_Master",
      email: "YUI@EXAMPLE.COM",
      password: "password123",
    });

    expect(result).toEqual({ ok: true, userId: "user_1" });
    expect(userCreate).toHaveBeenCalledWith({
      data: {
        name: "Yui",
        username: "yui_master",
        email: "yui@example.com",
        passwordHash: "hashed-password",
        timezone: "UTC",
        defaultConfig: {},
      },
      select: { id: true },
    });
  });

  it("rejects duplicate username", async () => {
    userFindFirst.mockResolvedValue({ username: "yui", email: "other@example.com" });

    const result = await registerUser({
      name: "Yui",
      username: "yui",
      email: "yui@example.com",
      password: "password123",
    });

    expect(result).toEqual({ ok: false, error: "Username is already taken." });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("rejects duplicate email", async () => {
    userFindFirst.mockResolvedValue({ username: "other", email: "yui@example.com" });

    const result = await registerUser({
      name: "Yui",
      username: "yui",
      email: "yui@example.com",
      password: "password123",
    });

    expect(result).toEqual({ ok: false, error: "Email is already registered." });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("rejects weak passwords", async () => {
    const result = await registerUser({
      name: "Yui",
      username: "yui",
      email: "yui@example.com",
      password: "short",
    });

    expect(result.ok).toBe(false);
    expect(userCreate).not.toHaveBeenCalled();
  });
});