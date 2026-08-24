"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/contexts/ToastContext";

export interface GradebookItem {
  _id: string;
  studentName: string;
  studentEmail?: string;
  assignmentTitle: string;
  courseTitle: string;
  files?: string[];
  content?: string;
  submittedAt?: string;
  isOverdue?: boolean;
  grade?: number;
  maxPoints?: number;
  feedback?: string;
  gradedAt?: string;
}

export function useGradebook() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "graded">("pending");
  const [pendingQueue, setPendingQueue] = useState<GradebookItem[]>([]);
  const [gradedQueue, setGradedQueue] = useState<GradebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedGradeRange, setSelectedGradeRange] = useState("All");

  const [gradingItem, setGradingItem] = useState<GradebookItem | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lecturer/grading-queue");
      if (res.ok) {
        const data = await res.json();
        const pending = data.pendingQueue || data.queue || [];
        const graded = data.gradedQueue || [];
        setPendingQueue(pending);
        setGradedQueue(graded);
      }
    } catch (err) {
      console.error("Failed to load gradebook:", err);
      toast.error("Failed to load gradebook data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleOpenGradeModal = (item: GradebookItem) => {
    setGradingItem(item);
    setGradeValue(item.grade !== undefined && item.grade !== null ? item.grade.toString() : "");
    setFeedback(item.feedback || "");
  };

  const handleCloseGradeModal = () => {
    setGradingItem(null);
    setGradeValue("");
    setFeedback("");
  };

  const submitGrade = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gradingItem) return false;

    const numGrade = Number(gradeValue);
    if (gradeValue.trim() === "" || isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      toast.error("Please enter a valid grade between 0 and 100");
      return false;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/grade-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingItem._id,
          grade: numGrade,
          feedback,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully saved grade for ${gradingItem.studentName}`);
        handleCloseGradeModal();
        await fetchQueue();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to submit grade");
        return false;
      }
    } catch (err) {
      console.error("Grade submit error:", err);
      toast.error("Failed to submit grade");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const coursesList = useMemo(() => {
    const allCourses = [...pendingQueue, ...gradedQueue].map((item) => item.courseTitle).filter(Boolean);
    return Array.from(new Set(allCourses));
  }, [pendingQueue, gradedQueue]);

  const averageGrade = useMemo(() => {
    if (gradedQueue.length === 0) return 0;
    const sum = gradedQueue.reduce((acc, curr) => acc + (Number(curr.grade) || 0), 0);
    return Math.round((sum / gradedQueue.length) * 10) / 10;
  }, [gradedQueue]);

  const filteredPending = useMemo(() => {
    return pendingQueue.filter((item) => {
      if (selectedCourse !== "All" && item.courseTitle !== selectedCourse) return false;
      return true;
    });
  }, [pendingQueue, selectedCourse]);

  const filteredGraded = useMemo(() => {
    return gradedQueue.filter((item) => {
      if (selectedCourse !== "All" && item.courseTitle !== selectedCourse) return false;

      const grade = Number(item.grade);
      if (selectedGradeRange === "90-100" && (grade < 90 || grade > 100)) return false;
      if (selectedGradeRange === "80-89" && (grade < 80 || grade >= 90)) return false;
      if (selectedGradeRange === "70-79" && (grade < 70 || grade >= 80)) return false;
      if (selectedGradeRange === "below-70" && grade >= 70) return false;

      return true;
    });
  }, [gradedQueue, selectedCourse, selectedGradeRange]);

  return {
    activeTab,
    setActiveTab,
    pendingQueue,
    gradedQueue,
    loading,
    selectedCourse,
    setSelectedCourse,
    selectedGradeRange,
    setSelectedGradeRange,
    gradingItem,
    gradeValue,
    setGradeValue,
    feedback,
    setFeedback,
    isSubmitting,
    fetchQueue,
    handleOpenGradeModal,
    handleCloseGradeModal,
    submitGrade,
    coursesList,
    averageGrade,
    filteredPending,
    filteredGraded,
  };
}
