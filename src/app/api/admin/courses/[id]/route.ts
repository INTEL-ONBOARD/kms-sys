import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Course from '@/models/Course';

// Update Course API (Edit)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params object before accessing the id (Required in Next.js 15+)
    const { id } = await params;

    // Parse the request body to get the updated course details
    const body = await req.json();
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Find the course by the extracted 'id' and update it
    // NOTE: Make sure to use 'id' here, NOT 'params.id'
    const updatedCourse = await Course.findByIdAndUpdate(id, body, { new: true });
    
    // If course is not found in the database
    if (!updatedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({ message: "Course updated successfully", course: updatedCourse }, { status: 200 });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ message: "Failed to update course" }, { status: 500 });
  }
}

// Delete Course API
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params object before accessing the id (Required in Next.js 15+)
    const { id } = await params;

    // Connect to MongoDB
    await connectToDatabase();
    
    // Find the course by the extracted 'id' and delete it
    // NOTE: Make sure to use 'id' here, NOT 'params.id'
    const deletedCourse = await Course.findByIdAndDelete(id);
    
    // If course is not found in the database
    if (!deletedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ message: "Failed to delete course" }, { status: 500 });
  }
}