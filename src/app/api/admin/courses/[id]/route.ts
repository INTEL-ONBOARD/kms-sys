import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Course from '@/models/Course';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    const body = await req.json();
    await connectToDatabase();
    // Update existing course
    const updatedCourse = await Course.findByIdAndUpdate(params.id, body, { new: true });
    if (!updatedCourse) return NextResponse.json({ message: "Course not found" }, { status: 404 });
    return NextResponse.json({ message: "Course updated", course: updatedCourse }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    await connectToDatabase();
    // Delete course
    const deletedCourse = await Course.findByIdAndDelete(params.id);
    if (!deletedCourse) return NextResponse.json({ message: "Course not found" }, { status: 404 });
    return NextResponse.json({ message: "Course deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete course" }, { status: 500 });
  }
}