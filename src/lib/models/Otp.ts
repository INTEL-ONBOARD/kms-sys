import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 600 seconds = 10 minutes
  },
});

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
