import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import type { CourseInput } from "@/types/lms";

import Assignment from "@/models/Assignment";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function validateId(id: string) {
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
  }
  return null;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invalid = validateId(id);
  if (invalid) return invalid;

  try {
    await connectToDatabase();
    const course = await Course.findById(id).lean();
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch course", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invalid = validateId(id);
  if (invalid) return invalid;

  try {
    const payload = (await request.json()) as Partial<CourseInput>;
    await connectToDatabase();

    const updates: Partial<CourseInput> = {};
    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.instructor !== undefined) updates.instructor = payload.instructor.trim();
    if (payload.published !== undefined) updates.published = payload.published;
    if (payload.assessmentItems !== undefined && Array.isArray(payload.assessmentItems)) {
      updates.assessmentItems = payload.assessmentItems.map((item: any) => ({
        name: String(item.name || "Assessment Item").trim(),
        type: item.type || "assignment",
        weight: Math.max(0, Number(item.weight) || 0),
      }));

      // Automatically keep gradingBreakdown in sync
      const assignSum = updates.assessmentItems.filter((i: any) => i.type === "assignment").reduce((s: number, i: any) => s + i.weight, 0);
      const cwSum = updates.assessmentItems.filter((i: any) => i.type === "coursework" || i.type === "quiz" || i.type === "project").reduce((s: number, i: any) => s + i.weight, 0);
      const examSum = updates.assessmentItems.filter((i: any) => i.type === "exam").reduce((s: number, i: any) => s + i.weight, 0);
      const attSum = updates.assessmentItems.filter((i: any) => i.type === "attendance").reduce((s: number, i: any) => s + i.weight, 0);
      updates.gradingBreakdown = {
        assignmentsWeight: assignSum,
        courseWorkWeight: cwSum,
        finalExamWeight: examSum,
        attendanceWeight: attSum,
      };

      // Automatically sync assessment items into the Assignment collection
      for (const item of updates.assessmentItems) {
        const itemType = item.type || "assignment";
        if (["assignment", "coursework", "quiz", "project"].includes(itemType)) {
          const existing = await Assignment.findOne({
            courseId: id,
            title: item.name,
          });

          if (!existing) {
            const categoryName = 
              itemType === "quiz" 
                ? "Quiz" 
                : itemType === "project" 
                ? "Project" 
                : itemType === "coursework" 
                ? "Coursework" 
                : "Homework";

            await Assignment.create({
              title: item.name,
              description: `Continuous assessment component (${item.weight}% Course Weight) as defined in Course Assessment & Grade Breakdown.`,
              courseId: id,
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              maxPoints: 100,
              category: categoryName,
              status: "open",
            });
          }
        }
      }
    } else if (payload.gradingBreakdown !== undefined) {
      updates.gradingBreakdown = {
        assignmentsWeight: typeof payload.gradingBreakdown.assignmentsWeight === "number" ? payload.gradingBreakdown.assignmentsWeight : 20,
        courseWorkWeight: typeof payload.gradingBreakdown.courseWorkWeight === "number" ? payload.gradingBreakdown.courseWorkWeight : 30,
        finalExamWeight: typeof payload.gradingBreakdown.finalExamWeight === "number" ? payload.gradingBreakdown.finalExamWeight : 40,
        attendanceWeight: typeof payload.gradingBreakdown.attendanceWeight === "number" ? payload.gradingBreakdown.attendanceWeight : 10,
      };
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).lean();

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update course", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invalid = validateId(id);
  if (invalid) return invalid;

  try {
    await connectToDatabase();
    const course = await Course.findByIdAndDelete(id).lean();
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Course deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete course", error: String(error) },
      { status: 500 }
    );
  }
}
