import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "instructor", "lecturer"]).default("student"),
  phone: z.string().trim().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentContact: z.string().optional(),
  department: z.string().optional(),
  expertise: z.string().optional(),
  qualification: z.string().optional(),
  linkedin: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const activateAccountSchema = z.object({
  token: z.string().min(1, "Activation token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const checkActivationSchema = z.object({
  token: z.string().min(1, "Activation token is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
