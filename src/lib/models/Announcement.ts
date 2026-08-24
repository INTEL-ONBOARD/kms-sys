import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const announcementSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lecturerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    notifyStudents: { type: Boolean, default: false },
    attachments: [{ type: String }]
  },
  { timestamps: true, versionKey: false }
);

export type AnnouncementDoc = InferSchemaType<typeof announcementSchema> & { _id: mongoose.Types.ObjectId };

const Announcement: Model<AnnouncementDoc> =
  models.Announcement || mongoose.model<AnnouncementDoc>("Announcement", announcementSchema);

export default Announcement;
