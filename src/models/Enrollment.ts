import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

// Define the Mongoose Schema for Enrollment
// This acts as a junction table connecting a Student (User) to a specific Course
const enrollmentSchema = new Schema(
  {
    // Reference to the User (Student) who is being enrolled
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    // Reference to the Course they are enrolled in
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    
    // Track the student's learning progress (percentage from 0 to 100)
    progress: { type: Number, min: 0, max: 100, default: 0 }
  },
  {
    // Automatically adds 'createdAt' and 'updatedAt' fields
    timestamps: true,
    // Disables the default '__v' versioning field in MongoDB for cleaner documents
    versionKey: false
  }
);

// Compound Index: Ensure a student can only be enrolled in the exact same course once
// This prevents duplicate enrollments in the database
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Automatically infer the TypeScript type directly from the Schema definition
// We also explicitly add the '_id' field type
export type EnrollmentDoc = InferSchemaType<typeof enrollmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

// Create and export the Model securely
// 'models.Enrollment || ...' prevents Next.js from crashing during hot-reloads in development
const Enrollment: Model<EnrollmentDoc> =
  models.Enrollment || mongoose.model<EnrollmentDoc>("Enrollment", enrollmentSchema);

export default Enrollment;