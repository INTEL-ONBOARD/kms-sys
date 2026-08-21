/**
 * @jest-environment node
 */

import { GET } from "@/app/api/health/route";
import * as db from "@/lib/db";
import mongoose from "mongoose";

jest.mock("@/lib/db", () => ({
  connectToDatabase: jest.fn(),
}));

describe("Health Check API (/api/health)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return healthy status when database is connected", async () => {
    (db.connectToDatabase as jest.Mock).mockResolvedValue(true);
    // Mock readyState as 1 (connected)
    Object.defineProperty(mongoose.connection, "readyState", {
      value: 1,
      configurable: true,
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.db).toBe("connected");
    expect(data.timestamp).toBeDefined();
  });

  it("should return degraded 503 status when database is disconnected", async () => {
    (db.connectToDatabase as jest.Mock).mockResolvedValue(true);
    Object.defineProperty(mongoose.connection, "readyState", {
      value: 0,
      configurable: true,
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.db).toBe("disconnected");
  });

  it("should return unhealthy 500 status when database connection throws error", async () => {
    (db.connectToDatabase as jest.Mock).mockRejectedValue(new Error("Connection timeout"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.status).toBe("unhealthy");
    expect(data.error).toBe("Connection timeout");
  });
});
