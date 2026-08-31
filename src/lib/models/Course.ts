import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

// Sub-schema: a single recurring weekly class slot for a course
const scheduleSlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    startTime: { type: String, required: true, trim: true }, // e.g. "08:00"
    endTime:   { type: String, required: true, trim: true }, // e.g. "10:00"
    location:  { type: String, default: "",   trim: true }, // e.g. "Hall 15"
    type:      { type: String, enum: ["physical", "online"], default: "physical" },
  },
  { _id: false } // no separate _id for each slot
);

// Sub-schema: Dynamic assessment and assignment breakdown items configured by the lecturer
const assessmentItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ["assignment", "exam", "coursework", "attendance", "quiz", "project", "other"], 
      default: "assignment" 
    },
    weight: { type: Number, required: true, default: 20 }, // Allocated marks / percentage
  },
  { _id: true }
);

// Sub-schema: Assessment and grading breakdown allocated by the lecturer (legacy compatibility)
const gradingBreakdownSchema = new Schema(
  {
    assignmentsWeight: { type: Number, default: 20 },
    courseWorkWeight:  { type: Number, default: 30 },
    finalExamWeight:   { type: Number, default: 40 },
    attendanceWeight:  { type: Number, default: 10 },
  },
  { _id: false }
);

// Sub-schema: Lecturer-configured grade boundaries & grading scale (e.g. A >= 70)
const gradeBoundarySchema = new Schema(
  {
    grade:       { type: String, required: true, trim: true }, // e.g. "A", "B", "C", "S", "F"
    minScore:    { type: Number, required: true }, // e.g. 70, 60, 50
    gpaPoint:    { type: Number, default: 4.0 }, // e.g. 4.0, 3.0, 2.0
    description: { type: String, default: "", trim: true }, // e.g. "Distinction"
    color:       { type: String, default: "emerald", trim: true }, // e.g. "emerald", "blue", "amber", "rose"
  },
  { _id: false }
);

// Sub-schema: Dynamic course curriculum modules configured when creating or editing a course
const moduleSchema = new Schema(
  {
    moduleNumber: { type: String, required: true, trim: true }, // e.g. "01", "Module 1"
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: "", trim: true },
    lessonsCount: { type: Number, default: 4, min: 1 },
    duration:     { type: String, default: "10 Hours", trim: true },
    status:       { type: String, default: "Upcoming", trim: true },
    topics:       { type: [String], default: [] },
  },
  { _id: true }
);

const courseSchema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructor:  { type: String, required: true, trim: true },
    instructorId: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    category:    { type: String, required: true, trim: true },
    price:       { type: String, required: true, trim: true },
    status:      { type: String, default: "draft" },
    published:   { type: Boolean, default: false },
    credits:     { type: Number, default: 3, min: 1, max: 30 },
    enrollments: { type: Number, default: 0 },
    capacity:    { type: Number, default: 50, min: 1 },
    nextBatchStartDate: { type: Date, default: null },

    // Dynamic curriculum modules configured by admin/lecturer
    modules: { type: [moduleSchema], default: [] },

    // Lecturer-configured dynamic assessment items & assignments
    assessmentItems: {
      type: [assessmentItemSchema],
      default: () => [
        { name: "Assignments", type: "assignment", weight: 20 },
        { name: "Course work 1", type: "coursework", weight: 30 },
        { name: "Final exam", type: "exam", weight: 40 },
        { name: "Attendance", type: "attendance", weight: 10 },
      ],
    },

    // Lecturer-configured assessment grade breakdown (for legacy compatibility)
    gradingBreakdown: {
      type: gradingBreakdownSchema,
      default: () => ({
        assignmentsWeight: 20,
        courseWorkWeight: 30,
        finalExamWeight: 40,
        attendanceWeight: 10,
      }),
    },

    // Lecturer-configured dynamic grading scale & grade boundaries (e.g. A >= 70)
    gradingScale: {
      type: [gradeBoundarySchema],
      default: () => [
        { grade: "A", minScore: 80, gpaPoint: 4.0, description: "Distinction / First Class", color: "emerald" },
        { grade: "B", minScore: 70, gpaPoint: 3.0, description: "Very Good / Upper Second", color: "blue" },
        { grade: "C", minScore: 60, gpaPoint: 2.0, description: "Good / Lower Second", color: "amber" },
        { grade: "S", minScore: 50, gpaPoint: 1.0, description: "Pass", color: "purple" },
        { grade: "F", minScore: 0, gpaPoint: 0.0, description: "Fail", color: "rose" },
      ],
    },

    // Weekly recurring timetable slots for this course
    schedule:  { type: [scheduleSlotSchema], default: [] },

    // Hex colour code used to render this course's blocks on the student calendar
    // e.g. "#5CB5F9". Defaults to a neutral slate if not set by admin.
    colorCode: { type: String, default: "#5A67D8", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type GradeBoundary = {
  grade: string;
  minScore: number;
  gpaPoint: number;
  description?: string;
  color?: string;
};

export type AssessmentItem = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  type: "assignment" | "exam" | "coursework" | "attendance" | "quiz" | "project" | "other";
  weight: number;
};

export type ScheduleSlot = {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;
  endTime: string;
  location: string;
  type?: "physical" | "online";
};

export type CourseModule = {
  _id?: mongoose.Types.ObjectId;
  moduleNumber: string;
  title: string;
  description?: string;
  lessonsCount?: number;
  duration?: string;
  status?: string;
  topics?: string[];
};

export type CourseDoc = InferSchemaType<typeof courseSchema> & { _id: mongoose.Types.ObjectId };

const Course: Model<CourseDoc> = models.Course || mongoose.model<CourseDoc>("Course", courseSchema);

export default Course;
