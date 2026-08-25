"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiFileText,
  FiUser,
  FiSearch,
  FiAlertCircle,
  FiLoader
} from "react-icons/fi";
import { useToast } from "@/contexts/ToastContext";

interface StudentGradeEntry {
  studentId: string;
  name: string;
  email: string;
  image?: string;
  marks: number | string;
  maxMarks: number;
  attendanceMarks?: number | string;
  grade?: string;
  feedback?: string;
  gradedAt?: string | null;
  isGraded?: boolean;
}

interface ExamGradingModalProps {
  examId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ExamGradingModal({
  examId,
  onClose,
  onSuccess,
}: ExamGradingModalProps) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [examData, setExamData] = useState<any>(null);
  const [students, setStudents] = useState<StudentGradeEntry[]>([]);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lecturer/exams/${examId}/grades`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setExamData(data.exam);
        setMaxMarks(data.exam?.maxMarks || 100);
        setStudents(data.students || []);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to load exam gradebook");
      }
    } catch (err) {
      console.error("Failed to load exam roster:", err);
      toast.error("Failed to load exam roster");
    } finally {
      setLoading(false);
    }
  }, [examId, toast]);

  useEffect(() => {
    if (examId) {
      fetchRoster();
    }
  }, [examId, fetchRoster]);

  const computeLetterGrade = (marks: number | string, max: number) => {
    if (marks === "" || marks === null || marks === undefined) return { grade: "—", color: "text-gray-400 bg-gray-50 border-gray-200" };
    const num = Number(marks);
    if (isNaN(num)) return { grade: "—", color: "text-gray-400 bg-gray-50 border-gray-200" };
    const pct = max > 0 ? (num / max) * 100 : 0;

    if (pct >= 80) return { grade: "A", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (pct >= 70) return { grade: "B", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (pct >= 60) return { grade: "C", color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (pct >= 50) return { grade: "S", color: "text-purple-700 bg-purple-50 border-purple-200" };
    return { grade: "F", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const handleMarkChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          return {
            ...s,
            marks: value,
          };
        }
        return s;
      })
    );
  };

  const handleAttendanceChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          return {
            ...s,
            attendanceMarks: value,
          };
        }
        return s;
      })
    );
  };

  const handleFeedbackChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId === studentId) {
          return {
            ...s,
            feedback: value,
          };
        }
        return s;
      })
    );
  };

  const handleSaveGrades = async (sendToStudents: boolean = false) => {
    const attendanceMax = examData?.attendanceItem?.weight || 100;

    for (const s of students) {
      if (s.marks !== "" && s.marks !== null && s.marks !== undefined) {
        const num = Number(s.marks);
        if (isNaN(num) || num < 0 || num > maxMarks) {
          toast.error(`Invalid exam mark for ${s.name}. Please enter a number between 0 and ${maxMarks}.`);
          return;
        }
      }

      if (hasAttendance && s.attendanceMarks !== "" && s.attendanceMarks !== null && s.attendanceMarks !== undefined) {
        const attNum = Number(s.attendanceMarks);
        if (isNaN(attNum) || attNum < 0 || attNum > attendanceMax) {
          toast.error(`Invalid attendance mark for ${s.name}. Please enter a value between 0 and ${attendanceMax}.`);
          return;
        }
      }
    }

    if (sendToStudents) {
      const enteredCount = students.filter(
        (s) => s.marks !== "" && s.marks !== null && s.marks !== undefined
      ).length;
      if (enteredCount === 0) {
        toast.warning("Please enter exam marks for at least one student before publishing results.");
        return;
      }
    }

    if (sendToStudents) setPublishing(true);
    else setSaving(true);

    try {
      const payload = {
        maxMarks: Number(maxMarks) || 100,
        sendToStudents,
        grades: students.map((s) => ({
          studentId: s.studentId,
          marks: s.marks,
          attendanceMarks: hasAttendance ? s.attendanceMarks : undefined,
          feedback: s.feedback || "",
          maxMarks: Number(maxMarks) || 100,
        })),
      };

      const res = await fetch(`/api/lecturer/exams/${examId}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(
          json.message ||
            (sendToStudents
              ? "Exam marks published & sent to students successfully!"
              : "Exam marks draft saved!")
        );
        if (onSuccess) onSuccess();
        if (sendToStudents) {
          onClose();
        } else {
          fetchRoster();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to save exam marks");
      }
    } catch (err) {
      console.error("Save exam grades error:", err);
      toast.error("Error saving exam marks");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const hasAttendance = Boolean(examData?.attendanceItem || examData?.hasAttendance);
  const attendanceWeight = examData?.attendanceItem?.weight || 10;

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const gradedCount = useMemo(() => {
    return students.filter(
      (s) => s.marks !== "" && s.marks !== null && s.marks !== undefined && !isNaN(Number(s.marks))
    ).length;
  }, [students]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
              <FiFileText />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1E293B]">
                {examData?.title || "Exam Grading"}
              </h2>
              <p className="text-xs text-gray-400">
                {examData?.courseTitle || "Course"} &middot; {examData?.weight || 40}% Course Weight
                {hasAttendance && (
                  <span className="ml-1 text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                    + {attendanceWeight}% Attendance Marks
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search enrolled students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs text-gray-700 rounded-xl py-2 pl-8 pr-3 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#5A67D8] transition font-medium"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold self-end sm:self-auto">
            <span>Marks Entered: <strong className="text-purple-600">{gradedCount}</strong> / {students.length}</span>
            <div className="flex items-center gap-1">
              <span>Exam Max:</span>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
                className="w-14 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          </div>
        </div>

        {/* Student Marks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <FiLoader className="text-2xl text-purple-600 animate-spin" />
              <p className="text-xs">Loading enrolled students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FiUser className="text-3xl text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">No Enrolled Students</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Enrolled students in this course will appear here for grading.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No students match &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`hidden sm:grid ${hasAttendance ? "grid-cols-12" : "grid-cols-12"} gap-3 px-3 py-1 text-[10px] font-bold uppercase text-gray-400`}>
                <div className={hasAttendance ? "col-span-3" : "col-span-4"}>Student</div>
                <div className={hasAttendance ? "col-span-2 text-center" : "col-span-3 text-center"}>Exam Marks (0 – {maxMarks})</div>
                {hasAttendance && (
                  <div className="col-span-2 text-center">
                    Attendance (0 – {attendanceWeight})
                  </div>
                )}
                <div className="col-span-2 text-center">Grade</div>
                <div className={hasAttendance ? "col-span-3" : "col-span-3"}>Feedback</div>
              </div>

              {filteredStudents.map((student, idx) => {
                const gradeInfo = computeLetterGrade(student.marks, maxMarks);
                return (
                  <div
                    key={student.studentId || idx}
                    className={`p-3 bg-white rounded-xl border border-gray-200 flex flex-col sm:grid ${hasAttendance ? "sm:grid-cols-12" : "sm:grid-cols-12"} gap-2 sm:items-center hover:border-gray-300 transition`}
                  >
                    {/* Student Info */}
                    <div className={`${hasAttendance ? "sm:col-span-3" : "sm:col-span-4"} flex items-center gap-2.5`}>
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 font-extrabold flex items-center justify-center text-xs shrink-0">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{student.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>

                    {/* Exam Marks Input */}
                    <div className={`${hasAttendance ? "sm:col-span-2" : "sm:col-span-3"} flex items-center justify-center`}>
                      <div className="relative w-full max-w-[110px]">
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          placeholder={`0 - ${maxMarks}`}
                          value={student.marks}
                          onChange={(e) => handleMarkChange(student.studentId, e.target.value)}
                          className="w-full border border-gray-200 rounded-xl py-1.5 px-2 text-xs text-center font-bold text-gray-800 outline-none focus:ring-1 focus:ring-[#5A67D8]"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-gray-400 pointer-events-none">
                          /{maxMarks}
                        </span>
                      </div>
                    </div>

                    {/* Optional Attendance Marks Input (Only shown if module has attendance in breakdown) */}
                    {hasAttendance && (
                      <div className="sm:col-span-2 flex items-center justify-center">
                        <div className="relative w-full max-w-[100px]">
                          <input
                            type="number"
                            min="0"
                            max={attendanceWeight}
                            placeholder={`0 - ${attendanceWeight}`}
                            value={student.attendanceMarks !== undefined ? student.attendanceMarks : ""}
                            onChange={(e) => handleAttendanceChange(student.studentId, e.target.value)}
                            className="w-full border border-purple-200 bg-purple-50/30 rounded-xl py-1.5 px-2 text-xs text-center font-bold text-purple-900 outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-purple-400 pointer-events-none">
                            /{attendanceWeight}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Grade Badge */}
                    <div className="sm:col-span-2 flex items-center justify-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border uppercase text-center min-w-[36px] ${gradeInfo.color}`}
                      >
                        {gradeInfo.grade}
                      </span>
                    </div>

                    {/* Feedback */}
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Optional feedback..."
                        value={student.feedback || ""}
                        onChange={(e) => handleFeedbackChange(student.studentId, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-[#5A67D8]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-white shrink-0">
          <div className="text-[11px] text-gray-400 flex items-center gap-1">
            <FiAlertCircle className="text-purple-600 shrink-0" />
            <span>
              {hasAttendance
                ? "Entering exam & attendance marks will notify students with their full final assessment breakdown."
                : "Sending will notify all enrolled students with their exam marks."}
            </span>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveGrades(false)}
              disabled={saving || publishing || loading || students.length === 0}
              className="px-4 py-2 border border-purple-200 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-100 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSaveGrades(true)}
              disabled={saving || publishing || loading || students.length === 0}
              className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Send to Students"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
