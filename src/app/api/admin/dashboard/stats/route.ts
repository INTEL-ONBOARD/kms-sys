import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Total Users (excluding super admins)
    const totalUsers = await User.countDocuments({ role: { $ne: 'super_admin' } });

    // 2. Active Users
    const activeUsers = await User.countDocuments({ status: 'active' });

    // 3. New Registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newRegistrations = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // 4. Total Revenue
    // Aggregate revenue by fetching all enrollments and their associated courses
    // We populate the courseId to access the price of the course
    const enrollments = await Enrollment.find({}).populate({
      path: 'courseId',
      model: Course,
      select: 'price'
    });

    let totalRevenue = 0;
    enrollments.forEach(enrollment => {
      const course = enrollment.courseId as any; // Type assertion since it's populated
      if (course && course.price) {
        // The price is stored as a String (e.g. "$49.99" or "49.99"). 
        // We strip any currency symbols or commas and convert to float safely.
        const priceStr = course.price.replace(/[^0-9.-]+/g, "");
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum)) {
          totalRevenue += priceNum;
        }
      }
    });

    // 5. Chart Data: Users per day for the last 7 days
    const chartData = [];
    const today = new Date();
    // Generate the last 7 days starting from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));

      const count = await User.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });

      const dayName = startOfDay.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
      chartData.push({
        name: dayName,
        users: count
      });
    }

    // 6. Daily Revenue: Last 7 days (sum of enrollment course prices per day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch enrollments from last 7 days with course price populated
    const recentEnrollments = await Enrollment.find({
      createdAt: { $gte: sevenDaysAgo }
    }).populate({ path: 'courseId', model: Course, select: 'price' });

    // Build a map of day -> revenue
    const revenueMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      revenueMap[dayName] = 0;
    }

    recentEnrollments.forEach((enrollment: any) => {
      const course = enrollment.courseId as any;
      if (course && course.price) {
        const priceNum = parseFloat(course.price.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(priceNum)) {
          const dayName = new Date(enrollment.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
          if (dayName in revenueMap) {
            revenueMap[dayName] += priceNum;
          }
        }
      }
    });

    const dailyRevenue = Object.entries(revenueMap).map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue)
    }));

    // 6. Top Courses (Donut Chart Data)
    const topCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: "$courseId",
          value: { $sum: 1 }
        }
      },
      {
        // Primary: highest enrollments first. Secondary: newest courseId first (tie-breaker)
        $sort: { value: -1, _id: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseData"
        }
      },
      {
        // Skip enrollments whose course has been deleted
        $unwind: "$courseData"
      },
      {
        $project: {
          _id: 0,
          name: "$courseData.title",
          value: 1
        }
      },
      {
        // Re-apply sort after lookup so the final output is always deterministic
        $sort: { value: -1 }
      }
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      newRegistrations,
      totalRevenue,
      chartData,
      topCourses,
      dailyRevenue
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
