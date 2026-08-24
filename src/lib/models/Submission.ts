import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    files: [{ type: String }], // URLs to submitted files
    content: { type: String, default: "" }, // Text submission
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number, default: null }, // null = ungraded
    feedback: { type: String, default: "" },
    status: { type: String, enum: ["submitted", "graded", "late"], default: "submitted" }
  },
  { timestamps: true, versionKey: false }
);

export type SubmissionDoc = InferSchemaType<typeof submissionSchema> & { _id: mongoose.Types.ObjectId };

const Submission: Model<SubmissionDoc> =
  models.Submission || mongoose.model<SubmissionDoc>("Submission", submissionSchema);

export default Submission;
