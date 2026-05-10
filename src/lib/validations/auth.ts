import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;

/* Shared by RegisterForm client validation and registerUser server action. */
export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, "Name must be at least 2 characters")
    .max(MAX_NAME_LENGTH, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(MAX_EMAIL_LENGTH, "Email is too long"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters")
    .max(MAX_PASSWORD_LENGTH, "Password is too long"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(MAX_EMAIL_LENGTH, "Email is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(MAX_PASSWORD_LENGTH, "Password is too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
