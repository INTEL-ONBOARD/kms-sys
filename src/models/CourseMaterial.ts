import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const courseMaterialSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lecturerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    materialType: {
      type: String,
      enum: ["notes", "slides", "tutorial", "assignment", "video", "other"],
      default: "notes",
      index: true,
    },
    fileName: { type: String, required: true, trim: true },
    fileKey: { type: String, required: true, unique: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true }, // Size in bytes
    mimeType: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type CourseMaterialDoc = InferSchemaType<typeof courseMaterialSchema> & {
  _id: mongoose.Types.ObjectId;
};

const CourseMaterial: Model<CourseMaterialDoc> =
  models.CourseMaterial || mongoose.model<CourseMaterialDoc>("CourseMaterial", courseMaterialSchema);

export default CourseMaterial;
