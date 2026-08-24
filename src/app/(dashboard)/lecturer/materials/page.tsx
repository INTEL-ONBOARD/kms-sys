"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiUploadCloud,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiExternalLink,
  FiBook,
  FiFilm,
  FiPackage,
  FiRefreshCw,
  FiPlus,
  FiLayers,
  FiCheckCircle,
} from "react-icons/fi";
import MaterialUploadModal from "@/components/lecturer/MaterialUploadModal";
import { useToast } from "@/contexts/ToastContext";

interface CourseOption {
  _id: string;
  title: string;
  category?: string;
}

interface MaterialItem {
  _id: string;
  title: string;
  description?: string;
  courseId?: { _id: string; title: string; category?: string };
  lecturerId?: { _id: string; name: string; email: string };
  materialType: "notes" | "slides" | "tutorial" | "assignment" | "video" | "other";
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function LecturerMaterialsPage() {
  const toast = useToast();

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = [
    { key: "All", label: "All Materials" },
    { key: "notes", label: "Lecture Notes" },
    { key: "slides", label: "Slides / PPT" },
    { key: "tutorial", label: "Tutorials" },
    { key: "assignment", label: "Assignments" },
    { key: "video", label: "Recordings" },
    { key: "other", label: "Other Resources" },
  ];

  // Load courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/lecturer/courses?limit=50");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    }
    loadCourses();
  }, []);

  // Fetch materials
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedCourseId
        ? `/api/materials?courseId=${selectedCourseId}`
        : `/api/materials`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch materials:", err);
      toast.error("Failed to load course materials");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Delete material
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also remove the file from storage.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/materials?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`"${title}" deleted successfully.`);
        setMaterials((prev) => prev.filter((m) => m._id !== id));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete material");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An error occurred while deleting the material.");
    } finally {
      setDeletingId(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Category badges with consistent styling
  const getCategoryBadge = (type: string) => {
    switch (type) {
      case "slides":
        return { label: "Slides / PPT", class: "bg-amber-100 text-amber-700" };
      case "video":
        return { label: "Video Recording", class: "bg-purple-100 text-purple-700" };
      case "tutorial":
        return { label: "Tutorial", class: "bg-teal-100 text-teal-700" };
      case "assignment":
        return { label: "Assignment File", class: "bg-pink-100 text-pink-700" };
      case "other":
        return { label: "Supplementary", class: "bg-gray-100 text-gray-700" };
      default:
        return { label: "Lecture Notes", class: "bg-[#EEF2FF] text-[#5A67D8]" };
    }
  };

  // Card banner gradients (matching CourseCardLecturer)
  const getBannerGradient = (title: string) => {
    const banners = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-teal-500 to-emerald-600",
      "from-amber-500 to-orange-600",
    ];
    const charSum = title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return banners[charSum % banners.length];
  };

  // Computed stats
  const totalCount = materials.length;
  const notesCount = materials.filter((m) => m.materialType === "notes").length;
  const slidesCount = materials.filter((m) => m.materialType === "slides").length;
  const mediaCount = materials.filter((m) => m.materialType === "video" || m.materialType === "tutorial").length;

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.courseId?.title && m.courseId.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || m.materialType === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2D3748]">Course Materials</h1>
          <p className="text-xs text-[#A0AEC0] mt-1">
            Upload, organize, and distribute lecture notes, slides, and tutorials directly to students
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => fetchMaterials()}
            title="Refresh materials"
            className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              if (courses.length === 0) {
                toast.warning("Upload Blocked: You must be assigned to a course by an administrator before uploading materials.");
                return;
              }
              setShowUploadModal(true);
            }}
            disabled={courses.length === 0}
            title={courses.length === 0 ? "Course assignment required from Admin" : "Upload Material"}
            className={`flex-1 sm:flex-none px-4 py-2.5 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
              courses.length > 0
                ? "bg-[#5A67D8] text-white shadow-indigo-100 hover:bg-[#434190] cursor-pointer"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
          >
            <FiPlus className="text-base" /> Upload Material
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
            <h3 className="text-sm font-bold text-gray-800">Materials Upload Locked</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              You are not assigned to any courses yet. Once an administrator assigns courses to your profile from the Admin Panel, you will be able to upload, organize, and distribute materials to enrolled students.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl shrink-0">
            <FiLayers />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#A0AEC0]">Total Files</p>
            <h3 className="text-xl font-extrabold text-[#2D3748] mt-0.5">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <FiFileText />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#A0AEC0]">Lecture Notes</p>
            <h3 className="text-xl font-extrabold text-[#2D3748] mt-0.5">{notesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <FiPackage />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#A0AEC0]">Slides & PPT</p>
            <h3 className="text-xl font-extrabold text-[#2D3748] mt-0.5">{slidesCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <FiFilm />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#A0AEC0]">Media & Tutorials</p>
            <h3 className="text-xl font-extrabold text-[#2D3748] mt-0.5">{mediaCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter Category Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/50 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mr-2">
          <FiFilter className="text-[#5A67D8]" /> Filter Type:
        </span>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat.key
                ? "bg-[#5A67D8] text-white shadow-sm"
                : "bg-[#F7FAFC] text-gray-500 hover:bg-gray-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Course Filter Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search material title, file name, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#F7FAFC] text-xs text-gray-700 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#5A67D8] transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiBook className="text-gray-400 text-sm hidden sm:inline" />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-64 px-3 py-2.5 bg-[#F7FAFC] text-xs font-medium text-gray-700 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#5A67D8] transition"
          >
            <option value="">All Teaching Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Material Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 h-48 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-[#5A67D8] flex items-center justify-center mb-3">
            <FiUploadCloud className="text-3xl" />
          </div>
          <h3 className="text-base font-bold text-[#2D3748]">No Course Materials Found</h3>
          <p className="text-xs text-[#A0AEC0] max-w-sm mt-1 mb-5">
            {searchQuery || selectedCourseId || selectedCategory !== "All"
              ? "No materials matched your filter criteria. Try clearing search or selecting All."
              : "Start uploading lecture notes, presentations, and tutorials for your students."}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition"
          >
            <FiPlus className="text-sm" />
            <span>Upload New Material</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((item) => {
            const badge = getCategoryBadge(item.materialType);
            const courseTitle = item.courseId?.title || "General Teaching";
            const courseCode = item.courseId?._id
              ? `WISE-${item.courseId._id.substring(0, 4).toUpperCase()}`
              : "WISE-GEN";
            const bannerGradient = getBannerGradient(item.title);

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  {/* Top Decorative Banner */}
                  <div className={`h-2 rounded-full bg-gradient-to-r ${bannerGradient} mb-4`} />

                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${badge.class}`}>
                      {badge.label}
                    </span>
                    <span className="text-[11px] font-semibold text-[#A0AEC0] truncate max-w-[150px]" title={courseTitle}>
                      {courseCode} &middot; {courseTitle}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-bold text-[#2D3748] text-base line-clamp-1 group-hover:text-[#5A67D8] transition-colors mb-1">
                    {item.title}
                  </h4>

                  {item.description ? (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mb-4">
                      No additional notes provided.
                    </p>
                  )}

                  {/* File Meta Box */}
                  <div className="p-3 bg-[#F7FAFC] rounded-xl border border-gray-100 flex items-center justify-between text-xs text-[#2D3748] mb-4">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FiFileText className="text-[#5A67D8] shrink-0 text-sm" />
                      <span className="font-semibold truncate text-[11px]" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#A0AEC0] shrink-0">
                      {formatFileSize(item.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs">
                  <span className="text-[10px] font-medium text-[#A0AEC0]">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View / Open */}
                    <a
                      href={`/api/materials/${item._id}/file?action=view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-[#5A67D8] hover:bg-[#EEF2FF] rounded-lg transition"
                      title="Open file in browser"
                    >
                      <FiExternalLink className="text-sm" />
                    </a>

                    {/* Download */}
                    <a
                      href={`/api/materials/${item._id}/file?action=download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Download file"
                    >
                      <FiDownload className="text-sm" />
                    </a>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item._id, item.title)}
                      disabled={deletingId === item._id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                      title="Delete material"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Material Upload Modal */}
      {showUploadModal && (
        <MaterialUploadModal
          initialCourseId={selectedCourseId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => fetchMaterials()}
        />
      )}
    </div>
  );
}
