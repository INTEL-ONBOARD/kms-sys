import { getAdminDashboardStats } from "@/services/dashboard.service";

async function run() {
  try {
    const stats = await getAdminDashboardStats();
    console.log("SUCCESS:", JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error("FAILED WITH ERROR:");
    console.error(error);
  }
}

run();
