import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const enrollmentRequestSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    batchStartDate: {
      type: Date,
      required: true,
    },
    paymentSlipUrl: {
      type: String,
      required: true,
    },
    paymentSlipKey: {
      type: String,
      default: "",
    },
    amount: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type EnrollmentRequestDoc = InferSchemaType<typeof enrollmentRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

const EnrollmentRequest: Model<EnrollmentRequestDoc> =
  models.EnrollmentRequest ||
  mongoose.model<EnrollmentRequestDoc>("EnrollmentRequest", enrollmentRequestSchema);

export default EnrollmentRequest;
