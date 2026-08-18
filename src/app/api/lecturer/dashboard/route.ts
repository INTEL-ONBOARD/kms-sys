import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import Exam from "@/models/Exam";
import LiveClass from "@/models/LiveClass";
import Submission from "@/models/Submission";
import Announcement from "@/models/Announcement";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (token.role !== "lecturer" && token.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden: Lecturer access required" }, { status: 403 });
    }

    await connectToDatabase();

    // Lecturer user ID and name fallback handling
    const userId = token.id;
    const userName = token.name || "";

    // 1. Fetch Lecturer Courses (Match by instructorId OR instructor string fallback)
    const courses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    const courseIds = courses.map((c) => c._id);

    // 2. Parallel data fetching with Promise.all
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      enrollmentsCount,
      pendingGradesCount,
      todaysClassesCount,
      todaysSchedule,
      assignmentsList,
      pendingSubmissionsList,
      recentSubmissions,
      recentAnnouncements,
      gradedSubmissions,
      allCourseEnrollments,
      allSubmissionsForPerf
    ] = await Promise.all([
      // Total enrolled students across lecturer courses
      Enrollment.countDocuments({ courseId: { $in: courseIds } }),
      
      // Pending grades count
      Submission.countDocuments({ courseId: { $in: courseIds }, grade: null }),

      // Today's classes count
      LiveClass.countDocuments({
        courseId: { $in: courseIds },
        startTime: { $gte: todayStart, $lte: todayEnd }
      }),

      // Today's schedule list populated with course title
      LiveClass.find({
        courseId: { $in: courseIds },
        startTime: { $gte: todayStart, $lte: todayEnd }
      })
        .populate("courseId", "title")
        .sort({ startTime: 1 })
        .lean(),

      // Assignments for lecturer courses
      Assignment.find({ courseId: { $in: courseIds } }).lean(),

      // Pending grading queue items
      Submission.find({ courseId: { $in: courseIds }, grade: null })
        .populate("assignmentId", "title dueDate maxPoints")
        .populate("studentId", "name email")
        .populate("courseId", "title")
        .sort({ submittedAt: 1 })
        .limit(10)
        .lean(),

      // Recent submissions in last 7 days for activity feed
      Submission.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
        .populate("studentId", "name")
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Recent announcements in last 7 days for activity feed
      Announcement.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
        .populate("lecturerId", "name")
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Recent graded actions in last 7 days
      Submission.find({ courseId: { $in: courseIds }, grade: { $ne: null }, updatedAt: { $gte: sevenDaysAgo } })
        .populate("studentId", "name")
        .populate("courseId", "title")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),

      // Enrollments per course to calculate student counts
      Enrollment.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 }, avgProgress: { $avg: "$progress" } } }
      ]),

      // All submissions for performance aggregation (with assignment maxPoints)
      Submission.find({ courseId: { $in: courseIds } })
        .populate("assignmentId", "title maxPoints")
        .lean()
    ]);

    // Format Course cards with stats
    const courseStatsMap = new Map();
    allCourseEnrollments.forEach((e: any) => {
      courseStatsMap.set(e._id.toString(), { count: e.count, avgProgress: Math.round(e.avgProgress || 0) });
    });

    const formattedCourses = courses.map((course: any) => {
      const stats = courseStatsMap.get(course._id.toString()) || { count: 0, avgProgress: 0 };
      const courseAssignmentsCount = assignmentsList.filter(
        (a: any) => a.courseId.toString() === course._id.toString()
      ).length;

      return {
        _id: course._id.toString(),
        title: course.title,
        category: course.category,
        price: course.price,
        status: course.status,
        published: course.published,
        instructor: course.instructor,
        studentCount: stats.count,
        avgCompletion: stats.avgProgress,
        assignmentCount: courseAssignmentsCount,
      };
    });

    // Format Grading Queue (prioritize overdue)
    const formattedGradingQueue = pendingSubmissionsList.map((sub: any) => {
      const dueDate = sub.assignmentId?.dueDate ? new Date(sub.assignmentId.dueDate) : new Date();
      const isOverdue = dueDate.getTime() < Date.now();
      const diffDays = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        _id: sub._id.toString(),
        assignmentTitle: sub.assignmentId?.title || "Untitled Assignment",
        courseTitle: sub.courseId?.title || "General Course",
        studentName: sub.studentId?.name || "Student",
        dueDate: dueDate.toISOString(),
        isOverdue,
        overdueDays: isOverdue ? Math.max(1, diffDays) : 0,
        submittedAt: sub.submittedAt,
      };
    });

    // Format Activity Feed on-the-fly (union submissions, announcements, graded)
    const activities: any[] = [];

    recentSubmissions.forEach((sub: any) => {
      activities.push({
        id: `sub-${sub._id}`,
        type: "submission",
        title: `${sub.studentId?.name || 'A student'} submitted an assignment`,
        courseTitle: sub.courseId?.title || "Course",
        timestamp: sub.createdAt,
      });
    });

    recentAnnouncements.forEach((anc: any) => {
      activities.push({
        id: `anc-${anc._id}`,
        type: "announcement",
        title: `Announcement posted: ${anc.message.substring(0, 40)}...`,
        courseTitle: anc.courseId?.title || "Course",
        timestamp: anc.createdAt,
      });
    });

    gradedSubmissions.forEach((grd: any) => {
      activities.push({
        id: `grd-${grd._id}`,
        type: "graded",
        title: `Graded ${grd.studentId?.name || 'student'}'s submission (${grd.grade} pts)`,
        courseTitle: grd.courseId?.title || "Course",
        timestamp: grd.updatedAt,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const formattedActivity = activities.slice(0, 10);

    // Compute Performance Charts Data:
    // 1. Bar Chart: Average Score per Course
    const courseGradesMap = new Map<string, { totalScore: number; count: number; name: string }>();
    courses.forEach((c: any) => {
      courseGradesMap.set(c._id.toString(), { totalScore: 0, count: 0, name: c.title });
    });

    allSubmissionsForPerf.forEach((sub: any) => {
      if (sub.grade !== null && sub.grade !== undefined && !isNaN(Number(sub.grade))) {
        const cId = sub.courseId?.toString();
        if (cId && courseGradesMap.has(cId)) {
          const current = courseGradesMap.get(cId)!;
          const rawGrade = Number(sub.grade);
          const maxPts = Number(sub.assignmentId?.maxPoints) || 100;
          let scorePct = rawGrade;
          if (maxPts > 0 && maxPts !== 100 && rawGrade <= maxPts) {
            scorePct = (rawGrade / maxPts) * 100;
          }
          current.totalScore += scorePct;
          current.count += 1;
        }
      }
    });

    const barChartData = Array.from(courseGradesMap.values()).map((c) => ({
      courseTitle: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
      avgScore: c.count > 0 ? Math.round(c.totalScore / c.count) : 0,
    }));

    // 2. Line Chart: Submission rates over last 7 days
    const daysArr = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: d.toISOString().split("T")[0],
        count: 0,
      };
    });

    allSubmissionsForPerf.forEach((sub: any) => {
      if (sub.submittedAt || sub.createdAt) {
        const subDate = new Date(sub.submittedAt || sub.createdAt).toISOString().split("T")[0];
        const foundDay = daysArr.find((d) => d.fullDate === subDate);
        if (foundDay) {
          foundDay.count += 1;
        }
      }
    });

    const lineChartData = daysArr.map((d) => ({ label: d.dateStr, count: d.count }));

    // 3. Donut Chart: Accurate grade distribution buckets (A: >=80%, B: 70-79%, C: 60-69%, D: 50-59%, F: <50%)
    const gradeBuckets = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    allSubmissionsForPerf.forEach((sub: any) => {
      if (sub.grade !== null && sub.grade !== undefined && !isNaN(Number(sub.grade))) {
        const rawGrade = Number(sub.grade);
        const maxPts = Number(sub.assignmentId?.maxPoints) || 100;
        let percentage = rawGrade;
        if (maxPts > 0 && maxPts !== 100 && rawGrade <= maxPts) {
          percentage = (rawGrade / maxPts) * 100;
        }

        if (percentage >= 80) gradeBuckets.A += 1;
        else if (percentage >= 70) gradeBuckets.B += 1;
        else if (percentage >= 60) gradeBuckets.C += 1;
        else if (percentage >= 50) gradeBuckets.D += 1;
        else gradeBuckets.F += 1;
      }
    });

    const responseData = {
      stats: {
        activeCourses: courses.length,
        totalStudents: enrollmentsCount,
        pendingGrades: pendingGradesCount,
        todaysClasses: todaysClassesCount,
      },
      courses: formattedCourses,
      schedule: todaysSchedule,
      gradingQueue: formattedGradingQueue,
      recentActivity: formattedActivity,
      performance: {
        barChart: barChartData,
        lineChart: lineChartData,
        donutChart: gradeBuckets,
      },
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=59",
      },
    });
  } catch (error: any) {
    console.error("Lecturer Dashboard API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
