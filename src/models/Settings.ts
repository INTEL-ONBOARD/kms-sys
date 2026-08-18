import mongoose, { InferSchemaType, Model, models, Schema } from "mongoose";

const settingsSchema = new Schema(
  {
    // A sentinel field to enforce a single document (Singleton pattern)
    _singleton: { type: String, default: "global", unique: true },

    // General Configuration
    platformName:  { type: String, default: "Wise East University", trim: true },
    primaryDomain: { type: String, default: "lms.wiseeast.edu", trim: true },
    supportEmail:  { type: String, default: "support@wiseeast.edu", trim: true },
    timezone:      { type: String, default: "UTC" },

    // Payments & Currency
    defaultCurrency:      { type: String, default: "USD" },
    activePaymentGateway: { type: String, default: "stripe" },

    // Feature Flags
    features: {
      discussionForums: { type: Boolean, default: true },
      gamification:     { type: Boolean, default: true },
      liveSessions:     { type: Boolean, default: true },
      certificates:     { type: Boolean, default: true },
      maintenanceMode:  { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

// Fix for Next.js hot-reloading Mongoose schemas
if (models.Settings) {
  delete models.Settings;
}

const Settings: Model<SettingsDoc> = mongoose.model<SettingsDoc>("Settings", settingsSchema);

export default Settings;
