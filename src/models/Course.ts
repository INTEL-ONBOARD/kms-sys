import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructor: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true }, 
    status: { type: String, default: "draft" }, 
    published: { type: Boolean, default: false },
    enrollments: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type CourseDoc = InferSchemaType<typeof courseSchema> & { _id: mongoose.Types.ObjectId };

const Course: Model<CourseDoc> = models.Course || mongoose.model<CourseDoc>("Course", courseSchema);

export default Course;