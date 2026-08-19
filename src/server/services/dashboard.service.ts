import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import LiveClass from "@/models/LiveClass";
import Submission from "@/models/Submission";
import Announcement from "@/models/Announcement";
import { createSafeSearchRegex } from "../core/pagination";

/**
 * Retrieves aggregate statistics for the Admin Dashboard.
 */
export async function getAdminDashboardStats() {
  await connectToDatabase();

  // 1. Total Users (excluding super admins)
  const totalUsers = await User.countDocuments({ role: { $ne: "super_admin" } });

  // 2. Active Users
  const activeUsers = await User.countDocuments({ status: "active" });

  // 3. New Registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newRegistrations = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  // 4. Total Revenue
  const enrollments = await Enrollment.find({}).populate({
    path: "courseId",
    model: Course,
    select: "price",
  });

  let totalRevenue = 0;
  enrollments.forEach((enrollment) => {
    const course = enrollment.courseId as any;
    if (course && course.price !== undefined && course.price !== null) {
      const priceStr = String(course.price).replace(/[^0-9.-]+/g, "");
      const priceNum = parseFloat(priceStr);
      if (!isNaN(priceNum)) {
        totalRevenue += priceNum;
      }
    }
  });

  // 5. Chart Data: Users per day for the last 7 days
  const chartData = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const startOfDay = new Date(d.setHours(0, 0, 0, 0));
    const endOfDay = new Date(d.setHours(23, 59, 59, 999));

    const count = await User.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const dayName = startOfDay.toLocaleDateString("en-US", { weekday: "short" });
    chartData.push({
      name: dayName,
      users: count,
    });
  }

  // 6. Daily Revenue: Last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentEnrollments = await Enrollment.find({
    createdAt: { $gte: sevenDaysAgo },
  }).populate({ path: "courseId", model: Course, select: "price" });

  const revenueMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    revenueMap[dayName] = 0;
  }

  recentEnrollments.forEach((enrollment: any) => {
    const course = enrollment.courseId as any;
    if (course && course.price !== undefined && course.price !== null) {
      const priceNum = parseFloat(String(course.price).replace(/[^0-9.-]+/g, ""));
      if (!isNaN(priceNum)) {
        const dayName = new Date(enrollment.createdAt).toLocaleDateString("en-US", {
          weekday: "short",
        });
        if (dayName in revenueMap) {
          revenueMap[dayName] += priceNum;
        }
      }
    }
  });

  const dailyRevenue = Object.entries(revenueMap).map(([name, revenue]) => ({
    name,
    revenue: Math.round(revenue),
  }));

  // 7. Top Courses
  const topCourses = await Enrollment.aggregate([
    {
      $group: {
        _id: "$courseId",
        value: { $sum: 1 },
      },
    },
    {
      $sort: { value: -1, _id: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "courseData",
      },
    },
    {
      $unwind: "$courseData",
    },
    {
      $project: {
        _id: 0,
        name: "$courseData.title",
        value: 1,
      },
    },
    {
      $sort: { value: -1 },
    },
  ]);

  return {
    totalUsers,
    activeUsers,
    newRegistrations,
    totalRevenue,
    chartData,
    topCourses,
    dailyRevenue,
  };
}

/**
 * Retrieves aggregate data for the Lecturer Dashboard.
 */
export async function getLecturerDashboard(userId: string, userName: string) {
  await connectToDatabase();

  const nameRegex = createSafeSearchRegex(userName);
  const courses = await Course.find({
    $or: [{ instructorId: userId }, { instructor: { $regex: nameRegex } }],
  }).lean();

  const courseIds = courses.map((c) => c._id);

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
    allSubmissionsForPerf,
  ] = await Promise.all([
    Enrollment.countDocuments({ courseId: { $in: courseIds } }),
    Submission.countDocuments({ courseId: { $in: courseIds }, grade: null }),
    LiveClass.countDocuments({
      courseId: { $in: courseIds },
      startTime: { $gte: todayStart, $lte: todayEnd },
    }),
    LiveClass.find({
      courseId: { $in: courseIds },
      startTime: { $gte: todayStart, $lte: todayEnd },
    })
      .populate("courseId", "title")
      .sort({ startTime: 1 })
      .lean(),
    Assignment.find({ courseId: { $in: courseIds } }).lean(),
    Submission.find({ courseId: { $in: courseIds }, grade: null })
      .populate("assignmentId", "title dueDate maxPoints")
      .populate("studentId", "name email")
      .populate("courseId", "title")
      .sort({ submittedAt: 1 })
      .limit(10)
      .lean(),
    Submission.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
      .populate("studentId", "name")
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Announcement.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
      .populate("lecturerId", "name")
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Submission.find({
      courseId: { $in: courseIds },
      grade: { $ne: null },
      updatedAt: { $gte: sevenDaysAgo },
    })
      .populate("studentId", "name")
      .populate("courseId", "title")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
    Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: "$courseId", count: { $sum: 1 }, avgProgress: { $avg: "$progress" } } },
    ]),
    Submission.find({ courseId: { $in: courseIds } })
      .populate("assignmentId", "title maxPoints")
      .lean(),
  ]);

  const courseStatsMap = new Map();
  allCourseEnrollments.forEach((e: any) => {
    courseStatsMap.set(e._id.toString(), {
      count: e.count,
      avgProgress: Math.round(e.avgProgress || 0),
    });
  });

  const formattedCourses = courses.map((course: any) => {
    const stats = courseStatsMap.get(course._id.toString()) || { count: 0, avgProgress: 0 };
    const courseAssignmentsCount = assignmentsList.filter(
      (a: any) => a.courseId.toString() === course._id.toString()
    ).length;

    return {
      ...course,
      _id: course._id.toString(),
      studentCount: stats.count,
      avgCompletion: stats.avgProgress,
      assignmentCount: courseAssignmentsCount,
    };
  });

  const formattedGradingQueue = pendingSubmissionsList.map((sub: any) => {
    const dueDate = sub.assignmentId?.dueDate
      ? new Date(sub.assignmentId.dueDate)
      : new Date();
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

  const activities: any[] = [];
  recentSubmissions.forEach((sub: any) => {
    activities.push({
      id: `sub-${sub._id}`,
      type: "submission",
      title: `${sub.studentId?.name || "A student"} submitted an assignment`,
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
      title: `Graded ${grd.studentId?.name || "student"}'s submission (${grd.grade} pts)`,
      courseTitle: grd.courseId?.title || "Course",
      timestamp: grd.updatedAt,
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const formattedActivity = activities.slice(0, 10);

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

  return {
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
}

/**
 * Retrieves the activity feed for a lecturer.
 */
export async function getLecturerActivity(userId: string, userName: string) {
  await connectToDatabase();

  const nameRegex = createSafeSearchRegex(userName);
  const courses = await Course.find({
    $or: [{ instructorId: userId }, { instructor: { $regex: nameRegex } }],
  }).lean();

  const courseIds = courses.map((c) => c._id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentSubmissions, recentAnnouncements, gradedSubmissions] = await Promise.all([
    Submission.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
      .populate("studentId", "name")
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Announcement.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Submission.find({
      courseId: { $in: courseIds },
      grade: { $ne: null },
      updatedAt: { $gte: sevenDaysAgo },
    })
      .populate("studentId", "name")
      .populate("courseId", "title")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const activities: any[] = [];

  recentSubmissions.forEach((sub: any) => {
    activities.push({
      id: `sub-${sub._id}`,
      type: "submission",
      title: `${sub.studentId?.name || "A student"} submitted an assignment`,
      courseTitle: sub.courseId?.title || "Course",
      timestamp: sub.createdAt,
    });
  });

  recentAnnouncements.forEach((anc: any) => {
    activities.push({
      id: `anc-${anc._id}`,
      type: "announcement",
      title: `Announcement: ${anc.message.substring(0, 45)}...`,
      courseTitle: anc.courseId?.title || "Course",
      timestamp: anc.createdAt,
    });
  });

  gradedSubmissions.forEach((grd: any) => {
    activities.push({
      id: `grd-${grd._id}`,
      type: "graded",
      title: `Graded ${grd.studentId?.name || "student"}'s submission (${grd.grade} pts)`,
      courseTitle: grd.courseId?.title || "Course",
      timestamp: grd.updatedAt,
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { activity: activities.slice(0, 10) };
}
