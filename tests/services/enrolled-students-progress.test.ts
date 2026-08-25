/**
 * @jest-environment node
 */

import { getLecturerStudents } from "@/services/announcement.service";
import { calculateStudentCourseProgress } from "@/services/enrollment.service";
import Enrollment from "@/lib/models/Enrollment";
import Course from "@/lib/models/Course";
import Assignment from "@/lib/models/Assignment";
import Exam from "@/lib/models/Exam";
import Submission from "@/lib/models/Submission";

jest.mock("@/lib/db", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/models/Enrollment");
jest.mock("@/lib/models/Course");
jest.mock("@/lib/models/Assignment");
jest.mock("@/lib/models/Exam");
jest.mock("@/lib/models/Submission");
jest.mock("@/lib/models/Batch", () => ({}));
jest.mock("@/lib/models/Notification", () => ({}));
jest.mock("@/lib/models/Announcement", () => ({}));
jest.mock("@/lib/models/User", () => ({}));

describe("Enrolled Students Course Progress Tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calculates course progress dynamically for enrolled students based on submissions", async () => {
    const courseId = "course123";
    const studentId = "student456";

    const mockCourses = [
      {
        _id: courseId,
        title: "Software Engineering",
        instructorId: "lecturer789",
        category: "Computer Science",
      },
    ];

    const mockEnrollments = [
      {
        _id: "enr001",
        userId: {
          _id: studentId,
          name: "John Doe",
          email: "john@example.com",
          status: "active",
        },
        courseId: {
          _id: courseId,
          title: "Software Engineering",
          category: "Computer Science",
        },
        progress: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const mockAssignments = [
      { _id: "assign1", courseId: courseId, title: "Lab 1", category: "Homework" },
      { _id: "assign2", courseId: courseId, title: "Lab 2", category: "Homework" },
    ];

    const mockExams = [
      { _id: "exam1", courseId: courseId, title: "Final Exam", results: [] },
    ];

    // Student has completed 1 assignment out of 3 total items (2 assignments + 1 exam) = 33%
    const mockSubmissions = [
      {
        _id: "sub1",
        assignmentId: "assign1",
        studentId: studentId,
        courseId: courseId,
        status: "submitted",
      },
    ];

    (Course.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockCourses),
    });

    (Enrollment.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockEnrollments),
    });

    (Assignment.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockAssignments),
    });

    (Exam.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockExams),
    });

    (Submission.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockSubmissions),
    });

    (Enrollment.bulkWrite as jest.Mock).mockResolvedValue(true);

    const res = await getLecturerStudents("lecturer789", "Dr. Alan Turing");

    expect(res.students).toHaveLength(1);
    expect(res.students[0].name).toBe("John Doe");
    expect(res.students[0].course).toBe("Software Engineering");
    // 1 completed deliverable / 3 total deliverables = 33%
    expect(res.students[0].progress).toBe(33);
    expect(Enrollment.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: "enr001" },
            update: { $set: { progress: 33 } },
          }),
        }),
      ]),
      { ordered: false }
    );
  });

  it("calculates 100% progress when student completes all course assignments and exams", async () => {
    const courseId = "course123";
    const studentId = "student456";

    const mockCourse = {
      _id: courseId,
      title: "Data Structures",
      assessmentItems: [
        { name: "Assignment 1", type: "assignment", weight: 50 },
        { name: "Final Exam", type: "exam", weight: 50 },
      ],
    };

    const mockAssignments = [
      { _id: "a1", courseId: courseId, title: "Assignment 1" },
    ];

    const mockExams = [
      {
        _id: "e1",
        courseId: courseId,
        title: "Final Exam",
        status: "completed",
        results: [{ studentId: studentId, marks: 95 }],
      },
    ];

    const mockSubmissions = [
      {
        _id: "s1",
        assignmentId: "a1",
        studentId: studentId,
        courseId: courseId,
        status: "graded",
      },
    ];

    const mockEnrollment = {
      _id: "enr002",
      userId: studentId,
      courseId: courseId,
      progress: 0,
    };

    (Course.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockCourse),
    });

    (Assignment.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockAssignments),
    });

    (Exam.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockExams),
    });

    (Submission.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockSubmissions),
    });

    (Enrollment.findOne as jest.Mock).mockResolvedValue(mockEnrollment);
    (Enrollment.updateOne as jest.Mock).mockResolvedValue(true);

    const progress = await calculateStudentCourseProgress(studentId, courseId);

    expect(progress).toBe(100);
    expect(Enrollment.updateOne).toHaveBeenCalledWith(
      { _id: "enr002" },
      { $set: { progress: 100 } }
    );
  });
});
