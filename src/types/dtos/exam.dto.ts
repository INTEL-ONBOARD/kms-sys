import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  courseId: z.string().min(1, "Course ID is required"),
  date: z.string().or(z.date()),
  durationMinutes: z.number().positive("Duration must be greater than 0").default(60),
  totalMarks: z.number().positive().default(100),
  status: z.enum(["draft", "scheduled", "ongoing", "completed"]).default("scheduled"),
});

export const updateExamSchema = z.object({
  title: z.string().min(1).trim().optional(),
  courseId: z.string().optional(),
  date: z.string().or(z.date()).optional(),
  durationMinutes: z.number().positive().optional(),
  totalMarks: z.number().positive().optional(),
  status: z.enum(["draft", "scheduled", "ongoing", "completed"]).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
