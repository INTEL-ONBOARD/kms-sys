import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const liveClassSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String, default: "" },
    status: {
      type: String,
      enum: ["upcoming", "live", "ended", "cancelled"],
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
