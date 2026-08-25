/**
 * @jest-environment node
 */

import { updateAssignment, submitAssignment, getStudentAssignments } from "@/services/assignment.service";
import { generateUploadUrl } from "@/services/material.service";
import Assignment from "@/lib/models/Assignment";
import Submission from "@/lib/models/Submission";
import Course from "@/lib/models/Course";
import Enrollment from "@/lib/models/Enrollment";
import Notification from "@/lib/models/Notification";
import { BadRequestError } from "@/lib/core/errors";

jest.mock("@/lib/db", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/r2", () => ({
  generatePresignedUploadUrl: jest.fn().mockResolvedValue("https://r2.example.com/upload"),
  getFilePublicUrl: jest.fn((key) => `https://pub.example.com/${key}`),
}));

jest.mock("@/lib/models/Assignment");
jest.mock("@/lib/models/Submission");
jest.mock("@/lib/models/Course");
jest.mock("@/lib/models/Enrollment");
jest.mock("@/lib/models/Notification");
jest.mock("@/lib/models/User", () => ({}));

describe("Assignment Submission Control & Deadline Extension", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateAssignment (Disable Submissions & Extend Deadline)", () => {
    it("allows lecturer to close an assignment and disable submissions", async () => {
      const mockAssignment: any = {
        _id: "assign1",
        title: "Database Project",
        dueDate: new Date("2026-09-01"),
        status: "open",
        courseId: { _id: "course1", title: "CS101", instructorId: "lecturer1" },
        save: jest.fn().mockResolvedValue(true),
      };

      (Assignment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAssignment),
      });

      const updated = await updateAssignment("assign1", "lecturer1", "Dr. Smith", {
        status: "closed",
      });

      expect(mockAssignment.status).toBe("closed");
      expect(mockAssignment.save).toHaveBeenCalled();
      expect(updated.status).toBe("closed");
    });

    it("allows lecturer to extend assignment deadline and notifies enrolled students", async () => {
      const oldDate = new Date("2026-08-20");
      const newDate = new Date("2026-09-10");

      const mockAssignment: any = {
        _id: "assign1",
        title: "Database Project",
        dueDate: oldDate,
        status: "open",
        courseId: { _id: "course1", title: "CS101", instructorId: "lecturer1" },
        save: jest.fn().mockResolvedValue(true),
      };

      (Assignment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAssignment),
      });

      (Enrollment.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { userId: "student1", courseId: "course1" },
          { userId: "student2", courseId: "course1" },
        ]),
      });

      (Notification.insertMany as jest.Mock).mockResolvedValue(true);

      const updated = await updateAssignment("assign1", "lecturer1", "Dr. Smith", {
        dueDate: newDate.toISOString(),
      });

      expect(mockAssignment.dueDate).toEqual(newDate);
      expect(mockAssignment.save).toHaveBeenCalled();
      expect(Notification.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "student1",
            type: "assignment",
            message: expect.stringContaining("Deadline Extended"),
          }),
          expect.objectContaining({
            userId: "student2",
            type: "assignment",
            message: expect.stringContaining("Deadline Extended"),
          }),
        ])
      );
    });
  });

  describe("submitAssignment (Submission Blocking when Closed)", () => {
    it("blocks student submission when assignment is closed", async () => {
      (Assignment.findById as jest.Mock).mockResolvedValue({
        _id: "assign1",
        title: "Closed Assignment",
        status: "closed",
        dueDate: new Date("2026-08-01"),
      });

      await expect(
        submitAssignment("student1", {
          assignmentId: "assign1",
          content: "My submission after close",
        })
      ).rejects.toThrow(BadRequestError);

      expect(Submission.create).not.toHaveBeenCalled();
    });

    it("allows student submission when assignment is open", async () => {
      (Assignment.findById as jest.Mock).mockResolvedValue({
        _id: "assign2",
        title: "Open Assignment",
        status: "open",
        dueDate: new Date("2026-10-01"),
        courseId: "course1",
      });

      (Submission.findOne as jest.Mock).mockResolvedValue(null);
      (Submission.create as jest.Mock).mockResolvedValue({
        _id: "sub1",
        assignmentId: "assign2",
        status: "submitted",
      });
      (Assignment.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      const res = await submitAssignment("student1", {
        assignmentId: "assign2",
        content: "Here is my work",
      });

      expect(res.submission).toBeDefined();
      expect(Submission.create).toHaveBeenCalled();
    });
  });

  describe("generateUploadUrl (Upload Blocking for Closed Assignment)", () => {
    it("rejects file upload URL generation if assignment is closed", async () => {
      (Assignment.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: "assign1",
          status: "closed",
        }),
      });

      await expect(
        generateUploadUrl(
          {
            fileName: "project.zip",
            fileType: "application/zip",
            courseId: "course1",
            assignmentId: "assign1",
          },
          { id: "student1", role: "student" }
        )
      ).rejects.toThrow("Submissions for this assignment have been closed. File upload is not permitted.");
    });
  });
});
