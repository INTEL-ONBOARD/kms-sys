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
  },
  { _id: false } // no separate _id for each slot
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
    enrollments: { type: Number, default: 0 },

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

export type ScheduleSlot = {
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;
  endTime: string;
  location: string;
};

export type CourseDoc = InferSchemaType<typeof courseSchema> & { _id: mongoose.Types.ObjectId };

const Course: Model<CourseDoc> = models.Course || mongoose.model<CourseDoc>("Course", courseSchema);

export default Course;
