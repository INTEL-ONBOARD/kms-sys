import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const userSchema = new Schema(
  {
    // Basic User Information
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, 
    
    // Role-Based Access Control (RBAC) 
    role: { 
      type: String, 
      enum: ["student", "instructor", "super_admin"], 
      default: "student" 
    },
    
    // User Account Status - Added based on specification core entities
    status: { 
      type: String, 
      enum: ["active", "inactive", "suspended"], 
      default: "active" 
    },
    
    // Fields for Password Reset (Retained from original code)
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },

    // Fields for Account Activation (Retained from original code)
    isActivated: { type: Boolean, default: false },
    activationToken: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

const User: Model<UserDoc> = models.User || mongoose.model<UserDoc>("User", userSchema);

export default User;