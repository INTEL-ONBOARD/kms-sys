import { z } from "zod";

export const generateUploadUrlSchema = z.object({
  fileName: z.string().min(1, "fileName is required").trim(),
  fileType: z.string().min(1, "fileType is required").trim(),
  fileSize: z.number().positive("fileSize must be positive").optional(),
  courseId: z.string().min(1, "courseId is required").trim(),
});

export const createMaterialSchema = z.object({
  courseId: z.string().min(1, "courseId is required").trim(),
  title: z.string().min(1, "title is required").trim(),
  description: z.string().trim().optional().default(""),
  fileKey: z.string().min(1, "fileKey is required").trim(),
  fileName: z.string().min(1, "fileName is required").trim(),
  fileSize: z.number().nonnegative().optional().default(0),
  mimeType: z.string().trim().optional().default("application/octet-stream"),
  fileType: z.string().trim().optional().default("other"),
  category: z.string().trim().optional().default("General"),
  isPublished: z.boolean().optional().default(true),
});

export type GenerateUploadUrlInput = z.infer<typeof generateUploadUrlSchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
