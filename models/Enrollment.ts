import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const enrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type EnrollmentDoc = InferSchemaType<typeof enrollmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Enrollment: Model<EnrollmentDoc> =
  models.Enrollment || mongoose.model<EnrollmentDoc>("Enrollment", enrollmentSchema);

export default Enrollment;
