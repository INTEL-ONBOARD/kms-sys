import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "instructor", "lecturer", "super_admin"]).optional().default("student"),
  phone: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional().default("active"),
  isActivated: z.boolean().optional().default(true),
  dob: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentContact: z.string().optional(),
  department: z.string().optional(),
  expertise: z.string().optional(),
  qualification: z.string().optional(),
  linkedin: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["student", "instructor", "lecturer", "super_admin"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
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

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  role: z.enum(["student", "lecturer", "super_admin", "instructor"]).default("student"),
  name: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  dob: z.string().trim().optional(),
  parentName: z.string().trim().optional(),
  parentContact: z.string().trim().optional(),
  department: z.string().trim().optional(),
  expertise: z.string().trim().optional(),
  qualification: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type InviteUserInput = z.input<typeof inviteUserSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
