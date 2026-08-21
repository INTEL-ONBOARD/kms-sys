import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";

/**
 * Retrieves notifications for a given user.
 */
export async function getUserNotifications(userId: string, limit = 30) {
  await connectToDatabase();

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount };
}

/**
 * Marks a single or all notifications as read for a user.
 */
export async function markNotificationsAsRead(userId: string, notificationId?: string) {
  await connectToDatabase();

  if (notificationId) {
    await Notification.updateOne({ _id: notificationId, userId }, { read: true });
  } else {
    await Notification.updateMany({ userId, read: false }, { read: true });
  }

  return { message: "Notifications updated successfully" };
}

/**
 * Creates a notification.
 */
export async function createNotification(input: {
  userId: string | mongoose.Types.ObjectId;
  type: string;
  message: string;
  link?: string;
}) {
  await connectToDatabase();
  return await Notification.create(input);
}
