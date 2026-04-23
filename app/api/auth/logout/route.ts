import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Create a successful response
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // 2. Delete the 'token' cookie to clear the session
    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ message: 'Failed to logout' }, { status: 500 });
  }
}