import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";

Course; // Prevent tree-shaking

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * A single, flattened calendar event ready for the frontend to render.
 * One event = one schedule slot from one enrolled course.
 */
export type CalendarEvent = {
  courseId:      string;
  title:         string;
  colorCode:     string;
  dayOfWeek:     string;   // e.g. "Monday"
  startTime:     string;   // e.g. "08:00"
  endTime:       string;   // e.g. "10:00"
  location:      string;
  startHour:     number;   // integer parsed from startTime (8)
  durationHours: number;   // endHour - startHour (2)
};

// ── Helper ─────────────────────────────────────────────────────────────────

/** Parse "08:00" → 8. Safe fallback if missing. */
function parseHour(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 8; // default fallback
  const [h] = timeStr.split(":");
  return parseInt(h, 10) || 8;
}

// ── GET /api/student/calendar ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate via NextAuth JWT (same pattern as /api/student/dashboard)
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.sub && !token.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = token.id || token.sub;

    // 2. Find all active enrollments for this student
    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title colorCode schedule") // only fetch fields needed
      .lean();
    
    console.log(`[Calendar API] Found ${enrollments.length} enrollments for userId: ${userId}`);
    console.log(`[Calendar API] Enrollments:`, JSON.stringify(enrollments, null, 2));

    // 3. Flatten: enrollment[] × schedule[] → CalendarEvent[]
    const events: CalendarEvent[] = [];

    for (const enrollment of enrollments) {
      // After populate, courseId is the full Course document (or null if deleted)
      const course = enrollment.courseId as unknown as {
        _id: { toString(): string };
        title: string;
        colorCode: string;
        schedule: {
          dayOfWeek: string;
          startTime: string;
          endTime: string;
          location: string;
        }[];
      } | null;

      if (!course || !Array.isArray(course.schedule)) continue;

      for (const slot of course.schedule) {
        const startHour = parseHour(slot.startTime);
        const endHour   = parseHour(slot.endTime);

        events.push({
          courseId:      course._id.toString(),
          title:         course.title,
          colorCode:     course.colorCode || "#5A67D8",
          dayOfWeek:     slot.dayOfWeek,
          startTime:     slot.startTime,
          endTime:       slot.endTime,
          location:      slot.location || "",
          startHour,
          durationHours: Math.max(1, endHour - startHour), // at least 1 row
        });
      }
    }

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Student Calendar API Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch calendar data", error: String(error) },
      { status: 500 }
    );
  }
}
