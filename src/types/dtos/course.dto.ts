import { z } from "zod";

export const scheduleSlotSchema = z.object({
  dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().optional().default(""),
  type: z.enum(["physical", "online"]).optional().default("physical"),
});

export const assessmentItemSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  type: z.enum(["assignment", "exam", "coursework", "attendance", "quiz", "project", "other"]).default("assignment"),
  weight: z.number().min(0).default(20),
});

export const gradingBreakdownSchema = z.object({
  assignmentsWeight: z.number().default(20),
  courseWorkWeight: z.number().default(30),
  finalExamWeight: z.number().default(40),
  attendanceWeight: z.number().default(10),
});

export const gradeBoundarySchema = z.object({
  grade: z.string().min(1, "Grade label is required").trim(),
  minScore: z.number().min(0).max(100),
  gpaPoint: z.number().min(0).max(4.0).default(4.0),
  description: z.string().optional().default(""),
  color: z.string().optional().default("emerald"),
});

export const moduleTopicSchema = z.object({
  _id: z.string().optional(),
  moduleNumber: z.string().min(1, "Module number is required").trim(),
  title: z.string().min(1, "Module title is required").trim(),
  description: z.string().optional().default(""),
  lessonsCount: z.number().min(1).optional().default(4),
  duration: z.string().optional().default("10 Hours"),
  status: z.string().optional().default("Upcoming"),
  topics: z.array(z.string()).optional().default([]),
});

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().trim().optional().default(""),
  instructor: z.string().min(1, "Instructor is required").trim(),
  instructorId: z.string().optional(),
  category: z.string().trim().optional().default("General"),
  price: z.string().trim().optional().default("Free"),
  status: z.string().optional().default("draft"),
  published: z.boolean().optional().default(false),
  colorCode: z.string().trim().optional().default("#5A67D8"),
  schedule: z.array(scheduleSlotSchema).optional().default([]),
  modules: z.array(moduleTopicSchema).optional().default([]),
  assessmentItems: z.array(assessmentItemSchema).optional(),
  gradingBreakdown: gradingBreakdownSchema.optional(),
  gradingScale: z.array(gradeBoundarySchema).optional(),
  credits: z.number().min(1).max(30).optional().default(3),
  capacity: z.number().min(1).optional().default(50),
  nextBatchStartDate: z.string().or(z.date()).optional().nullable(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  instructor: z.string().min(1).trim().optional(),
  instructorId: z.string().optional(),
  category: z.string().trim().optional(),
  price: z.string().trim().optional(),
  status: z.string().optional(),
  published: z.boolean().optional(),
  colorCode: z.string().trim().optional(),
  schedule: z.array(scheduleSlotSchema).optional(),
  modules: z.array(moduleTopicSchema).optional(),
  assessmentItems: z.array(assessmentItemSchema).optional(),
  gradingBreakdown: gradingBreakdownSchema.optional(),
  gradingScale: z.array(gradeBoundarySchema).optional(),
  credits: z.number().min(1).max(30).optional(),
  capacity: z.number().min(1).optional(),
  nextBatchStartDate: z.string().or(z.date()).optional().nullable(),
});

export const enrollCourseSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  courseId: z.string().min(1, "courseId is required"),
  batchStartDate: z.string().or(z.date()).optional().nullable(),
});

export const studentEnrollmentSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  studentId: z.string().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type EnrollCourseInput = z.infer<typeof enrollCourseSchema>;
export type StudentEnrollmentInput = z.infer<typeof studentEnrollmentSchema>;
