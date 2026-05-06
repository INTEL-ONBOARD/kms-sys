import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { isAuthorized } from '@/lib/permissions';
import { logAuditAction } from '@/lib/auditLogger'; // Import our new audit logger

// Update User API (Edit Role/Status)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Get the current logged-in user session
    const session = await getServerSession(authOptions);
    
    // Task #498 Check: Does this user have permission to manage users?
    if (!isAuthorized(session?.user, 'user.manage')) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
    }

    // Await the params object before accessing the id (Required in Next.js 15+)
    const { id } = await params;
    
    // Parse the request body to get the new role and status
    const { role, status } = await req.json();
    
    // Connect to MongoDB
    await connectToDatabase();

    // 2. Get the old user data first so we can log the exact changes
    const oldUser = await User.findById(id);
    if (!oldUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 3. Find the user by ID and update their role and status
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role, status },
      { new: true } // Return the newly updated document
    ).select('-password'); // Exclude password from the response for security

    // 🔥 TASK #500 IN ACTION: Log the role/status mutation!
    // If the role or status was changed, create an audit log
    if (oldUser.role !== role || oldUser.status !== status) {
      await logAuditAction({
        action: 'UPDATE_USER_ROLE_OR_STATUS',
        performedBy: session!.user.id, // The Admin making the change
        targetId: id,                  // The User being changed
        resourceType: 'User',
        details: {
          oldRole: oldUser.role,
          newRole: role,
          oldStatus: oldUser.status,
          newStatus: status
        }
      });
    }

    // Return success response
    return NextResponse.json({ message: "User updated", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

// Delete User API
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Get the current logged-in user session
    const session = await getServerSession(authOptions);
    
    // Task #498 Check: Does this user have permission to manage users?
    if (!isAuthorized(session?.user, 'user.manage')) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
    }

    // Await the params object before accessing the id (Required in Next.js 15+)
    const { id } = await params;
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // 2. Find the user before deleting to log their info
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 3. Find the user by ID and delete them from the database
    await User.findByIdAndDelete(id);

    // 🔥 TASK #500 IN ACTION: Log the deletion!
    await logAuditAction({
      action: 'DELETE_USER',
      performedBy: session!.user.id, // The Admin making the change
      targetId: id,
      resourceType: 'User',
      details: {
        deletedUserName: userToDelete.name,
        deletedUserEmail: userToDelete.email,
        deletedUserRole: userToDelete.role
      }
    });

    // Return success response
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}