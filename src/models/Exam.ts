import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    date: { type: Date, required: true },
    duration: { type: Number, default: 120 }, // in minutes
    location: { type: String, default: "Online" },
    type: {
      type: String,
      enum: ["midterm", "final", "quiz", "practical"],
      default: "quiz",
    },
    maxMarks: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    results: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        marks: { type: Number, required: true },
        maxMarks: { type: Number, default: 100 },
        attendanceMarks: { type: Number, default: null },
        percentage: { type: Number, default: 0 },
        grade: { type: String, default: "A" },
        feedback: { type: String, default: "" },
        gradedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type ExamDoc = InferSchemaType<typeof examSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Exam: Model<ExamDoc> =
  models.Exam || mongoose.model<ExamDoc>("Exam", examSchema);

export default Exam;
