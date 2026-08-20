import { getAdminDashboardStats } from "./src/server/services/dashboard.service";

async function run() {
  try {
    const stats = await getAdminDashboardStats();
    console.log("SUCCESS");
    // console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error("FAILED WITH ERROR:");
    console.error(error);
  }
}

run();
