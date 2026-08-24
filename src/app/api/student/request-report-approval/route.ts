import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["student"]);
    await connectToDatabase();

    const admins = await User.find({ role: { $in: ["super_admin", "admin"] } }).lean();
    const studentUser = await User.findById(authUser.id).lean();

    // Create a notification for each admin
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      type: "system",
      message: `Student ${studentUser?.name || authUser.name || "A student"} (${studentUser?.email || authUser.email}) has requested admin approval to download their official academic report.`,
      link: "/admin/users",
      read: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return successResponse(
      { requested: true },
      "Approval request submitted to administrators successfully. You will be able to download your report once approved.",
      200
    );
  } catch (error) {
    return handleApiError(error, "POST /api/student/request-report-approval");
  }
}
