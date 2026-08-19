import { connectToDatabase } from "@/lib/db";
import Settings from "@/models/Settings";

/**
 * Retrieves the global singleton system settings.
 */
export async function getSettings() {
  await connectToDatabase();

  let settings = await Settings.findOne({ _singleton: "global" });
  if (!settings) {
    settings = await Settings.create({ _singleton: "global" });
  }

  return { settings };
}

/**
 * Updates the global singleton system settings.
 */
export async function updateSettings(body: Record<string, any>) {
  await connectToDatabase();

  const updateData: Record<string, any> = {};
  if (body.platformName !== undefined) updateData.platformName = body.platformName;
  if (body.primaryDomain !== undefined) updateData.primaryDomain = body.primaryDomain;
  if (body.supportEmail !== undefined) updateData.supportEmail = body.supportEmail;
  if (body.timezone !== undefined) updateData.timezone = body.timezone;
  if (body.defaultCurrency !== undefined) updateData.defaultCurrency = body.defaultCurrency;
  if (body.activePaymentGateway !== undefined) updateData.activePaymentGateway = body.activePaymentGateway;

  if (body.features) {
    if (body.features.discussionForums !== undefined) updateData["features.discussionForums"] = body.features.discussionForums;
    if (body.features.gamification !== undefined) updateData["features.gamification"] = body.features.gamification;
    if (body.features.liveSessions !== undefined) updateData["features.liveSessions"] = body.features.liveSessions;
    if (body.features.certificates !== undefined) updateData["features.certificates"] = body.features.certificates;
    if (body.features.maintenanceMode !== undefined) updateData["features.maintenanceMode"] = body.features.maintenanceMode;
  }

  const updated = await Settings.findOneAndUpdate(
    { _singleton: "global" },
    { $set: updateData },
    { new: true, upsert: true }
  );

  return { settings: updated };
}
