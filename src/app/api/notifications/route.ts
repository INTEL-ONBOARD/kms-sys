import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.id && !token.sub)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (token.id || token.sub) as string;

    await connectToDatabase();

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error: any) {
    console.error("Unified Notifications GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.id && !token.sub)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (token.id || token.sub) as string;
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    await connectToDatabase();

    if (notificationId) {
      await Notification.updateOne({ _id: notificationId, userId }, { read: true });
    } else {
      await Notification.updateMany({ userId, read: false }, { read: true });
    }

    return NextResponse.json({ message: "Notifications updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Unified Notifications PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
