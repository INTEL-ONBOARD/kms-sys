"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FiClipboard, 
  FiPlus, 
  FiFilter, 
  FiLayers, 
  FiCheckCircle, 
  FiClock, 
  FiEdit3, 
  FiBookOpen, 
  FiPercent,
  FiSearch,
  FiFileText,
  FiLock,
  FiUnlock,
  FiCalendar,
  FiX,
  FiUploadCloud,
  FiAlertCircle,
  FiRefreshCw
} from "react-icons/fi";
import QuickActionModal from "@/components/lecturer/QuickActionModal";
import CourseManageModal from "@/components/lecturer/CourseManageModal";
import { useToast } from "@/contexts/ToastContext";

interface CourseItem {
  _id: string;
  title: string;
  category?: string;
  description?: string;
  published?: boolean;
  instructor?: string;
  assessmentItems?: Array<{
    name: string;
    type: string;
    weight: number;
  }>;
}

interface AssignmentItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  courseId?: { 
    _id: string; 
    title: string; 
    category?: string;
    assessmentItems?: Array<{ name: string; type: string; weight: number }>;
  };
  dueDate: string;
  maxPoints?: number;
  weight?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  fileKey?: string;
  submissionsCount?: number;
  gradedCount?: number;
  status: "open" | "closed" | "graded" | string;
}

export default function LecturerAssignmentsPage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<CourseItem | null>(null);

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [loading, setLoading] = useState(true);

  // Edit / Extend Deadline Modal State
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editDueTime, setEditDueTime] = useState<string>("23:59");
  const [editStatus, setEditStatus] = useState<"open" | "closed">("open");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editMaxPoints, setEditMaxPoints] = useState<string>("100");
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState("");

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const categories = ["All", "Homework", "Lab Report", "Project", "Quiz", "Essay", "Case Study"];

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lecturer/assignments?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        if (data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturerCourses = async () => {
    try {
      const res = await fetch("/api/lecturer/courses?limit=50");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchLecturerCourses();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case "Project":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Lab Report":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "Quiz":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Essay":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "Case Study":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  // Filter assignments based on category, status, course, and search
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      const matchesCat = selectedCategory === "All" || a.category === selectedCategory;
      const aCourseId = typeof a.courseId === "object" ? a.courseId?._id : a.courseId;
      const matchesCourse = selectedCourseId === "All" || aCourseId === selectedCourseId;
      
      const isPastDue = new Date(a.dueDate) < now;
      let matchesStatus = true;
      if (selectedStatusFilter === "Open") {
        matchesStatus = a.status === "open";
      } else if (selectedStatusFilter === "Closed") {
        matchesStatus = a.status === "closed";
      } else if (selectedStatusFilter === "Overdue") {
        matchesStatus = isPastDue;
      }

      const matchesSearch = !searchQuery.trim() || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.courseId?.title && a.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCat && matchesCourse && matchesStatus && matchesSearch;
    });
  }, [assignments, selectedCategory, selectedStatusFilter, selectedCourseId, searchQuery]);

  // Active course selected for the Breakdown panel
  const activeCourse = useMemo(() => {
    if (selectedCourseId !== "All") {
      return courses.find((c) => c._id === selectedCourseId) || null;
    }
    return courses.length > 0 ? courses[0] : null;
  }, [courses, selectedCourseId]);

  const activeCourseBreakdownItems = useMemo(() => {
    return (activeCourse?.assessmentItems || []).filter(
      (i) => i.type !== "exam" && i.type !== "attendance"
    );
  }, [activeCourse]);

  const activeCourseAssignments = useMemo(() => {
    if (!activeCourse) return [];
    return assignments.filter(
      (a) => (typeof a.courseId === "object" ? a.courseId?._id : a.courseId) === activeCourse._id
    );
  }, [assignments, activeCourse]);

  const isCourseLimitReached = 
    activeCourseBreakdownItems.length > 0 && 
    activeCourseAssignments.length >= activeCourseBreakdownItems.length;

  // Toggle submission status (open / closed)
  const handleToggleStatus = async (assignment: AssignmentItem) => {
    const targetStatus = assignment.status === "closed" ? "open" : "closed";
    setTogglingId(assignment._id);
    try {
      const res = await fetch(`/api/lecturer/assignments/${assignment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        toast.success(
          targetStatus === "closed"
            ? `Submissions disabled for "${assignment.title}". Assignment is now CLOSED.`
            : `Submissions enabled for "${assignment.title}". Assignment is now OPEN.`
        );
        // Optimistic local update
        setAssignments((prev) =>
          prev.map((a) => (a._id === assignment._id ? { ...a, status: targetStatus } : a))
        );
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update assignment status");
      }
    } catch (err) {
      console.error("Status toggle error:", err);
      toast.error("Network error updating status");
    } finally {
      setTogglingId(null);
    }
  };

  // Open Edit & Extend Deadline Modal
  const handleOpenEditModal = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    const d = new Date(assignment.dueDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    setEditDueDate(`${yyyy}-${mm}-${dd}`);
    setEditDueTime(`${hh}:${min}`);
    setEditStatus(assignment.status === "closed" ? "closed" : "open");
    setEditDescription(assignment.description || "");
    setEditMaxPoints(String(assignment.maxPoints || 100));
    setEditPdfFile(null);
    setEditUploadProgress("");
  };

  // Quick preset deadline extenders
  const handleExtendByDays = (days: number) => {
    const baseDate = editDueDate ? new Date(`${editDueDate}T${editDueTime || "23:59"}`) : new Date();
    const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");
    setEditDueDate(`${yyyy}-${mm}-${dd}`);
  };

  // Upload new PDF brief to R2 if selected
  const uploadPdfToR2 = async (file: File, courseId: string): Promise<{ fileKey: string; publicUrl: string }> => {
    const presignRes = await fetch("/api/materials/generate-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || "application/pdf",
        fileSize: file.size,
        courseId: courseId || "general",
      }),
    });

    if (!presignRes.ok) {
      const errorData = await presignRes.json();
      throw new Error(errorData.error || "Failed to generate upload URL");
    }

    const { uploadUrl, fileKey, publicUrl } = await presignRes.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Network error during file upload"));
      xhr.send(file);
    });

    return { fileKey, publicUrl };
  };

  // Save Edit & Deadline Extension
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    if (!editDueDate) {
      toast.warning("Please select a due date");
      return;
    }

    setSavingEdit(true);
    setEditUploadProgress("");

    try {
      const combinedDateTime = new Date(`${editDueDate}T${editDueTime || "23:59"}`);
      if (isNaN(combinedDateTime.getTime())) {
        toast.error("Invalid date or time format");
        setSavingEdit(false);
        return;
      }

      let attachmentUrl = editingAssignment.attachmentUrl;
      let attachmentName = editingAssignment.attachmentName;
      let attachmentSize = editingAssignment.attachmentSize;
      let fileKey = editingAssignment.fileKey;

      if (editPdfFile) {
        setEditUploadProgress(`Uploading ${editPdfFile.name}...`);
        const courseIdStr = typeof editingAssignment.courseId === "object"
          ? editingAssignment.courseId?._id
          : editingAssignment.courseId;
        const uploadRes = await uploadPdfToR2(editPdfFile, courseIdStr || "general");
        attachmentUrl = uploadRes.publicUrl;
        attachmentName = editPdfFile.name;
        attachmentSize = editPdfFile.size;
        fileKey = uploadRes.fileKey;
      }

      setEditUploadProgress("Updating assignment...");

      const payload: any = {
        dueDate: combinedDateTime.toISOString(),
        status: editStatus,
        description: editDescription.trim(),
        maxPoints: Number(editMaxPoints) || 100,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        fileKey,
      };

      const res = await fetch(`/api/lecturer/assignments/${editingAssignment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const isExtended = new Date(editingAssignment.dueDate).getTime() < combinedDateTime.getTime();
        toast.success(
          isExtended
            ? `Deadline extended to ${combinedDateTime.toLocaleDateString()} and students notified!`
            : "Assignment updated successfully!"
        );
        setEditingAssignment(null);
        fetchAssignments();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update assignment");
      }
    } catch (err: any) {
      console.error("Save edit error:", err);
      toast.error(err.message || "Failed to save assignment changes");
    } finally {
      setSavingEdit(false);
      setEditUploadProgress("");
    }
  };

  const openAssignmentsCount = assignments.filter((a) => a.status === "open").length;
  const closedAssignmentsCount = assignments.filter((a) => a.status === "closed").length;
  const overdueAssignmentsCount = assignments.filter((a) => new Date(a.dueDate) < new Date()).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100">
              Curriculum & Deliverables
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              Submission Control & Deadline Management
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E293B]">Assignment Manager</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create coursework, disable/enable student submissions, close assignments after deadline, and extend deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeCourse && (
            <button
              onClick={() => {
                setSelectedCourseForModal(activeCourse);
                setShowCourseModal(true);
              }}
              className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E293B] border border-gray-200 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <FiLayers className="text-blue-600 text-sm" />
              <span>Manage Grade Breakdown</span>
            </button>
          )}

          <button
            onClick={() => {
              if (courses.length === 0) {
                toast.warning("Action Blocked: You must be assigned to a course by an administrator before creating assignments.");
                return;
              }
              setShowModal(true);
            }}
            disabled={courses.length === 0}
            title={courses.length === 0 ? "Course assignment required from Admin" : "Create Assignment"}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 ${
              courses.length === 0
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : isCourseLimitReached 
                ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95" 
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
            }`}
          >
            <FiPlus className="text-base" /> 
            <span>
              {courses.length === 0
                ? "Create Assignment"
                : isCourseLimitReached 
                ? `Create Assignment (${activeCourseAssignments.length}/${activeCourseBreakdownItems.length})` 
                : "Create Assignment"}
            </span>
          </button>
        </div>
      </div>

      {/* Locked Notice if no assigned courses */}
      {!loading && courses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 font-bold">
            🔒
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Assignment Creation Locked</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              You are not assigned to any courses yet. Once an administrator assigns courses to your profile from the Admin Panel, you will be able to create assignments and manage grade breakdowns.
            </p>
          </div>
        </div>
      )}

      {/* Course Assessment & Grade Breakdown Sync Panel */}
      {activeCourse && (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                <FiLayers />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-extrabold text-[#1E293B]">
                    Course Assessment & Grade Breakdown
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {activeCourse.title}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    isCourseLimitReached
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {isCourseLimitReached 
                      ? `${activeCourseAssignments.length} / ${activeCourseBreakdownItems.length} Assignments (Max Limit Reached)`
                      : `${activeCourseAssignments.length} / ${activeCourseBreakdownItems.length} Assignments Configured`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Number of assignments is strictly limited to the Course Assessment & Grade Breakdown. {isCourseLimitReached ? "To add more assignments, edit the breakdown weights below." : "Click any available component to configure its brief."}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCourseForModal(activeCourse);
                setShowCourseModal(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <FiEdit3 className="text-xs" /> Edit Breakdown Weights
            </button>
          </div>

          {/* Breakdown Items List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {(!activeCourse.assessmentItems || activeCourse.assessmentItems.length === 0) ? (
              <div className="col-span-full py-4 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No custom assessment components configured yet for this course. Click &quot;Edit Breakdown Weights&quot; to configure.
              </div>
            ) : (
              activeCourse.assessmentItems.map((item, idx) => {
                const hasCreatedAssignment = assignments.some(
                  (a) => a.title.toLowerCase() === item.name.toLowerCase() && 
                    ((typeof a.courseId === "object" ? a.courseId?._id : a.courseId) === activeCourse._id)
                );

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      hasCreatedAssignment 
                        ? "bg-blue-50/40 border-blue-100" 
                        : "bg-gray-50/60 border-dashed border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="truncate pr-1">
                        <span className="text-[10px] font-black uppercase text-gray-400">
                          Item #{idx + 1} &bull; {item.type}
                        </span>
                        <p className="text-xs font-bold text-[#1E293B] truncate" title={item.name}>
                          {item.name}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 shrink-0">
                        {item.weight}%
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100/60 flex items-center justify-between text-[11px]">
                      {hasCreatedAssignment ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                          <FiCheckCircle className="text-xs" /> In Assignment Manager
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowModal(true)}
                          className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FiPlus className="text-xs" /> Configure Brief
                        </button>
                      )}
                      <span className="text-[10px] text-gray-400 font-semibold capitalize">
                        {item.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Submission Status Quick Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-2">
          {[
            { key: "All", label: `All Assignments (${assignments.length})` },
            { key: "Open", label: `Accepting Submissions (${openAssignmentsCount})`, color: "text-emerald-600" },
            { key: "Closed", label: `Submissions Disabled (${closedAssignmentsCount})`, color: "text-gray-600" },
            { key: "Overdue", label: `Deadline Passed (${overdueAssignmentsCount})`, color: "text-amber-600" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedStatusFilter === tab.key
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchAssignments()}
          title="Refresh assignments"
          className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition cursor-pointer"
        >
          <FiRefreshCw className={`text-xs ${loading ? "animate-spin text-blue-600" : ""}`} />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
            <FiFilter className="text-blue-600" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Filter & Search */}
        <div className="flex items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 text-xs font-medium text-gray-700 rounded-xl py-2 pl-9 pr-3 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Course Selector */}
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer pr-6 hover:bg-gray-100 transition max-w-[180px] truncate"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-2xl p-6 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs flex flex-col items-center">
          <FiClipboard className="text-5xl text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#1E293B]">No assignments found</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            {selectedCategory === "All" && selectedStatusFilter === "All"
              ? "Create your first assignment or add one to Course Assessment & Grade Breakdown"
              : `No assignments matching the selected filters.`}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition cursor-pointer"
          >
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((a) => {
            const isClosed = a.status === "closed";
            const isPastDue = new Date(a.dueDate) < new Date();
            const isToggling = togglingId === a._id;

            return (
              <div
                key={a._id}
                className={`bg-white rounded-2xl p-6 shadow-xs border transition flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isClosed ? "border-gray-200 bg-gray-50/40" : "border-gray-100"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${getCategoryBadgeClass(
                          a.category
                        )}`}
                      >
                        {a.category || "Homework"}
                      </span>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {a.weight || 20}% Weight
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1">
                      {isClosed ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1">
                          <FiLock className="text-[10px] text-gray-500" /> Closed
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border flex items-center gap-1 ${
                          isPastDue 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          <FiUnlock className="text-[10px]" />
                          {isPastDue ? "Open (Past Due)" : "Open"}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[#1E293B] text-base leading-snug">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <FiBookOpen className="text-xs text-blue-500" />
                    <span className="truncate">{a.courseId?.title || "General Course"}</span>
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className={`font-semibold flex items-center gap-1 ${isPastDue ? "text-amber-600" : "text-gray-500"}`}>
                      <FiClock className="text-xs" />
                      Due: {formatDate(a.dueDate)}
                    </span>
                    {isPastDue && !isClosed && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Deadline Finished
                      </span>
                    )}
                  </div>

                  {a.attachmentUrl && (
                    <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between">
                      <a
                        href={`/api/student/assignments/${a._id}/attachment?action=view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 transition truncate max-w-full"
                      >
                        <FiFileText className="text-xs shrink-0" />
                        <span className="truncate">{a.attachmentName || "View Assignment PDF Brief"}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Action Ribbon */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-semibold flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${isClosed ? "bg-gray-400" : "bg-blue-500"}`} />
                      {a.submissionsCount || 0} Submissions
                    </span>
                    <a href="/lecturer/grades" className="text-blue-600 font-bold hover:underline">
                      Review & Grade &rarr;
                    </a>
                  </div>

                  {/* Submission Control & Deadline Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Toggle Submissions Button */}
                    <button
                      onClick={() => handleToggleStatus(a)}
                      disabled={isToggling}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                        isClosed
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 border-gray-200"
                      }`}
                      title={isClosed ? "Enable Student Submissions" : "Disable Student Submissions / Close"}
                    >
                      {isClosed ? (
                        <>
                          <FiUnlock className="text-xs" />
                          <span>Reopen Submissions</span>
                        </>
                      ) : (
                        <>
                          <FiLock className="text-xs text-red-500" />
                          <span>Disable Submissions</span>
                        </>
                      )}
                    </button>

                    {/* Extend Deadline / Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(a)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FiCalendar className="text-xs" />
                      <span>Extend Deadline</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT & EXTEND DEADLINE MODAL */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-[#F8FAFC]">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                  {typeof editingAssignment.courseId === "object" ? editingAssignment.courseId?.title : "Course"}
                </span>
                <h2 className="text-lg font-extrabold text-[#1E293B] mt-1">
                  Manage Submissions & Extend Deadline
                </h2>
                <p className="text-xs text-gray-400">{editingAssignment.title}</p>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              
              {/* Submission Toggle Status Switch */}
              <div className="p-4 rounded-2xl border transition bg-gray-50 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      {editStatus === "open" ? (
                        <FiUnlock className="text-emerald-600" />
                      ) : (
                        <FiLock className="text-red-600" />
                      )}
                      <span>Assignment Submissions Status</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {editStatus === "open"
                        ? "Currently OPEN: Students can upload deliverables and submit responses."
                        : "Currently CLOSED: Student uploads and submissions are strictly blocked."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStatus(editStatus === "open" ? "closed" : "open")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                        editStatus === "open"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-red-600 text-white border-red-600"
                      }`}
                    >
                      {editStatus === "open" ? "Open (Accepting)" : "Closed (Disabled)"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Deadline & Extension Picker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-gray-700">
                    Submission Deadline & Time
                  </label>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    Current: {formatDate(editingAssignment.dueDate)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={editDueTime}
                      onChange={(e) => setEditDueTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Quick Extend Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Quick Extend Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "+1 Day", days: 1 },
                      { label: "+3 Days", days: 3 },
                      { label: "+1 Week", days: 7 },
                      { label: "+2 Weeks", days: 14 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleExtendByDays(preset.days)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Max Points */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Maximum Points / Score
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={editMaxPoints}
                  onChange={(e) => setEditMaxPoints(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Task Instructions & Brief Details
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Update instructions or guidelines for students..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>

              {/* Replace / Upload PDF Brief */}
              <div className="space-y-1.5">
                <label className="block font-bold text-gray-700">
                  Assignment PDF Brief / Rubric Attachment
                </label>
                {editingAssignment.attachmentUrl && !editPdfFile && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[11px]">
                    <span className="font-semibold text-blue-800 truncate">
                      Current: {editingAssignment.attachmentName || "Assignment_Brief.pdf"}
                    </span>
                    <a
                      href={`/api/student/assignments/${editingAssignment._id}/attachment?action=view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline shrink-0 ml-2"
                    >
                      View
                    </a>
                  </div>
                )}

                <label className="border border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50/30 transition text-center">
                  <FiUploadCloud className="text-xl text-blue-600 mb-0.5" />
                  <p className="font-bold text-gray-700 text-[11px]">
                    {editPdfFile ? editPdfFile.name : "Click to replace or upload new PDF brief"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditPdfFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {editUploadProgress && (
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{editUploadProgress}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="text-sm" />
                      <span>Save & Apply Updates</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Quick Action Modal (Create Assignment) */}
      {showModal && (
        <QuickActionModal
          type="assignment"
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchAssignments();
            fetchLecturerCourses();
          }}
        />
      )}

      {/* Course Assessment & Grade Breakdown Modal */}
      {showCourseModal && selectedCourseForModal && (
        <CourseManageModal
          course={selectedCourseForModal as any}
          initialTab="breakdown"
          onClose={() => {
            setShowCourseModal(false);
            setSelectedCourseForModal(null);
          }}
          onUpdate={() => {
            fetchAssignments();
            fetchLecturerCourses();
          }}
        />
      )}
    </div>
  );
}

