/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Mock dependencies
jest.mock("next-auth/jwt");
jest.mock("@/lib/db", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/services/user.service", () => ({
  getUsers: jest.fn().mockResolvedValue({ users: [] }),
  createUser: jest.fn().mockResolvedValue({ id: "u1", name: "Test" }),
}));
jest.mock("@/services/course.service", () => ({
  getCourses: jest.fn().mockResolvedValue({ courses: [], pagination: {} }),
  getCourseById: jest.fn(),
  createCourse: jest.fn().mockResolvedValue({ id: "c1", title: "Test Course" }),
  updateCourse: jest.fn().mockResolvedValue({ id: "c1", title: "Updated Course" }),
  deleteCourse: jest.fn().mockResolvedValue({ id: "c1" }),
}));
jest.mock("@/services/settings.service", () => ({
  getSettings: jest.fn().mockResolvedValue({ siteName: "KMS" }),
  updateSettings: jest.fn().mockResolvedValue({ siteName: "KMS" }),
}));
jest.mock("@/lib/models/CourseMaterial", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn().mockResolvedValue({ id: "m1" }),
  },
}));
jest.mock("@/lib/models/Course", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));
jest.mock("@/lib/models/User", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("@/lib/r2", () => ({
  deleteR2Object: jest.fn().mockResolvedValue(true),
}));

import { GET as getUsers, POST as postUser } from "@/app/api/users/route";
import { POST as postCourse } from "@/app/api/courses/route";
import { PUT as putCourse, DELETE as deleteCourse } from "@/app/api/courses/[id]/route";
import { GET as getSettings } from "@/app/api/admin/settings/route";
import { DELETE as deleteMaterial } from "@/app/api/materials/route";
import { GET as getSetupAdmin } from "@/app/api/setup-admin/route";
import * as CourseService from "@/services/course.service";
import CourseMaterial from "@/lib/models/CourseMaterial";
import Course from "@/lib/models/Course";

const mockGetToken = getToken as jest.Mock;

describe("RBAC and API Route Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. /api/users", () => {
    it("GET /api/users should return 401 when unauthenticated", async () => {
      mockGetToken.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/users");
      const res = await getUsers(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/users should return 403 for student role", async () => {
      mockGetToken.mockResolvedValue({ id: "s1", role: "student" });
      const req = new NextRequest("http://localhost:3000/api/users");
      const res = await getUsers(req);
      expect(res.status).toBe(403);
    });

    it("GET /api/users should return 200 for super_admin role", async () => {
      mockGetToken.mockResolvedValue({ id: "a1", role: "super_admin" });
      const req = new NextRequest("http://localhost:3000/api/users");
      const res = await getUsers(req);
      expect(res.status).toBe(200);
    });

    it("POST /api/users should return 401 when unauthenticated", async () => {
      mockGetToken.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({ name: "Alice", email: "alice@test.com" }),
      });
      const res = await postUser(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/users should return 403 for student role", async () => {
      mockGetToken.mockResolvedValue({ id: "s1", role: "student" });
      const req = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({ name: "Alice", email: "alice@test.com" }),
      });
      const res = await postUser(req);
      expect(res.status).toBe(403);
    });

    it("POST /api/users should return 201 for admin role with valid body", async () => {
      mockGetToken.mockResolvedValue({ id: "a1", role: "admin" });
      const req = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({ name: "Alice", email: "alice@test.com" }),
      });
      const res = await postUser(req);
      expect(res.status).toBe(201);
    });
  });

  describe("2. /api/courses and /api/courses/[id]", () => {
    it("POST /api/courses should return 401 when unauthenticated", async () => {
      mockGetToken.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        body: JSON.stringify({ title: "New Course", instructor: "Prof A" }),
      });
      const res = await postCourse(req);
      expect(res.status).toBe(401);
    });

    it("POST /api/courses should return 403 for student role", async () => {
      mockGetToken.mockResolvedValue({ id: "s1", role: "student" });
      const req = new NextRequest("http://localhost:3000/api/courses", {
        method: "POST",
        body: JSON.stringify({ title: "New Course", instructor: "Prof A" }),
      });
      const res = await postCourse(req);
      expect(res.status).toBe(403);
    });

    it("PUT /api/courses/[id] should return 401 when unauthenticated", async () => {
      mockGetToken.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/courses/c123", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Course" }),
      });
      const res = await putCourse(req, { params: Promise.resolve({ id: "c123" }) });
      expect(res.status).toBe(401);
    });

    it("PUT /api/courses/[id] should return 403 for unassigned lecturer", async () => {
      mockGetToken.mockResolvedValue({ id: "lec_1", name: "Lecturer One", role: "lecturer" });
      (CourseService.getCourseById as jest.Mock).mockResolvedValue({
        _id: "c123",
        title: "Test Course",
        instructorId: "other_lecturer",
        instructor: "Lecturer Two",
      });

      const req = new NextRequest("http://localhost:3000/api/courses/c123", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Course" }),
      });
      const res = await putCourse(req, { params: Promise.resolve({ id: "c123" }) });
      expect(res.status).toBe(403);
    });

    it("PUT /api/courses/[id] should allow assigned lecturer", async () => {
      mockGetToken.mockResolvedValue({ id: "lec_1", name: "Lecturer One", role: "lecturer" });
      (CourseService.getCourseById as jest.Mock).mockResolvedValue({
        _id: "c123",
        title: "Test Course",
        instructorId: "lec_1",
        instructor: "Lecturer One",
      });

      const req = new NextRequest("http://localhost:3000/api/courses/c123", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Course" }),
      });
      const res = await putCourse(req, { params: Promise.resolve({ id: "c123" }) });
      expect(res.status).toBe(200);
    });

    it("DELETE /api/courses/[id] should return 403 for lecturer", async () => {
      mockGetToken.mockResolvedValue({ id: "lec_1", role: "lecturer" });
      const req = new NextRequest("http://localhost:3000/api/courses/c123", {
        method: "DELETE",
      });
      const res = await deleteCourse(req, { params: Promise.resolve({ id: "c123" }) });
      expect(res.status).toBe(403);
    });

    it("DELETE /api/courses/[id] should succeed for admin", async () => {
      mockGetToken.mockResolvedValue({ id: "adm_1", role: "admin" });
      const req = new NextRequest("http://localhost:3000/api/courses/c123", {
        method: "DELETE",
      });
      const res = await deleteCourse(req, { params: Promise.resolve({ id: "c123" }) });
      expect(res.status).toBe(200);
    });
  });

  describe("3. /api/admin/settings", () => {
    it("GET /api/admin/settings should return 401 when unauthenticated", async () => {
      mockGetToken.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/admin/settings");
      const res = await getSettings(req);
      expect(res.status).toBe(401);
    });

    it("GET /api/admin/settings should return 403 for student or lecturer", async () => {
      mockGetToken.mockResolvedValue({ id: "s1", role: "student" });
      const req1 = new NextRequest("http://localhost:3000/api/admin/settings");
      const res1 = await getSettings(req1);
      expect(res1.status).toBe(403);

      mockGetToken.mockResolvedValue({ id: "l1", role: "lecturer" });
      const req2 = new NextRequest("http://localhost:3000/api/admin/settings");
      const res2 = await getSettings(req2);
      expect(res2.status).toBe(403);
    });

    it("GET /api/admin/settings should succeed for admin", async () => {
      mockGetToken.mockResolvedValue({ id: "a1", role: "admin" });
      const req = new NextRequest("http://localhost:3000/api/admin/settings");
      const res = await getSettings(req);
      expect(res.status).toBe(200);
    });
  });

  describe("4. /api/materials (DELETE IDOR check)", () => {
    it("DELETE /api/materials should return 401 when unauthenticated", async () => {
      mockGetToken.mockResolvedValue(null);
      const req = new NextRequest("http://localhost:3000/api/materials?id=65f123456789012345678901", {
        method: "DELETE",
      });
      const res = await deleteMaterial(req);
      expect(res.status).toBe(401);
    });

    it("DELETE /api/materials should return 403 for student", async () => {
      mockGetToken.mockResolvedValue({ id: "s1", role: "student" });
      const req = new NextRequest("http://localhost:3000/api/materials?id=65f123456789012345678901", {
        method: "DELETE",
      });
      const res = await deleteMaterial(req);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/materials should return 403 if lecturer is not owner and not assigned to course", async () => {
      mockGetToken.mockResolvedValue({ id: "lec_1", name: "Lecturer One", role: "lecturer" });
      (CourseMaterial.findById as jest.Mock).mockResolvedValue({
        _id: "65f123456789012345678901",
        courseId: "65f123456789012345678902",
        lecturerId: "other_lecturer",
      });
      (Course.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: "65f123456789012345678902",
          instructorId: "other_lecturer",
          instructor: "Lecturer Two",
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/materials?id=65f123456789012345678901", {
        method: "DELETE",
      });
      const res = await deleteMaterial(req);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/materials should allow lecturer if they own the material", async () => {
      mockGetToken.mockResolvedValue({ id: "lec_1", name: "Lecturer One", role: "lecturer" });
      (CourseMaterial.findById as jest.Mock).mockResolvedValue({
        _id: "65f123456789012345678901",
        courseId: "65f123456789012345678902",
        lecturerId: "lec_1",
      });

      const req = new NextRequest("http://localhost:3000/api/materials?id=65f123456789012345678901", {
        method: "DELETE",
      });
      const res = await deleteMaterial(req);
      expect(res.status).toBe(200);
    });
  });

  describe("5. /api/setup-admin", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should return 403 if ADMIN_SETUP_SECRET is configured but request has missing/wrong secret", async () => {
      process.env.ADMIN_SETUP_SECRET = "super-secret-key-123";
      const req = new NextRequest("http://localhost:3000/api/setup-admin");
      const res = await getSetupAdmin(req);
      expect(res.status).toBe(403);
    });

    it("should return 403 in production mode when no secret is configured", async () => {
      (process.env as any).NODE_ENV = "production";
      delete process.env.ADMIN_SETUP_SECRET;
      const req = new NextRequest("http://localhost:3000/api/setup-admin");
      const res = await getSetupAdmin(req);
      expect(res.status).toBe(403);
    });
  });
});
