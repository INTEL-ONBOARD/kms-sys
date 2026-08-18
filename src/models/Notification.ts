import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["enrollment", "submission", "grading", "message", "announcement", "system"], default: "system" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: "" }
  },
  { timestamps: true, versionKey: false }
);

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: mongoose.Types.ObjectId };

const Notification: Model<NotificationDoc> =
  models.Notification || mongoose.model<NotificationDoc>("Notification", notificationSchema);

export default Notification;
