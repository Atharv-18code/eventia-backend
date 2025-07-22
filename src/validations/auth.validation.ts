import { z } from "zod";

export const checkUserSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").max(50, "Name can't exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long").max(128, "Password can't exceed 128 characters"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().optional(),
  newPassword: z.string().optional(),
});
