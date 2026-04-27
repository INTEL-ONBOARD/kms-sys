import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User"; 
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Connect to the MongoDB database
    await connectToDatabase();

    // Get the JWT token from the cookies (assuming it's saved as "token")
    const token = request.cookies.get("token")?.value;

    // If no token is found, return an unauthorized error
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Verify and decode the token to get the user ID
    // Ensure you have JWT_SECRET in your .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    // Find the user in the database using the decoded ID
    // We use .select("-password") to exclude the password from the fetched data
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return the user data successfully
    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user profile", error: String(error) },
      { status: 500 }
    );
  }
}