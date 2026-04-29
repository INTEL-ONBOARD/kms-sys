export type CourseInput = {
  title: string;
  description?: string;
  instructor: string;
  published?: boolean;
};

export type EnrollmentInput = {
  userId: string;
  courseId: string;
};
