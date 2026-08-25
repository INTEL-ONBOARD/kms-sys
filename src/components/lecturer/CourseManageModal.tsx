"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiX,
  FiBookOpen,
  FiUsers,
  FiClipboard,
  FiVideo,
  FiEdit,
  FiCheckCircle,
  FiPlus,
  FiFileText,
  FiUploadCloud,
  FiDownload,
  FiTrash2,
  FiExternalLink,
  FiClock,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiSliders,
  FiAlertCircle
} from "react-icons/fi";
import { useToast } from "@/contexts/ToastContext";
import QuickActionModal from "./QuickActionModal";
import MaterialUploadModal from "./MaterialUploadModal";
import { 
  DEFAULT_GRADING_SCALE, 
  GRADING_SCALE_PRESETS, 
  GradeBoundary, 
  resolveGradeFromScale,
  getGradeBadgeColors
} from "@/lib/grading";

interface CourseManageModalProps {
  course: {
    _id: string;
    title: string;
    category: string;
    description?: string;
    studentCount: number;
    avgCompletion: number;
    assignmentCount: number;
    status?: string;
    published?: boolean;
    schedule?: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      location: string;
      type?: "physical" | "online";
    }>;
    gradingScale?: GradeBoundary[];
    credits?: number;
    assessmentItems?: Array<{
      _id?: string;
      name: string;
      type?: string;
      weight: number;
    }>;
    gradingBreakdown?: {
      assignmentsWeight?: number;
      courseWorkWeight?: number;
      finalExamWeight?: number;
      attendanceWeight?: number;
    };
  };
  initialTab?: "overview" | "grading" | "scale" | "schedule" | "materials" | "assignments" | "classes" | "students" | "breakdown";
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CourseManageModal({ course, initialTab, onClose, onUpdate }: CourseManageModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "grading" | "scale" | "schedule" | "materials" | "assignments" | "classes" | "students">(
    initialTab === "breakdown" ? "grading" : (initialTab as any) || "overview"
  );

  // Form states
  const [description, setDescription] = useState(course.description || "Comprehensive course curriculum.");
  const [published, setPublished] = useState(course.published ?? true);
  const [credits, setCredits] = useState<number>((course as any).credits || 3);
  const [saving, setSaving] = useState(false);

  // Course-specific dynamic grading scale & cutoff thresholds (e.g. A >= 70)
  const [gradingScale, setGradingScale] = useState<GradeBoundary[]>(() => {
    if (course.gradingScale && course.gradingScale.length > 0) {
      return course.gradingScale;
    }
    return DEFAULT_GRADING_SCALE;
  });

  // Interactive Live Score Simulator State
  const [simulatorScore, setSimulatorScore] = useState("72");

  // Weekly Schedule Slots state for Course Timetable
  const [scheduleSlots, setScheduleSlots] = useState<Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
    type?: "physical" | "online";
  }>>(course.schedule || []);

  // Assessment & Grade Breakdown items (fully customizable by the lecturer)
  const [assessmentItems, setAssessmentItems] = useState<any[]>(() => {
    if (course.assessmentItems && course.assessmentItems.length > 0) {
      return course.assessmentItems.map((item: any) => ({
        _id: item._id,
        name: item.name || "Assessment",
        type: item.type || "assignment",
        weight: Number(item.weight) || 0,
      }));
    }
    return [
      { name: "Assignments", type: "assignment", weight: course.gradingBreakdown?.assignmentsWeight ?? 20 },
      { name: "Course work 1", type: "coursework", weight: course.gradingBreakdown?.courseWorkWeight ?? 30 },
      { name: "Final exam", type: "exam", weight: course.gradingBreakdown?.finalExamWeight ?? 40 },
      { name: "Attendance", type: "attendance", weight: course.gradingBreakdown?.attendanceWeight ?? 10 },
    ];
  });

  // New assessment item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"assignment" | "exam" | "coursework" | "attendance" | "quiz" | "project" | "other">("assignment");
  const [newItemWeight, setNewItemWeight] = useState<number>(20);
  const [showAddForm, setShowAddForm] = useState(false);

  // Data states
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Quick Action Modal state for course-specific action
  const [quickModalType, setQuickModalType] = useState<"assignment" | "class" | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoadingData(true);
      try {
        const [assignRes, classRes, studentRes, matRes, courseRes] = await Promise.all([
          fetch("/api/lecturer/assignments?limit=50"),
          fetch("/api/lecturer/schedule?all=true"),
          fetch(`/api/lecturer/students?courseId=${course._id}`),
          fetch(`/api/materials?courseId=${course._id}`),
          fetch(`/api/courses/${course._id}`),
        ]);

        if (courseRes.ok) {
          const cData = await courseRes.json();
          if (cData && Array.isArray(cData.schedule)) {
            setScheduleSlots(cData.schedule);
          }
          if (cData && Array.isArray(cData.gradingScale) && cData.gradingScale.length > 0) {
            setGradingScale(cData.gradingScale);
          }
          if (cData && typeof cData.credits === "number") {
            setCredits(cData.credits);
          }
        }

        if (assignRes.ok) {
          const assignData = await assignRes.json();
          const filteredAssign = (assignData.assignments || []).filter(
            (a: any) => a.courseId?._id === course._id || a.courseId === course._id
          );
          setAssignments(filteredAssign);
        }

        if (classRes.ok) {
          const classData = await classRes.json();
          const filteredClasses = (classData.schedule || []).filter(
            (c: any) => c.courseId?._id === course._id || c.courseId === course._id
          );
          setLiveClasses(filteredClasses);
        }

        if (studentRes.ok) {
          const studentData = await studentRes.json();
          setStudents(studentData.students || []);
        }

        if (matRes.ok) {
          const matData = await matRes.json();
          setMaterials(matData.data || []);
        }
      } catch (err) {
        console.error("Failed to load course detail data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCourseDetails();
  }, [course._id]);

  const refreshMaterials = async () => {
    try {
      const res = await fetch(`/api/materials?courseId=${course._id}`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.data || data.materials || (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error("Failed to reload materials:", err);
    }
  };

  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This will remove the file from Cloudflare R2 storage.`)) return;
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Material deleted");
        setMaterials((prev) => prev.filter((m) => m._id !== id));
      } else {
        toast.error("Failed to delete material");
      }
    } catch {
      toast.error("Error deleting material");
    }
  };

  const totalAssessmentWeight = assessmentItems.reduce((acc, item) => acc + (Number(item.weight) || 0), 0);

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) {
      toast.error("Please enter a name for the assessment component");
      return;
    }
    if (newItemWeight <= 0) {
      toast.error("Weight must be greater than 0");
      return;
    }
    setAssessmentItems((prev) => [
      ...prev,
      {
        name: newItemName.trim(),
        type: newItemType,
        weight: Number(newItemWeight),
      },
    ]);
    setNewItemName("");
    setNewItemWeight(15);
    setShowAddForm(false);
    toast.success("Assessment component added");
  };

  const handleQuickAdd = (type: "assignment" | "exam" | "coursework" | "quiz" | "project" | "attendance", defaultName: string, defaultWeight: number) => {
    const existingOfType = assessmentItems.filter((i) => i.type === type).length;
    const computedName = existingOfType > 0 ? `${defaultName} ${existingOfType + 1}` : defaultName;
    setAssessmentItems((prev) => [
      ...prev,
      {
        name: computedName,
        type,
        weight: defaultWeight,
      },
    ]);
    toast.success(`Added ${computedName}`);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setAssessmentItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteItem = (index: number) => {
    setAssessmentItems((prev) => prev.filter((_, i) => i !== index));
    toast.success("Item removed from breakdown");
  };

  // Grading Scale Handlers
  const addGradeBoundary = () => {
    setGradingScale((prev) => [
      ...prev,
      { grade: "A+", minScore: 90, gpaPoint: 4.0, description: "High Distinction", color: "emerald" },
    ]);
  };

  const updateGradeBoundary = (index: number, field: string, value: any) => {
    setGradingScale((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const deleteGradeBoundary = (index: number) => {
    if (gradingScale.length <= 1) {
      toast.error("Grading scale must have at least one grade tier");
      return;
    }
    setGradingScale((prev) => prev.filter((_, i) => i !== index));
    toast.success("Grade tier removed");
  };

  const applyGradingPreset = (presetKey: string) => {
    const preset = GRADING_SCALE_PRESETS[presetKey];
    if (preset) {
      setGradingScale(preset.scale);
      toast.success(`Applied preset: ${preset.name}`);
    }
  };

  const handleSaveGradingScale = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${course._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradingScale,
        }),
      });

      if (res.ok) {
        toast.success("Course grading system & cutoffs updated! Enrolled students notified.");
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to update grading scale");
      }
    } catch {
      toast.error("Error saving grading scale");
    } finally {
      setSaving(false);
    }
  };

  // Schedule Slot Handlers for Weekly Timetable
  const addScheduleSlot = () => {
    setScheduleSlots((prev) => [
      ...prev,
      { dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00", location: "Lecture Hall 1", type: "physical" },
    ]);
  };

  const updateScheduleSlot = (index: number, field: string, value: string) => {
    setScheduleSlots((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeScheduleSlot = (index: number) => {
    setScheduleSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${course._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule: scheduleSlots,
        }),
      });

      if (res.ok) {
        toast.success("Weekly course schedule & timetable updated! Enrolled students notified.");
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to update course schedule");
      }
    } catch {
      toast.error("Error saving course schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (totalAssessmentWeight !== 100) {
      toast.error(`Assessment weights must sum up to exactly 100% (Current total: ${totalAssessmentWeight}%)`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${course._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          published,
          credits: Math.max(1, Math.min(30, Number(credits) || 3)),
          schedule: scheduleSlots,
          gradingScale,
          assessmentItems: assessmentItems.map((item) => ({
            name: item.name,
            type: item.type,
            weight: Number(item.weight),
          })),
        }),
      });

      if (res.ok) {
        toast.success(`Course settings, grading system & timetable updated!`);
        if (onUpdate) onUpdate();
        onClose();
      } else {
        toast.error("Failed to update course settings");
      }
    } catch (err) {
      console.error("Error saving course:", err);
      toast.error("An error occurred while saving course parameters");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-[#F7FAFC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#EEF2FF] text-[#5A67D8]">
                {course.category}
              </span>
              <span className="text-xs text-[#A0AEC0] font-semibold">
                WISE-{course._id.substring(0, 4).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#2D3748]">{course.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 px-6 bg-white text-xs font-bold text-gray-500 gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "overview"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiBookOpen /> Overview & Settings
          </button>
          <button
            onClick={() => setActiveTab("grading")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "grading"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiEdit /> Grade Breakdown
          </button>
          <button
            onClick={() => setActiveTab("scale")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "scale"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiAward /> Grading System & Cutoffs ({gradingScale.length} Tiers)
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "schedule"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiClock /> Weekly Timetable ({scheduleSlots.length})
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "materials"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiFileText /> Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "assignments"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiClipboard /> Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "classes"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiVideo /> Live Classes ({liveClasses.length})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`py-3 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "students"
                ? "border-[#5A67D8] text-[#5A67D8]"
                : "border-transparent hover:text-gray-800"
            }`}
          >
            <FiUsers /> Students ({course.studentCount || students.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                    <span className="text-2xl font-bold text-[#5A67D8]">{course.studentCount}</span>
                    <p className="text-xs font-semibold text-[#A0AEC0] mt-1">Enrolled Students</p>
                  </div>
                  <div className="p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                    <span className="text-2xl font-bold text-[#5A67D8]">{course.avgCompletion}%</span>
                    <p className="text-xs font-semibold text-[#A0AEC0] mt-1">Avg Completion</p>
                  </div>
                  <div className="p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                    <span className="text-2xl font-bold text-[#5A67D8]">{course.assignmentCount}</span>
                    <p className="text-xs font-semibold text-[#A0AEC0] mt-1">Total Tasks</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">Course Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                  />
                </div>

                {/* Course Academic Credits Input */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3748] flex items-center gap-1.5">
                      <FiAward className="text-[#5A67D8]" /> Course Academic Credits
                    </h4>
                    <p className="text-[11px] text-[#A0AEC0] mt-0.5">
                      Assigned credit weighting used for standard weighted GPA & CGPA calculations: &sum;(GPA &times; Credits) / &sum;Credits.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={credits}
                      onChange={(e) => setCredits(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                      className="w-20 border border-gray-200 rounded-xl p-2 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white shadow-2xs"
                    />
                    <span className="text-xs font-bold text-gray-500">Credits</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3748]">Course Visibility</h4>
                    <p className="text-[11px] text-[#A0AEC0]">Allow enrolled students to access learning materials</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A67D8]"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB: GRADE BREAKDOWN (CONFIGURED BY LECTURER) */}
            {activeTab === "grading" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#2D3748]">Course Assessment & Grade Breakdown</h3>
                    <p className="text-xs text-[#A0AEC0] mt-0.5">
                      Configure and customize all scheduled assignments, exams, and coursework for this module.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <FiPlus /> {showAddForm ? "Cancel Add" : "Add Assessment / Assignment"}
                  </button>
                </div>

                {/* Quick Add Presets Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-bold text-gray-400 shrink-0">Quick Add:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd("assignment", "Assignment", 20)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#5A67D8] font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                  >
                    <FiPlus className="text-xs" /> + Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd("coursework", "Course Work", 30)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                  >
                    <FiPlus className="text-xs" /> + Coursework
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd("exam", "Final Exam", 40)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                  >
                    <FiPlus className="text-xs" /> + Final Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd("attendance", "Attendance", 10)}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg transition shrink-0 flex items-center gap-1"
                  >
                    <FiPlus className="text-xs" /> + Attendance
                  </button>
                </div>

                {/* Add New Custom Assessment Item Form */}
                {showAddForm && (
                  <form onSubmit={handleAddItem} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3 animate-in fade-in">
                    <h4 className="text-xs font-bold text-[#5A67D8]">Add New Assessment Component</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Component Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Assignment 2: React State"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-[#5A67D8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Type / Category</label>
                        <select
                          value={newItemType}
                          onChange={(e: any) => setNewItemType(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-[#5A67D8]"
                        >
                          <option value="assignment">Assignment</option>
                          <option value="coursework">Coursework</option>
                          <option value="exam">Final Exam</option>
                          <option value="quiz">Quiz</option>
                          <option value="project">Project</option>
                          <option value="attendance">Attendance</option>
                          <option value="other">Other Assessment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Allocated Weight (%)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={newItemWeight}
                            onChange={(e) => setNewItemWeight(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-bold text-gray-800 outline-none focus:ring-1 focus:ring-[#5A67D8]"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {/* List of Configured Assessment Components */}
                <div className="space-y-2.5">
                  {assessmentItems.length === 0 ? (
                    <div className="text-center py-8 bg-[#F7FAFC] rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                      No assessment components configured yet. Click above to add assignments or exams.
                    </div>
                  ) : (
                    assessmentItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#F7FAFC] hover:bg-white rounded-xl border border-gray-100 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-[#5A67D8] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, "name", e.target.value)}
                              className="font-bold text-[#2D3748] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#5A67D8] focus:bg-white px-1 py-0.5 rounded outline-none w-full text-xs"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                              <select
                                value={item.type || "assignment"}
                                onChange={(e) => handleUpdateItem(idx, "type", e.target.value)}
                                className="text-[10px] font-bold uppercase text-gray-500 bg-transparent border border-gray-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                              >
                                <option value="assignment">Assignment</option>
                                <option value="coursework">Coursework</option>
                                <option value="exam">Exam</option>
                                <option value="quiz">Quiz</option>
                                <option value="project">Project</option>
                                <option value="attendance">Attendance</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400">Weight:</span>
                            <div className="relative w-18">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.weight}
                                onChange={(e) => handleUpdateItem(idx, "weight", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                                className="w-16 bg-white border border-gray-200 rounded-lg py-1 px-2 text-right text-xs font-bold text-[#5A67D8] outline-none focus:ring-1 focus:ring-[#5A67D8]"
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-500">%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove component"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Summary Total Indicator */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    totalAssessmentWeight === 100
                      ? "bg-green-50/70 border-green-200 text-green-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-base" />
                    <span className="text-xs font-bold">
                      {totalAssessmentWeight === 100
                        ? "Total Assessment Allocation: Exactly 100%"
                        : `Total Allocation: ${totalAssessmentWeight}% (Must equal 100% to save)`}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-white shadow-xs">
                    {assessmentItems.length} Components = {totalAssessmentWeight}%
                  </span>
                </div>
              </div>
            )}

            {/* TAB: GRADING SYSTEM & SCORE CUTOFF THRESHOLDS (CONFIGURABLE BY LECTURER) */}
            {activeTab === "scale" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#2D3748] flex items-center gap-2">
                      <FiAward className="text-indigo-600" /> Course Grading System & Cutoff Thresholds
                    </h3>
                    <p className="text-xs text-[#A0AEC0] mt-0.5">
                      Configure letter grade cutoff boundaries (e.g. give an &quot;A&quot; pass for all students scoring above 70%), GPA points, and honors.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addGradeBoundary}
                      className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FiPlus /> Add Grade Tier
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGradingScale}
                      disabled={saving}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Grading Scale"}
                    </button>
                  </div>
                </div>

                {/* Quick Presets Selector Bar */}
                <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <FiSliders className="text-indigo-600 text-sm" /> Apply Standard Scheme Presets:
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Quickly apply pre-configured cutoff templates</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyGradingPreset("lenient")}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Grades all students >= 70% with an 'A'"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Lenient (70%+ &rarr; A)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyGradingPreset("standard")}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5A67D8] font-bold rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Standard (80%+ &rarr; A)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyGradingPreset("detailed")}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl border border-purple-200 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>9-Tier (A+, A, A-...)</span>
                    </button>
                  </div>
                </div>

                {/* LIVE INTERACTIVE SCORE SIMULATOR */}
                {(() => {
                  const testScoreNum = Number(simulatorScore) || 0;
                  const simResult = resolveGradeFromScale(testScoreNum, gradingScale);
                  return (
                    <div className="p-4 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
                          %
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">Live Threshold Simulator</p>
                          <p className="text-[11px] text-gray-500">Test how student marks map to this course&apos;s active scale</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
                          <label className="text-[11px] font-bold text-gray-400">Score:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={simulatorScore}
                            onChange={(e) => setSimulatorScore(e.target.value)}
                            className="w-14 text-center font-black text-xs text-[#1E293B] outline-none"
                          />
                          <span className="text-xs font-bold text-gray-400">%</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-xl font-black text-sm border shadow-xs ${simResult.badgeClass}`}>
                            Grade: {simResult.grade}
                          </span>
                          <span className="px-2.5 py-1.5 rounded-xl bg-white text-gray-700 font-bold text-xs border border-gray-200 shadow-xs">
                            {simResult.gpaPoint.toFixed(1)} GPA
                          </span>
                          {simResult.description && (
                            <span className="text-[11px] font-semibold text-gray-500 hidden md:inline">
                              ({simResult.description})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Grade Boundaries Table & Form */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[11px] font-extrabold text-gray-400 uppercase">
                    <div className="col-span-2">Grade Letter</div>
                    <div className="col-span-3">Min Cutoff Score (%)</div>
                    <div className="col-span-2">GPA Points</div>
                    <div className="col-span-3">Honor / Description</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {gradingScale.map((tier, idx) => {
                    const badge = getGradeBadgeColors(tier.color, tier.grade);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#F7FAFC] hover:bg-white rounded-2xl border border-gray-100 transition shadow-xs grid grid-cols-12 gap-2 items-center text-xs"
                      >
                        {/* Grade Letter */}
                        <div className="col-span-2 flex items-center gap-1.5">
                          <input
                            type="text"
                            required
                            value={tier.grade}
                            onChange={(e) => updateGradeBoundary(idx, "grade", e.target.value.toUpperCase())}
                            placeholder="e.g. A"
                            className={`w-14 p-1.5 text-center font-black text-xs rounded-xl border outline-none ${badge.border} ${badge.bg} ${badge.text}`}
                          />
                        </div>

                        {/* Minimum Cutoff Score */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-gray-400">&ge;</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              required
                              value={tier.minScore}
                              onChange={(e) => updateGradeBoundary(idx, "minScore", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                              className="w-20 border border-gray-200 rounded-xl p-1.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                            />
                            <span className="text-[11px] font-bold text-gray-400">%</span>
                          </div>
                        </div>

                        {/* GPA Point */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="4.0"
                            required
                            value={tier.gpaPoint}
                            onChange={(e) => updateGradeBoundary(idx, "gpaPoint", Math.max(0, Math.min(4.0, Number(e.target.value) || 0)))}
                            className="w-16 border border-gray-200 rounded-xl p-1.5 text-xs font-bold text-center outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                          />
                        </div>

                        {/* Honor / Description */}
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={tier.description || ""}
                            onChange={(e) => updateGradeBoundary(idx, "description", e.target.value)}
                            placeholder="e.g. Distinction / Honors"
                            className="w-full border border-gray-200 rounded-xl p-1.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                          />
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <select
                            value={tier.color || "emerald"}
                            onChange={(e) => updateGradeBoundary(idx, "color", e.target.value)}
                            className="text-[10px] font-semibold border border-gray-200 rounded-lg p-1 bg-white outline-none cursor-pointer"
                            title="Badge color"
                          >
                            <option value="emerald">Emerald</option>
                            <option value="blue">Blue</option>
                            <option value="amber">Amber</option>
                            <option value="purple">Purple</option>
                            <option value="rose">Rose</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => deleteGradeBoundary(idx)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete tier"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-blue-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <FiAlertCircle className="text-blue-600 text-sm shrink-0 mt-0.5" />
                  <p>
                    All enrolled students in this course will have their cumulative GPAs, report cards, and Gradebook letter marks automatically calculated based on this custom scale.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: WEEKLY SCHEDULE & TIMETABLE (RESCHEDULABLE) */}
            {activeTab === "schedule" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#2D3748]">Course Weekly Timetable & Schedule</h3>
                    <p className="text-xs text-[#A0AEC0] mt-0.5">
                      Configure recurring weekly physical classroom lectures and online sessions for students.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addScheduleSlot}
                      className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FiPlus /> Add Weekly Slot
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Timetable"}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                  <FiClock className="text-indigo-600 text-base shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Changes made here directly update the student weekly calendar and timetable. Any rescheduled times or room adjustments trigger instant alerts to all enrolled students.
                  </p>
                </div>

                {/* Slots List */}
                <div className="space-y-3">
                  {scheduleSlots.length === 0 ? (
                    <div className="text-center py-10 bg-[#F7FAFC] rounded-2xl border border-dashed border-gray-200">
                      <FiClock className="text-3xl text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-700">No weekly schedule slots configured yet.</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 mb-3">Add recurring slots to build the course timetable.</p>
                      <button
                        type="button"
                        onClick={addScheduleSlot}
                        className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition"
                      >
                        Add First Weekly Slot
                      </button>
                    </div>
                  ) : (
                    scheduleSlots.map((slot, sIdx) => {
                      const isPhysical = slot.type !== "online";
                      return (
                        <div
                          key={sIdx}
                          className="p-4 bg-[#F7FAFC] hover:bg-white rounded-2xl border border-gray-100 transition space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-[#5A67D8] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              <span className="font-extrabold text-xs text-[#1E293B]">
                                Slot #{sIdx + 1} &bull; {slot.dayOfWeek}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeScheduleSlot(sIdx)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete slot"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            {/* Day of Week */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">Day of Week</label>
                              <select
                                value={slot.dayOfWeek}
                                onChange={(e) => updateScheduleSlot(sIdx, "dayOfWeek", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                              >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                              </select>
                            </div>

                            {/* Start Time */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">Start Time</label>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateScheduleSlot(sIdx, "startTime", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                              />
                            </div>

                            {/* End Time */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">End Time</label>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateScheduleSlot(sIdx, "endTime", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                              />
                            </div>

                            {/* Delivery Mode */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">Delivery Mode</label>
                              <select
                                value={slot.type || "physical"}
                                onChange={(e) => updateScheduleSlot(sIdx, "type", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                              >
                                <option value="physical">Physical (In-Person)</option>
                                <option value="online">Online (Virtual)</option>
                              </select>
                            </div>
                          </div>

                          {/* Location / Venue / Virtual Link */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              {isPhysical ? "Campus Venue / Lecture Hall" : "Meeting Link / Virtual Room"}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                {isPhysical ? <FiMapPin className="text-xs" /> : <FiVideo className="text-xs" />}
                              </div>
                              <input
                                type="text"
                                value={slot.location || ""}
                                onChange={(e) => updateScheduleSlot(sIdx, "location", e.target.value)}
                                placeholder={isPhysical ? "e.g. Hall 15, Engineering Block Room 204" : "e.g. Google Meet / Zoom URL"}
                                className="w-full pl-8 border border-gray-200 rounded-xl p-2 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MATERIALS */}
            {activeTab === "materials" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-[#2D3748]">Course Learning Materials</h3>
                    <p className="text-[10px] text-[#A0AEC0]">Directly hosted on Cloudflare R2 storage</p>
                  </div>
                  <button
                    onClick={() => setShowMaterialModal(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition flex items-center gap-1 shadow-xs"
                  >
                    <FiUploadCloud /> Upload Material
                  </button>
                </div>

                {materials.length === 0 ? (
                  <div className="text-center py-10 bg-[#F7FAFC] rounded-2xl border border-dashed border-gray-200">
                    <FiUploadCloud className="text-3xl text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-700">No materials uploaded for this course yet.</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 mb-3">Upload lecture slides, notes, or assignment files.</p>
                    <button
                      onClick={() => setShowMaterialModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white font-semibold text-[11px] rounded-lg hover:bg-blue-700 transition"
                    >
                      Upload First Material
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map((m) => (
                      <div
                        key={m._id}
                        className="p-3 bg-[#F7FAFC] hover:bg-white rounded-xl border border-gray-100 transition flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <FiFileText className="text-sm" />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-[#2D3748] truncate">{m.title}</p>
                            <p className="text-[10px] text-[#A0AEC0]">
                              {m.fileName} &middot; {((m.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB &middot;{" "}
                              <span className="capitalize font-semibold text-gray-600">{m.materialType || "notes"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          <a
                            href={`/api/materials/${m._id}/file?action=view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View / Open file"
                          >
                            <FiExternalLink className="text-sm" />
                          </a>
                          <a
                            href={`/api/materials/${m._id}/file?action=download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Download file"
                          >
                            <FiDownload className="text-sm" />
                          </a>
                          <button
                            onClick={() => handleDeleteMaterial(m._id, m.title)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ASSIGNMENTS */}
            {activeTab === "assignments" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#2D3748]">Course Assignments</h3>
                  <button
                    onClick={() => setQuickModalType("assignment")}
                    className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1"
                  >
                    <FiPlus /> Create Assignment
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <p className="text-xs text-[#A0AEC0] text-center py-8">No assignments created for this course yet.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div key={a._id} className="p-3 bg-[#F7FAFC] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-[#2D3748]">{a.title}</p>
                          <span className="text-[10px] text-[#A0AEC0]">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#5A67D8] rounded font-bold text-[10px]">
                          {a.submissionsCount || 0} Submissions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LIVE CLASSES */}
            {activeTab === "classes" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#2D3748]">Scheduled Live Classes</h3>
                  <button
                    onClick={() => setQuickModalType("class")}
                    className="px-3 py-1.5 bg-[#5A67D8] text-white font-bold text-xs rounded-lg hover:bg-[#434190] transition flex items-center gap-1"
                  >
                    <FiPlus /> Schedule Class
                  </button>
                </div>

                {liveClasses.length === 0 ? (
                  <p className="text-xs text-[#A0AEC0] text-center py-8">No live classes scheduled for this course.</p>
                ) : (
                  <div className="space-y-2">
                    {liveClasses.map((c) => (
                      <div key={c._id} className="p-3 bg-[#F7FAFC] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-[#2D3748]">{c.title}</p>
                          <span className="text-[10px] text-[#A0AEC0]">
                            {new Date(c.startTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px] uppercase">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: STUDENTS */}
            {activeTab === "students" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#2D3748]">
                  Enrolled Students Roster ({students.length})
                </h3>
                {students.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-[#F7FAFC] rounded-xl">
                    No students currently enrolled in this course.
                  </div>
                ) : (
                  students.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-[#F7FAFC] rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#2D3748]">{s.name}</p>
                        <p className="text-[10px] text-[#A0AEC0]">{s.email}</p>
                      </div>
                      <span className="font-bold text-[#5A67D8]">
                        {s.progress ?? 0}% Progress
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-[#F7FAFC] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
            >
              Close
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-5 py-2 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Course Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Modal Trigger inside CourseManageModal */}
      {quickModalType && (
        <QuickActionModal
          type={quickModalType}
          onClose={() => setQuickModalType(null)}
          onSuccess={() => {
            toast.success("Action completed!");
          }}
        />
      )}

      {/* Material Upload Modal */}
      {showMaterialModal && (
        <MaterialUploadModal
          initialCourseId={course._id}
          initialCourseTitle={course.title}
          onClose={() => setShowMaterialModal(false)}
          onSuccess={() => {
            refreshMaterials();
          }}
        />
      )}
    </>
  );
}
