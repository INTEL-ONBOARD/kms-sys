import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Added for Login & Registration
    role: { type: String, enum: ["student", "instructor", "admin"], default: "student" },
    
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

const User: Model<UserDoc> = models.User || mongoose.model<UserDoc>("User", userSchema);

export default User;