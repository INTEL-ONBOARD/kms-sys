import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const liveClassSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    instructor: { type: String, default: "Course Lecturer" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String, default: "" },
    classType: {
      type: String,
      enum: ["online", "physical"],
      default: "online",
    },
    location: { type: String, default: "" },
    recordingUrl: { type: String, default: "" },
    resources: [{ type: String }],
    materialId: { type: Schema.Types.ObjectId, ref: "CourseMaterial" },
    materials: [{ type: Schema.Types.ObjectId, ref: "CourseMaterial" }],
    status: {
      type: String,
      enum: ["upcoming", "live", "ended", "cancelled", "rescheduled"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type LiveClassDoc = InferSchemaType<typeof liveClassSchema> & {
  _id: mongoose.Types.ObjectId;
};

const LiveClass: Model<LiveClassDoc> =
  models.LiveClass || mongoose.model<LiveClassDoc>("LiveClass", liveClassSchema);

export default LiveClass;
