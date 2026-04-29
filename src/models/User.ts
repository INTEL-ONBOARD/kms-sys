import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const userSchema = new Schema(
  {
    // --- Basic User Information ---
    // Kept 'name' for backward compatibility with your existing code
    name: { type: String, required: true, trim: true }, 
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, 
    
    // --- Role-Based Access Control (RBAC) ---
    // Added 'lecturer' to support the new Stepper UI role selection
    role: { 
      type: String, 
      enum: ["student", "instructor", "lecturer", "super_admin"], 
      default: "student" 
    },
    
    // --- User Account Status ---
    status: { 
      type: String, 
      enum: ["active", "inactive", "suspended"], 
      default: "active" 
    },

    // --- Student Specific Fields (Populated from Stepper UI) ---
    dob: { type: String },
    address: { type: String },
    parentName: { type: String },
    parentContact: { type: String },

    // --- Lecturer/Instructor Specific Fields (Populated from Stepper UI) ---
    department: { type: String },
    expertise: { type: String },
    qualification: { type: String },
    linkedin: { type: String },
    
    // --- Fields for Password Reset ---
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },

    // --- Fields for Account Activation ---
    isActivated: { type: Boolean, default: false },
    activationToken: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Automatically infer TypeScript types from the Mongoose schema
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

// Prevent Mongoose from recompiling the model in Next.js hot-reloads
const User: Model<UserDoc> = models.User || mongoose.model<UserDoc>("User", userSchema);

export default User;