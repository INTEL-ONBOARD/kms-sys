import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    dueDate: { type: Date, required: true },
    maxPoints: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ["open", "closed", "graded"],
      default: "open",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type AssignmentDoc = InferSchemaType<typeof assignmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Assignment: Model<AssignmentDoc> =
  models.Assignment || mongoose.model<AssignmentDoc>("Assignment", assignmentSchema);

export default Assignment;
