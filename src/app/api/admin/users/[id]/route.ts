import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

// Update User API (Edit)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { role, status } = await req.json();
    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { role, status },
      { new: true } // Return the updated document
    ).select('-password');

    if (!updatedUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ message: "User updated", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

// Delete User API
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    
    const deletedUser = await User.findByIdAndDelete(params.id);
    if (!deletedUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}