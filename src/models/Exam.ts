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
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
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
