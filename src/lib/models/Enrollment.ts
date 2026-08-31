import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

// Define the Mongoose Schema for Enrollment
// This acts as a junction table connecting a Student (User) to a specific Course
const enrollmentSchema = new Schema(
  {
    // Reference to the User (Student) who is being enrolled
    studentId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    
    // Reference to the Course they are enrolled in
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    
    // Batch intake start date
    batchStartDate: { type: Date, default: null },

    // Enrollment status - defaults to 'active' for instant access
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "pending"],
      default: "active",
      index: true,
    },

    // Track the student's learning progress (percentage from 0 to 100)
    progress: { type: Number, min: 0, max: 100, default: 0 },

    // Attendance marks if course has attendance in grade breakdown
    attendanceMarks: { type: Number, default: null },
  },
  {
    // Automatically adds 'createdAt' and 'updatedAt' fields
    timestamps: true,
    // Disables the default '__v' versioning field in MongoDB for cleaner documents
    versionKey: false
  }
);

// Synchronize studentId and userId before validation
enrollmentSchema.pre("validate", function (this: any) {
  if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  } else if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  }
});

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