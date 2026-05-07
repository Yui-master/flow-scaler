import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUnique, verifyPasswordMock } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  verifyPasswordMock: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: {
    AUTH_GOOGLE_ID: "google-id",
    AUTH_GOOGLE_SECRET: "google-secret",
  },
}));

vi.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: userFindUnique,
    },
  },
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({ name: "prisma-adapter" })),
}));

vi.mock("./password", () => ({
  verifyPassword: verifyPasswordMock,
}));

vi.mock("next-auth", () => ({}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google" })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config) => ({ id: "credentials", ...config })),
}));

import { authConfig } from "./config";

const credentialsProvider = authConfig.providers.find(
  (provider) => typeof provider === "object" && provider.id === "credentials",
) as { authorize: (credentials: unknown, request: unknown) => Promise<unknown> } | undefined;

const authorize = credentialsProvider?.authorize;

describe("credentials provider", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    verifyPasswordMock.mockReset();
  });

  it("authorizes valid username/password", async () => {
    userFindUnique.mockResolvedValue({
      id: "user_1",
      name: "Yui",
      email: "yui@example.com",
      image: "https://example.com/yui.png",
      passwordHash: "hashed-password",
    });
    verifyPasswordMock.mockResolvedValue(true);

    await expect(
      authorize?.({ username: "Yui_Master", password: "password123" }, {}),
    ).resolves.toEqual({
      id: "user_1",
      name: "Yui",
      email: "yui@example.com",
      image: "https://example.com/yui.png",
    });

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { username: "yui_master" },
      select: { id: true, name: true, email: true, image: true, passwordHash: true },
    });
    expect(verifyPasswordMock).toHaveBeenCalledWith("password123", "hashed-password");
  });

  it("rejects unknown username", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(
      authorize?.({ username: "missing", password: "password123" }, {}),
    ).resolves.toBeNull();

    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });

  it("rejects wrong password", async () => {
    userFindUnique.mockResolvedValue({
      id: "user_1",
      name: "Yui",
      email: "yui@example.com",
      image: null,
      passwordHash: "hashed-password",
    });
    verifyPasswordMock.mockResolvedValue(false);

    await expect(
      authorize?.({ username: "yui", password: "wrong-password" }, {}),
    ).resolves.toBeNull();
  });
});

describe("auth sessions", () => {
  it("uses JWT sessions", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
  });

  it("copies token subject to session user id", async () => {
    const session = {
      user: { name: "Yui", email: "yui@example.com", image: null },
      expires: "2099-01-01T00:00:00.000Z",
    };

    expect(
      authConfig.callbacks?.session?.({
        session,
        token: { sub: "user_1" },
      } as Parameters<NonNullable<typeof authConfig.callbacks.session>>[0]),
    ).toMatchObject({
      user: {
        id: "user_1",
        name: "Yui",
        email: "yui@example.com",
        image: null,
      },
    });
  });
});