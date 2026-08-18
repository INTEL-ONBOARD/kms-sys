export type ScheduleSlot = {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  location: string;  // "Hall 15"
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
};

export type EnrollmentInput = {
  userId: string;
  courseId: string;
};
