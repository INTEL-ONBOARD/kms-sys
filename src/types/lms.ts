export type ScheduleSlot = {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  location: string;  // "Hall 15"
  type?: "physical" | "online";
};

export type AssessmentItem = {
  _id?: string;
  name: string;
  type?: "assignment" | "exam" | "coursework" | "attendance" | "quiz" | "project" | "other";
  weight: number;
};

export type GradingBreakdown = {
  assignmentsWeight?: number;
  courseWorkWeight?: number;
  finalExamWeight?: number;
  attendanceWeight?: number;
};

export type GradeBoundary = {
  grade: string;
  minScore: number;
  gpaPoint: number;
  description?: string;
  color?: string;
};

export type CourseInput = {
  title: string;
  description?: string;
  instructor: string;
  category?: string;
  price?: string;
  status?: string;
  published?: boolean;
  colorCode?: string;
  schedule?: ScheduleSlot[];
  gradingBreakdown?: GradingBreakdown;
  assessmentItems?: AssessmentItem[];
  gradingScale?: GradeBoundary[];
  credits?: number;
};

export type EnrollmentInput = {
  userId: string;
  courseId: string;
};
