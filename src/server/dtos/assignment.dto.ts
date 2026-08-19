import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().trim().optional().default(""),
  courseId: z.string().min(1, "Course ID is required"),
  dueDate: z.string().or(z.date()),
  points: z.number().min(0).default(100),
  status: z.enum(["draft", "open", "closed"]).default("open"),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  courseId: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  points: z.number().min(0).optional(),
  status: z.enum(["draft", "open", "closed"]).optional(),
});

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  grade: z.coerce.number().min(0, "Grade must be at least 0").max(100, "Grade cannot exceed 100"),
  feedback: z.string().trim().optional().default(""),
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  fileUrl: z.string().min(1, "File URL or attachment is required"),
  comments: z.string().trim().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
