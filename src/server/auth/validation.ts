import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be at most 32 characters.")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores.",
  )
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

export const registerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  username: usernameSchema,
  email: z.string().trim().email("Enter a valid email.").toLowerCase(),
  password: passwordSchema,
});

export const credentialsInputSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type CredentialsInput = z.infer<typeof credentialsInputSchema>;