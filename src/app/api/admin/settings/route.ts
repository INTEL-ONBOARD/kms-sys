import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Settings from "@/models/Settings";

/**
 * GET /api/admin/settings
 * Fetches the singleton settings document.
 * If none exists, creates one with defaults and returns it.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();

    let settings = await Settings.findOne({ _singleton: "global" });
    if (!settings) {
      settings = await Settings.create({ _singleton: "global" });
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Updates the singleton settings document.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { platformName, primaryDomain, supportEmail, timezone, defaultCurrency, activePaymentGateway, features } = body;

    await connectToDatabase();

    const updateData: any = {};
    if (platformName !== undefined) updateData.platformName = platformName;
    if (primaryDomain !== undefined) updateData.primaryDomain = primaryDomain;
    if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency;
    if (activePaymentGateway !== undefined) updateData.activePaymentGateway = activePaymentGateway;
    
    if (features) {
      if (features.discussionForums !== undefined) updateData['features.discussionForums'] = features.discussionForums;
      if (features.gamification !== undefined) updateData['features.gamification'] = features.gamification;
      if (features.liveSessions !== undefined) updateData['features.liveSessions'] = features.liveSessions;
      if (features.certificates !== undefined) updateData['features.certificates'] = features.certificates;
      if (features.maintenanceMode !== undefined) updateData['features.maintenanceMode'] = features.maintenanceMode;
    }

    const updated = await Settings.findOneAndUpdate(
      { _singleton: "global" },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log('Updated Settings:', updated);

    return NextResponse.json(
      { message: "Settings saved successfully.", settings: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { message: "Failed to save settings." },
      { status: 500 }
    );
  }
}
