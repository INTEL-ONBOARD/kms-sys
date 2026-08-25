import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Enrollment from "@/lib/models/Enrollment";
import Course from "@/lib/models/Course";
import Assignment from "@/lib/models/Assignment";
import LiveClass from "@/lib/models/LiveClass";
import Submission from "@/lib/models/Submission";
import Announcement from "@/lib/models/Announcement";
import Exam from "@/lib/models/Exam";
import { createSafeSearchRegex } from "@/lib/core/pagination";
import { resolveGradeFromScale } from "@/lib/grading";

// Ensure models are registered
User;
Enrollment;
Course;
Assignment;
LiveClass;
Submission;
Announcement;
Exam;

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
 * If lecturer is not assigned to any courses, returns zero-state statistics safely.
 */
export async function getLecturerDashboard(userId: string, userName: string) {
  await connectToDatabase();

  const courses = await Course.find({
    $or: [
      { instructorId: userId },
      ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  }).lean();

  if (courses.length === 0) {
    return {
      stats: {
        activeCourses: 0,
        totalStudents: 0,
        pendingGrades: 0,
        todaysClasses: 0,
      },
      courses: [],
      schedule: [],
      gradingQueue: [],
      recentActivity: [],
      performance: {
        barChart: [],
        lineChart: [],
        donutChart: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        assignmentDonut: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        finalDonut: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        assignmentGradesSummary: {
          totalEvaluated: 0,
          averageScore: 0,
          passingRate: 0,
          distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        },
        finalGradesSummary: {
          totalEnrolled: 0,
          completedCount: 0,
          inProgressCount: 0,
          completionRate: 0,
          averageFinalGrade: 0,
          passingRate: 0,
          distribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        },
        students: [],
        coursesPerformance: [],
      },
    };
  }

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
    allEnrollments,
    examsList,
  ] = await Promise.all([
    // Total enrolled students across lecturer courses
    Enrollment.countDocuments({ courseId: { $in: courseIds } }),

    // Pending grades count
    Submission.countDocuments({ courseId: { $in: courseIds }, grade: null }),

    // Today's classes count
    LiveClass.countDocuments({
      courseId: { $in: courseIds },
      startTime: { $gte: todayStart, $lte: todayEnd },
    }),

    // Today's schedule list populated with course title
    LiveClass.find({
      courseId: { $in: courseIds },
      startTime: { $gte: todayStart, $lte: todayEnd },
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

    // Enrollments per course to calculate student counts
    Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: "$courseId", count: { $sum: 1 }, avgProgress: { $avg: "$progress" } } },
    ]),

    // All submissions for performance aggregation (with assignment maxPoints)
    Submission.find({ courseId: { $in: courseIds } })
      .populate("assignmentId", "title maxPoints dueDate")
      .populate("studentId", "name email")
      .lean(),

    // All enrollments with populated user and course info for student-level performance tracking
    Enrollment.find({ courseId: { $in: courseIds } })
      .populate("userId", "name email image")
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .lean(),

    // All exams for lecturer courses
    Exam.find({ courseId: { $in: courseIds } }).lean(),
  ]);

  // Format Course cards with stats
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

  // Format Grading Queue (prioritize overdue)
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

  // Format Activity Feed on-the-fly (union submissions, announcements, graded)
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

  // 1. ASSIGNMENT GRADES CALCULATION & DISTRIBUTION
  const assignmentGradeBuckets = { A: 0, B: 0, C: 0, S: 0, F: 0 };
  let totalAssignmentScorePct = 0;
  let totalGradedAssignmentsCount = 0;
  let passingAssignmentsCount = 0;

  const courseGradesMap = new Map<string, { totalScore: number; count: number; name: string }>();
  courses.forEach((c: any) => {
    courseGradesMap.set(c._id.toString(), { totalScore: 0, count: 0, name: c.title });
  });

  (allSubmissionsForPerf || []).forEach((sub: any) => {
    if (sub.grade !== null && sub.grade !== undefined && !isNaN(Number(sub.grade))) {
      const rawGrade = Number(sub.grade);
      const maxPts = Number(sub.assignmentId?.maxPoints) || 100;
      let percentage = rawGrade;
      if (maxPts > 0 && maxPts !== 100 && rawGrade <= maxPts) {
        percentage = (rawGrade / maxPts) * 100;
      }

      totalAssignmentScorePct += percentage;
      totalGradedAssignmentsCount += 1;

      if (percentage >= 80) assignmentGradeBuckets.A += 1;
      else if (percentage >= 70) assignmentGradeBuckets.B += 1;
      else if (percentage >= 60) assignmentGradeBuckets.C += 1;
      else if (percentage >= 50) assignmentGradeBuckets.S += 1;
      else assignmentGradeBuckets.F += 1;

      if (percentage >= 50) {
        passingAssignmentsCount += 1;
      }

      const cId = sub.courseId?.toString();
      if (cId && courseGradesMap.has(cId)) {
        const current = courseGradesMap.get(cId)!;
        current.totalScore += percentage;
        current.count += 1;
      }
    }
  });

  const assignmentAverage =
    totalGradedAssignmentsCount > 0
      ? Math.round(totalAssignmentScorePct / totalGradedAssignmentsCount)
      : 0;

  const assignmentPassingRate =
    totalGradedAssignmentsCount > 0
      ? Math.round((passingAssignmentsCount / totalGradedAssignmentsCount) * 100)
      : 0;

  // 2. STUDENT-BY-STUDENT PERFORMANCE & FINAL GRADE CALCULATION
  const finalGradeBuckets = { A: 0, B: 0, C: 0, S: 0, F: 0 };
  let completedStudentsTotalFinalScore = 0;
  let completedStudentsCount = 0;
  let completedPassingCount = 0;

  const studentsPerformance = (allEnrollments || []).map((enrollment: any) => {
    const student = enrollment.userId;
    const studentIdStr = student?._id ? student._id.toString() : enrollment.userId?.toString() || "";
    const course = enrollment.courseId;
    const courseIdStr = course?._id ? course._id.toString() : enrollment.courseId?.toString() || "";
    const courseTitle = course?.title || "Course";

    const courseAssignments = assignmentsList.filter(
      (a: any) => a.courseId?.toString() === courseIdStr
    );
    const totalCourseAssignments = courseAssignments.length;

    const studentSubmissions = allSubmissionsForPerf.filter((s: any) => {
      const sStudentId = s.studentId?._id ? s.studentId._id.toString() : s.studentId?.toString();
      const sCourseId = s.courseId?._id ? s.courseId._id.toString() : s.courseId?.toString();
      return sStudentId === studentIdStr && sCourseId === courseIdStr;
    });

    let studentTotalEarnedPct = 0;
    let studentGradedCount = 0;

    const assignmentScores = courseAssignments.map((assign: any) => {
      const assignIdStr = assign._id.toString();
      const sub = studentSubmissions.find((s: any) => {
        const sAssignId = s.assignmentId?._id ? s.assignmentId._id.toString() : s.assignmentId?.toString();
        return sAssignId === assignIdStr;
      });

      const isGraded = sub && sub.grade !== null && sub.grade !== undefined && !isNaN(Number(sub.grade));
      const rawScore = isGraded ? Number(sub.grade) : null;
      const maxPts = Number(assign.maxPoints) || 100;
      const pct = isGraded ? Math.round((rawScore! / maxPts) * 100) : null;

      if (isGraded && pct !== null) {
        studentTotalEarnedPct += pct;
        studentGradedCount += 1;
      }

      return {
        assignmentId: assignIdStr,
        title: assign.title,
        maxPoints: maxPts,
        dueDate: assign.dueDate,
        score: rawScore,
        percentage: pct,
        status: isGraded ? "graded" : sub ? "submitted" : "pending",
        feedback: sub?.feedback || "",
      };
    });

    const assignmentAverageScore =
      studentGradedCount > 0 ? Math.round(studentTotalEarnedPct / studentGradedCount) : null;

    const courseExams = (examsList || []).filter(
      (e: any) => e.courseId?.toString() === courseIdStr
    );
    const totalCourseExams = courseExams.length;
    const studentExamsGraded = courseExams.filter((e: any) => {
      const res = (e.results || []).find((r: any) => r.studentId?.toString() === studentIdStr);
      return (e.status === "completed" || e.status === "graded") || (res && res.marks !== null && res.marks !== undefined);
    });
    const completedExamsCount = studentExamsGraded.length;

    const allAssignmentsCompleted = totalCourseAssignments > 0 && studentGradedCount === totalCourseAssignments;
    const finalExamCompleted = totalCourseExams === 0 || completedExamsCount === totalCourseExams;
    const isCompleted = allAssignmentsCompleted && finalExamCompleted;

    let finalGrade: number | null = null;
    let finalLetterGrade = "In Progress";
    let finalGradeColor = "text-amber-700 bg-amber-50 border-amber-200";
    let gpaPoint: number | null = null;
    let status = "In Progress";

    if (isCompleted) {
      let totalPts = studentTotalEarnedPct;
      let totalComponents = totalCourseAssignments;

      studentExamsGraded.forEach((e: any) => {
        const res = (e.results || []).find((r: any) => r.studentId?.toString() === studentIdStr);
        if (res && res.marks !== null && res.marks !== undefined) {
          const maxM = Number(res.maxMarks || e.maxMarks) || 100;
          const pct = maxM > 0 ? (Number(res.marks) / maxM) * 100 : 0;
          totalPts += pct;
          totalComponents += 1;
        }
      });

      finalGrade = Math.round(totalPts / Math.max(1, totalComponents));
      completedStudentsCount += 1;
      completedStudentsTotalFinalScore += finalGrade;

      const resolved = resolveGradeFromScale(finalGrade, course?.gradingScale);
      finalLetterGrade = resolved.grade;
      finalGradeColor = resolved.badgeClass;
      gpaPoint = resolved.gpaPoint;

      const letterKey = resolved.grade.charAt(0).toUpperCase();
      if (letterKey in finalGradeBuckets) {
        (finalGradeBuckets as any)[letterKey] += 1;
      } else {
        finalGradeBuckets.A += 1;
      }

      if (resolved.isPassing) {
        completedPassingCount += 1;
      }
      status = "Completed";
    }

    return {
      enrollmentId: enrollment._id.toString(),
      studentId: studentIdStr,
      name: student?.name || "Student",
      email: student?.email || "",
      image: student?.image || "",
      courseId: courseIdStr,
      courseTitle,
      progress: enrollment.progress || 0,
      totalAssignments: totalCourseAssignments,
      completedAssignments: studentGradedCount,
      pendingAssignments: Math.max(0, totalCourseAssignments - studentGradedCount),
      totalExams: totalCourseExams,
      completedExams: completedExamsCount,
      allAssignmentsCompleted,
      finalExamCompleted,
      isCompleted,
      assignmentScores,
      assignmentAverageScore,
      finalGrade,
      finalLetterGrade,
      finalGradeColor,
      gpaPoint,
      credits: course?.credits || 3,
      qualityPoints: typeof gpaPoint === "number" ? Number((gpaPoint * (course?.credits || 3)).toFixed(2)) : null,
      status,
    };
  });

  const finalGradeAverage =
    completedStudentsCount > 0
      ? Math.round(completedStudentsTotalFinalScore / completedStudentsCount)
      : 0;

  const finalPassingRate =
    completedStudentsCount > 0
      ? Math.round((completedPassingCount / completedStudentsCount) * 100)
      : 0;

  const inProgressStudentsCount = studentsPerformance.length - completedStudentsCount;

  const coursesPerformance = formattedCourses.map((c: any) => {
    const courseStudents = studentsPerformance.filter((s: any) => s.courseId === c._id);
    const completedCourseStudents = courseStudents.filter((s: any) => s.isCompleted || s.allAssignmentsCompleted);

    const courseFinalAvg =
      completedCourseStudents.length > 0
        ? Math.round(
            completedCourseStudents.reduce((acc: number, s: any) => acc + (s.finalGrade || 0), 0) /
              completedCourseStudents.length
          )
        : null;

    const courseAssignScores = courseStudents
      .map((s: any) => s.assignmentAverageScore)
      .filter((score: number | null) => score !== null) as number[];

    const courseAssignAvg =
      courseAssignScores.length > 0
        ? Math.round(courseAssignScores.reduce((acc: number, val: number) => acc + val, 0) / courseAssignScores.length)
        : 0;

    return {
      courseId: c._id,
      courseTitle: c.title,
      studentCount: courseStudents.length,
      totalAssignments: c.assignmentCount,
      completedStudentsCount: completedCourseStudents.length,
      inProgressStudentsCount: courseStudents.length - completedCourseStudents.length,
      allCompleted: courseStudents.length > 0 && completedCourseStudents.length === courseStudents.length,
      assignmentAvg: courseAssignAvg,
      finalGradeAvg: courseFinalAvg,
    };
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
      donutChart: assignmentGradeBuckets,
      assignmentDonut: assignmentGradeBuckets,
      finalDonut: finalGradeBuckets,
      assignmentGradesSummary: {
        totalEvaluated: totalGradedAssignmentsCount,
        averageScore: assignmentAverage,
        passingRate: assignmentPassingRate,
        distribution: assignmentGradeBuckets,
      },
      finalGradesSummary: {
        totalEnrolled: studentsPerformance.length,
        completedCount: completedStudentsCount,
        inProgressCount: inProgressStudentsCount,
        allCompleted: studentsPerformance.length > 0 && completedStudentsCount === studentsPerformance.length,
        completionRate:
          studentsPerformance.length > 0
            ? Math.round((completedStudentsCount / studentsPerformance.length) * 100)
            : 0,
        averageFinalGrade: finalGradeAverage,
        passingRate: finalPassingRate,
        distribution: finalGradeBuckets,
      },
      students: studentsPerformance,
      coursesPerformance,
    },
  };
}

/**
 * Retrieves the activity feed for a lecturer.
 */
export async function getLecturerActivity(userId: string, userName: string) {
  await connectToDatabase();

  const courses = await Course.find({
    $or: [
      { instructorId: userId },
      ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  }).lean();

  const courseIds = courses.map((c) => c._id);
  if (courseIds.length === 0) {
    return { activity: [] };
  }

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

/**
 * Retrieves student final grades roster with server-side backend filtering.
 */
export async function getLecturerFinalGradesRoster(
  userId: string,
  userName: string,
  filterParams: {
    search?: string;
    grade?: string;
    courseId?: string;
  }
) {
  const data = await getLecturerDashboard(userId, userName);
  const allStudents = data.performance?.students || [];

  const completed = allStudents.filter((s: any) => s.isCompleted);
  const counts = {
    ALL: completed.length,
    A: completed.filter((s: any) => s.finalLetterGrade === "A").length,
    B: completed.filter((s: any) => s.finalLetterGrade === "B").length,
    C: completed.filter((s: any) => s.finalLetterGrade === "C").length,
    S: completed.filter((s: any) => s.finalLetterGrade === "S").length,
    F: completed.filter((s: any) => s.finalLetterGrade === "F").length,
    IN_PROGRESS: allStudents.filter((s: any) => !s.isCompleted).length,
    TOTAL: allStudents.length,
  };

  const courseMap = new Map<string, string>();
  allStudents.forEach((s: any) => {
    if (s.courseId && s.courseTitle) {
      courseMap.set(s.courseId, s.courseTitle);
    }
  });
  const courses = Array.from(courseMap.entries()).map(([id, title]) => ({ id, title }));

  const { search = "", grade = "ALL", courseId = "ALL" } = filterParams;

  const filtered = allStudents.filter((s: any) => {
    if (courseId !== "ALL" && s.courseId !== courseId) {
      return false;
    }

    if (grade === "ALL") {
      if (!s.isCompleted) return false;
    } else if (grade === "IN_PROGRESS") {
      if (s.isCompleted) return false;
    } else if (grade) {
      if (s.finalLetterGrade !== grade) return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchCourse = s.courseTitle.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCourse) return false;
    }

    return true;
  });

  return {
    students: filtered,
    counts,
    courses,
    total: filtered.length,
  };
}

