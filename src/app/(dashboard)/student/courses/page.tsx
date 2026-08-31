"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiSearch,
  FiCalendar,
  FiUser,
  FiBookOpen,
  FiUsers,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiLayers,
  FiAward,
  FiChevronDown,
  FiX,
  FiList,
  FiCheck,
} from "react-icons/fi";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/DashHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface CourseModule {
  _id?: string;
  moduleNumber: string;
  title: string;
  description?: string;
  lessonsCount?: number;
  duration?: string;
  status?: string;
  topics?: string[];
}

interface Course {
  _id: string;
  title: string;
  code?: string;
  description?: string;
  instructor: string;
  category: string;
  price?: string;
  credits?: number;
  capacity?: number;
  enrollments?: number;
  nextBatchStartDate?: string | Date | null;
  status?: string;
  colorCode?: string;
  modules?: CourseModule[];
}

export default function StudentCourseCatalogPage() {
  const router = useRouter();
  const toast = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set());
  const [rejectedCourseMap, setRejectedCourseMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("nextBatch");
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  // Modal State for Pre-Enrollment Syllabus & Batch Details
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);

  // Modal State for Manual Bank Slip Payment
  const [paymentModalCourse, setPaymentModalCourse] = useState<Course | null>(null);
  const [selectedSlipFile, setSelectedSlipFile] = useState<File | null>(null);
  const [slipFilePreview, setSlipFilePreview] = useState<string | null>(null);
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false);

  const fetchCatalogData = async () => {
    try {
      // 1. Fetch available published courses
      const coursesRes = await fetch("/api/courses?published=true");
      let courseList: Course[] = [];
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        courseList = Array.isArray(data) ? data : data.courses || data.data || [];
        setCourses(courseList);
      }

      // 2. Fetch student's current enrollments to identify already joined courses
      try {
        const studentRes = await fetch("/api/student/dashboard");
        if (studentRes.ok) {
          const studentData = await studentRes.json();
          const enrolledList = Array.isArray(studentData.enrollments) ? studentData.enrollments : [];
          const ids = new Set<string>();
          enrolledList.forEach((e: any) => {
            const cId = e.courseId?._id || e.courseId;
            if (cId) ids.add(cId.toString());
          });
          setEnrolledCourseIds(ids);
        }
      } catch (err) {
        console.warn("Could not check student enrollment status:", err);
      }

      // 3. Fetch student's enrollment requests to track pending slips
      try {
        const reqRes = await fetch("/api/student/enroll-requests");
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          const requestsList = Array.isArray(reqData) ? reqData : reqData.data || [];
          const pendingIds = new Set<string>();
          const rejectedMap = new Map<string, string>();

          requestsList.forEach((r: any) => {
            const cId = (r.courseId?._id || r.courseId)?.toString();
            if (cId) {
              if (r.status === "pending") {
                pendingIds.add(cId);
              } else if (r.status === "rejected") {
                rejectedMap.set(cId, r.rejectionReason || "Verification failed");
              }
            }
          });

          setPendingCourseIds(pendingIds);
          setRejectedCourseMap(rejectedMap);
        }
      } catch (err) {
        console.warn("Could not check enrollment requests:", err);
      }
    } catch (error) {
      console.error("Error fetching courses catalog:", error);
      toast.error("Failed to load available courses.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCatalogData();
  };

  // Open Payment & Bank Slip Upload Modal
  const openPaymentModal = (course: Course) => {
    setSelectedCourseForDetails(null); // Close details modal if open
    setPaymentModalCourse(course);
    setSelectedSlipFile(null);
    setSlipFilePreview(null);
  };

  // Handle Slip File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file format. Please upload a .jpeg or .png image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setSelectedSlipFile(file);

    const previewUrl = URL.createObjectURL(file);
    setSlipFilePreview(previewUrl);
  };

  // Submit Bank Slip via FormData to /api/student/enroll-requests
  const handleSlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCourse) return;

    if (!selectedSlipFile) {
      toast.warning("Please select your bank transfer payment slip before submitting.");
      return;
    }

    try {
      setIsSubmittingSlip(true);

      const formData = new FormData();
      formData.append("courseId", paymentModalCourse._id);
      formData.append("slip", selectedSlipFile);

      const res = await fetch("/api/student/enroll-requests", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Failed to submit payment slip.");
      }

      toast.success(
        `Payment slip for "${paymentModalCourse.title}" submitted successfully! An admin will verify and activate your enrollment shortly.`
      );

      // Add to pending state
      setPendingCourseIds((prev) => new Set(prev).add(paymentModalCourse._id));
      setPaymentModalCourse(null);
      setSelectedSlipFile(null);
      setSlipFilePreview(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit transfer slip. Please try again.");
    } finally {
      setIsSubmittingSlip(false);
    }
  };

  // Helper to get formatted modules for course
  const getCourseModules = (course: Course): CourseModule[] => {
    if (course.modules && course.modules.length > 0) {
      return course.modules;
    }
    // Clean default fallback structure if no custom modules entered
    return [
      {
        moduleNumber: "01",
        title: `Foundations & Core Principles of ${course.title}`,
        description: "Introduction to fundamental concepts, theoretical framework, architecture, and industry standards.",
        lessonsCount: 6,
        duration: "12 Hours",
        status: "Upcoming",
        topics: ["Theoretical Principles & Frameworks", "Core Architectural Fundamentals", "Standard Tooling & Workflows", "Lab Orientation"],
      },
      {
        moduleNumber: "02",
        title: "Hands-on Practical Implementation & Tooling",
        description: "Deep dive into guided laboratory exercises, best practices, and real-world implementation techniques.",
        lessonsCount: 8,
        duration: "18 Hours",
        status: "Upcoming",
        topics: ["Applied Techniques", "Guided Demonstrations", "Interactive Exercises", "Intermediate Problem Solving"],
      },
      {
        moduleNumber: "03",
        title: "Advanced Case Studies & Industry Applications",
        description: "Scalability, architectural patterns, compliance, and comprehensive team-based case studies.",
        lessonsCount: 8,
        duration: "20 Hours",
        status: "Upcoming",
        topics: ["Architecture & Scaling", "Industry Case Studies", "Design Patterns", "Peer Feedback & Code Reviews"],
      },
      {
        moduleNumber: "04",
        title: "Capstone Project & Final Assessment",
        description: "Comprehensive project synthesis, portfolio review, assessment submission, and final examination.",
        lessonsCount: 4,
        duration: "14 Hours",
        status: "Upcoming",
        topics: ["Project Deliverables", "Portfolio Review", "Comprehensive Assessment", "Certification Preparation"],
      },
    ];
  };

  // Format batch start date display
  const formatBatchDate = (dateValue?: string | Date | null) => {
    if (!dateValue) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(15);
      return `Next Intake: ${nextMonth.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    const d = new Date(dateValue);
    if (isNaN(d.getTime())) {
      return "Next Intake: Open for Registration";
    }

    return `Next Intake: ${d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  // Category list extraction
  const categories = ["All", ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))];

  // Filtering & Sorting
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      searchQuery === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructor && c.instructor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "capacity") {
      const capA = a.capacity || 50;
      const capB = b.capacity || 50;
      return capB - capA;
    }
    // Default: nextBatch date
    const dateA = a.nextBatchStartDate ? new Date(a.nextBatchStartDate).getTime() : 0;
    const dateB = b.nextBatchStartDate ? new Date(b.nextBatchStartDate).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-16 pt-6">
          {/* Header Banner */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D3748] tracking-tight">
                  Course Catalog & Intake Registration
                </h1>
                <Badge variant="indigo" size="md">
                  Batch Intake
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Explore available courses, view upcoming batch schedules, and enroll instantly to start learning.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-[#5A67D8] hover:text-[#5A67D8] rounded-xl shadow-xs transition"
              >
                <FiRefreshCw className={`text-xs ${isRefreshing ? "animate-spin text-[#5A67D8]" : ""}`} />
                Refresh
              </button>
              <Link
                href="/student"
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#5A67D8] hover:bg-[#434190] rounded-xl shadow-xs transition"
              >
                My Dashboard <FiArrowRight className="text-xs" />
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-[380px]">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search courses, instructors, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F7FAFC] border border-gray-100 text-xs font-medium text-gray-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8] transition"
              />
            </div>

            {/* Category & Sort Dropdowns */}
            <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap sm:flex-nowrap">
              {/* Category Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter courses by category"
                  className="w-full sm:w-auto appearance-none bg-[#F7FAFC] border border-gray-100 text-xs font-bold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer hover:bg-gray-100 transition min-w-[140px]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "All" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort courses"
                  className="w-full sm:w-auto appearance-none bg-[#F7FAFC] border border-gray-100 text-xs font-bold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer hover:bg-gray-100 transition min-w-[150px]"
                >
                  <option value="nextBatch">Sort: Upcoming Intake</option>
                  <option value="title">Sort: Title (A - Z)</option>
                  <option value="capacity">Sort: Capacity</option>
                </select>
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 animate-pulse h-80 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-100 rounded-xl w-full" />
                    <div className="h-9 bg-gray-200 rounded-xl w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sortedCourses.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xs max-w-xl mx-auto p-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center mx-auto mb-4 text-2xl">
                <FiBookOpen />
              </div>
              <h3 className="text-lg font-bold text-[#2D3748]">No Available Courses Found</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                {searchQuery || selectedCategory !== "All"
                  ? "No courses match your current search or category filters. Try clearing your filters."
                  : "There are currently no courses published for open batch intake."}
              </p>
              {(searchQuery || selectedCategory !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-5 px-4 py-2 bg-[#5A67D8] text-white text-xs font-bold rounded-xl hover:bg-[#434190] transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Course Cards Grid */}
          {!isLoading && sortedCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course._id);
                const capacity = course.capacity || 50;
                const enrollmentsCount = course.enrollments || 0;
                const seatsAvailable = Math.max(0, capacity - enrollmentsCount);
                const isFull = seatsAvailable === 0;
                const isProcessing = enrollingCourseId === course._id;
                const intakeLabel = formatBatchDate(course.nextBatchStartDate);

                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
                  >
                    {/* Top Accent Color Bar */}
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: course.colorCode || "#5A67D8" }}
                    />

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {/* Course Header & Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <Badge variant="indigo" size="sm">
                            {course.category || "General"}
                          </Badge>

                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {course.code || `WISE-${course._id.substring(0, 4).toUpperCase()}`}
                          </span>
                        </div>

                        <h3
                          className="text-base font-bold text-[#2D3748] group-hover:text-[#5A67D8] transition line-clamp-2 leading-snug"
                          title={course.title}
                        >
                          {course.title}
                        </h3>

                        {course.instructor && (
                          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 truncate">
                            <FiUser className="text-gray-400 text-xs shrink-0" />
                            <span>Instructor: {course.instructor}</span>
                          </p>
                        )}

                        {course.description && (
                          <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                      </div>

                      {/* Batch Intake Schedule & Capacity Highlight */}
                      <div className="mt-6 space-y-3 pt-4 border-t border-gray-50">
                        {/* Prominent Next Batch Intake Date */}
                        <div className="bg-[#EEF2FF] border border-indigo-100/80 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-[#5A67D8] text-white flex items-center justify-center shrink-0 shadow-xs">
                              <FiCalendar className="text-sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-extrabold uppercase text-[#5A67D8] tracking-wider">
                                Upcoming Batch
                              </p>
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {intakeLabel}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-[#5A67D8] border border-indigo-100 shadow-2xs whitespace-nowrap">
                            Instant Access
                          </span>
                        </div>

                        {/* Capacity and Credits Metrics */}
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
                          <div className="flex items-center gap-1.5">
                            <FiUsers className="text-gray-400" />
                            <span>
                              {isFull ? (
                                <strong className="text-red-600">Batch Full</strong>
                              ) : (
                                <span>
                                  <strong>{seatsAvailable}</strong> / {capacity} seats open
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <FiAward className="text-indigo-500" />
                            <span>{course.credits || 3} Credits</span>
                          </div>
                        </div>

                        {/* Action Buttons: View Syllabus & Enroll */}
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCourseForDetails(course)}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-[#5A67D8] border border-gray-200 hover:border-indigo-200 transition"
                          >
                            <FiBookOpen className="text-xs" /> View Course & Syllabus Details
                          </button>

                          {isEnrolled ? (
                            <Link
                              href="/student"
                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
                            >
                              <FiCheckCircle className="text-sm" /> Already Enrolled &bull; Go to Course
                            </Link>
                          ) : pendingCourseIds.has(course._id) ? (
                            <div className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 shadow-2xs">
                              <FiClock className="text-sm animate-pulse text-amber-600" /> Payment Slip Under Admin Review
                            </div>
                          ) : isFull ? (
                            <Button
                              variant="secondary"
                              size="md"
                              fullWidth
                              disabled
                              className="text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                            >
                              <FiAlertCircle className="mr-1.5" /> Batch Full &bull; Registration Closed
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="md"
                              fullWidth
                              onClick={() => openPaymentModal(course)}
                              className="text-xs font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition flex items-center justify-center gap-1.5"
                            >
                              Buy Course & Enroll <FiArrowRight />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Pre-Enrollment Course & Module Syllabus Modal ── */}
      {selectedCourseForDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/30">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="indigo" size="sm">
                    {selectedCourseForDetails.category || "General"}
                  </Badge>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {selectedCourseForDetails.code || `WISE-${selectedCourseForDetails._id.substring(0, 4).toUpperCase()}`}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Open Batch Intake
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#2D3748] tracking-tight">
                  {selectedCourseForDetails.title}
                </h2>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <FiUser className="text-indigo-500" />
                  <span>Lead Instructor: <strong>{selectedCourseForDetails.instructor || "Platform Faculty"}</strong></span>
                  <span>&bull;</span>
                  <span><strong>{selectedCourseForDetails.credits || 3}</strong> Academic Credits</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCourseForDetails(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Batch Starting Date & Seat Capacity Card */}
              <div className="p-4 bg-gradient-to-r from-[#5A67D8]/10 to-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#5A67D8] uppercase tracking-wider flex items-center gap-1.5">
                    <FiCalendar className="text-sm" /> Upcoming Batch Intake Details
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-100 shadow-2xs">
                    Manual Bank Transfer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-2xs">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Batch Start Date</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">
                      {selectedCourseForDetails.nextBatchStartDate
                        ? new Date(selectedCourseForDetails.nextBatchStartDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Open Enrollment (Immediate Start)"}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-indigo-50 shadow-2xs">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Cohort Capacity</p>
                    <p className="text-sm font-black text-gray-900 mt-0.5">
                      {selectedCourseForDetails.enrollments || 0} / {selectedCourseForDetails.capacity || 50} Students Enrolled
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Overview */}
              <div>
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiBookOpen className="text-indigo-500" /> Course Overview & Description
                </h4>
                <p className="text-xs text-gray-600 bg-[#F7FAFC] p-4 rounded-2xl border border-gray-100 leading-relaxed">
                  {selectedCourseForDetails.description ||
                    "This course provides an in-depth curriculum designed by industry experts. Students will engage with weekly lectures, practical labs, coursework submissions, and interactive examinations."}
                </p>
              </div>

              {/* Dynamic Curriculum Modules & Lessons Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiList className="text-indigo-500" /> Curriculum & Module Breakdown ({getCourseModules(selectedCourseForDetails).length} Modules)
                  </h4>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    Full Syllabus
                  </span>
                </div>

                <div className="space-y-3">
                  {getCourseModules(selectedCourseForDetails).map((mod, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:border-indigo-200 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2 py-0.5 bg-indigo-50 text-[#5A67D8] rounded-lg border border-indigo-100">
                            {mod.moduleNumber || `0${idx + 1}`}
                          </span>
                          <h5 className="text-xs font-bold text-gray-800">
                            {mod.title}
                          </h5>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
                          <span>{mod.duration || "10 Hours"}</span>
                          <span>&bull;</span>
                          <span>{mod.lessonsCount || 4} Lessons</span>
                        </div>
                      </div>

                      {mod.description && (
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          {mod.description}
                        </p>
                      )}

                      {mod.topics && (Array.isArray(mod.topics) ? mod.topics.length > 0 : typeof mod.topics === "string") && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100">
                          <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                            Key Concepts & Topics Covered:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(mod.topics)
                              ? mod.topics
                              : typeof mod.topics === "string"
                              ? (mod.topics as string).split(",")
                              : []
                            ).map((topic, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1 bg-[#F7FAFC] border border-gray-200 text-gray-700 text-[10px] font-medium px-2.5 py-1 rounded-lg"
                              >
                                <FiCheck className="text-indigo-500 text-[9px]" />
                                {String(topic).trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with Enrollment Action */}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500 hidden sm:block">
                <span>Tuition: <strong>{selectedCourseForDetails.price || "Free"}</strong></span>
                <span className="mx-2">&bull;</span>
                <span>Manual bank transfer verification</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForDetails(null)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200/80 rounded-xl transition"
                >
                  Close
                </button>

                {enrolledCourseIds.has(selectedCourseForDetails._id) ? (
                  <Link
                    href="/student"
                    className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
                  >
                    <FiCheckCircle className="text-sm" /> Enrolled &bull; Go to Dashboard
                  </Link>
                ) : pendingCourseIds.has(selectedCourseForDetails._id) ? (
                  <div className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 shadow-2xs">
                    <FiClock className="text-sm text-amber-600 animate-pulse" /> Slip Under Review
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => openPaymentModal(selectedCourseForDetails)}
                    className="w-1/2 sm:w-auto text-xs font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    Proceed to Payment <FiArrowRight />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Bank Transfer Payment & Slip Upload Modal ── */}
      {paymentModalCourse && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-[#5A67D8]/10 via-white to-indigo-50/50">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A67D8] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Step 2 of 2 &bull; Bank Transfer Payment
                </span>
                <h3 className="text-xl font-extrabold text-[#2D3748]">
                  Enroll in {paymentModalCourse.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Tuition Fee: <strong className="text-gray-900">{paymentModalCourse.price || "Free"}</strong> &bull; Upcoming Batch: <strong>{formatBatchDate(paymentModalCourse.nextBatchStartDate).replace("Next Intake: ", "")}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPaymentModalCourse(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="slip-upload-form" onSubmit={handleSlipSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Bank Account Details Box */}
              <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FiAward className="text-[#5A67D8]" /> Official University Bank Account
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">Bank Name:</span>
                    <span className="font-bold text-gray-800">Wise East Central Bank (WECB)</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">Account Name:</span>
                    <span className="font-bold text-gray-800">Wise East University Tuition</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">Account Number:</span>
                    <span className="font-mono font-bold text-indigo-700">8820-1094-7721-003</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 font-semibold block">Branch / SWIFT:</span>
                    <span className="font-bold text-gray-800">City Campus &bull; WEASLKLX</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Transfer Reference:</span>
                  <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                    WEU-{paymentModalCourse._id.substring(0, 6).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Upload Bank Deposit / Transfer Slip <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-400">
                  Please attach a clear photo or screenshot of your completed bank transfer or deposit receipt (.jpeg or .png only).
                </p>

                <div className="relative border-2 border-dashed border-indigo-200 hover:border-[#5A67D8] bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-5 text-center transition cursor-pointer group">
                  <input
                    type="file"
                    required
                    accept="image/jpeg,image/png,.jpeg,.jpg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {selectedSlipFile ? (
                    <div className="space-y-2 flex flex-col items-center">
                      {slipFilePreview ? (
                        <img
                          src={slipFilePreview}
                          alt="Slip preview"
                          className="h-28 max-w-full object-contain rounded-xl border border-indigo-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-[#5A67D8] flex items-center justify-center text-xl">
                          <FiBookOpen />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-800 truncate max-w-xs">{selectedSlipFile.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {(selectedSlipFile.size / 1024 / 1024).toFixed(2)} MB &bull; Click to choose another file
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-[#5A67D8] flex items-center justify-center text-2xl transition">
                        <FiCalendar />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Click or drag and drop transfer slip here
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Supported formats: .jpeg, .png only (Max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSubmittingSlip}
                onClick={() => setPaymentModalCourse(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200/80 rounded-xl transition"
              >
                Cancel
              </button>

              <Button
                variant="primary"
                size="md"
                type="submit"
                form="slip-upload-form"
                isLoading={isSubmittingSlip}
                disabled={!selectedSlipFile || isSubmittingSlip}
                className="text-xs font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition flex items-center gap-1.5"
              >
                Submit Slip for Admin Approval <FiArrowRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}