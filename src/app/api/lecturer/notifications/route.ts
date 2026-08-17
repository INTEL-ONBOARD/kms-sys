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

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const notifications = await Notification.find({ userId: token.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("Notifications GET API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    await Notification.updateMany({ userId: token.id, read: false }, { read: true });

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Notifications PATCH API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
