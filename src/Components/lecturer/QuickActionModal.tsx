"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FiX, 
  FiFilePlus, 
  FiCalendar, 
  FiUploadCloud, 
  FiFileText, 
  FiTrash2, 
  FiLoader,
  FiCheckCircle 
} from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";
import MaterialUploadModal from "./MaterialUploadModal";

interface QuickActionModalProps {
  type: "assignment" | "class" | "material";
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickActionModal({ type, onClose, onSuccess }: QuickActionModalProps) {
  if (type === "material") {
    return <MaterialUploadModal onClose={onClose} onSuccess={onSuccess} />;
  }

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [courses, setCourses] = useState<Array<{ 
    _id: string; 
    title: string; 
    assessmentItems?: Array<{ name: string; type: string; weight: number }> 
  }>>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");
  const [weight, setWeight] = useState("20");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Homework");

  // Assignment PDF Brief state
  const [assignmentPdfFile, setAssignmentPdfFile] = useState<File | null>(null);
  const [existingAssignments, setExistingAssignments] = useState<any[]>([]);

  // Live Class Material Upload State
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState<"notes" | "slides" | "tutorial" | "other">("slides");
  const [materialTitle, setMaterialTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchCoursesAndAssignments = async () => {
      try {
        const [coursesRes, assignRes] = await Promise.all([
          fetch("/api/lecturer/courses?limit=50"),
          fetch("/api/lecturer/assignments?limit=100")
        ]);

        let loadedAssignments: any[] = [];
        if (assignRes.ok) {
          const assignData = await assignRes.json();
          loadedAssignments = assignData.assignments || [];
          setExistingAssignments(loadedAssignments);
        }

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const loadedCourses = data.data || [];
          setCourses(loadedCourses);

          if (loadedCourses.length > 0) {
            const firstC = loadedCourses[0];
            setCourseId(firstC._id);

            const firstItems = (firstC.assessmentItems || []).filter(
              (i: any) => i.type !== "exam" && i.type !== "attendance"
            );

            // Find first available breakdown item that hasn't been created yet
            const firstCourseAssigns = loadedAssignments.filter(
              (a: any) => (typeof a.courseId === "object" ? a.courseId?._id : a.courseId) === firstC._id
            );
            const createdTitles = new Set(firstCourseAssigns.map((a: any) => a.title?.trim().toLowerCase()));
            const availableItems = firstItems.filter(
              (i: any) => !createdTitles.has(i.name?.trim().toLowerCase())
            );

            const initialItem = availableItems.length > 0 ? availableItems[0] : (firstItems.length > 0 ? firstItems[0] : null);

            if (initialItem) {
              setTitle(initialItem.name);
              setWeight(String(initialItem.weight));
              if (initialItem.type === "quiz") setCategory("Quiz");
              else if (initialItem.type === "project") setCategory("Project");
              else if (initialItem.type === "coursework") setCategory("Lab Report");
              else setCategory("Homework");
            } else {
              setTitle("");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load courses for modal:", err);
      }
    };
    fetchCoursesAndAssignments();
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.size > 250 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size of 250MB");
      return;
    }
    setMaterialFile(file);
    if (!materialTitle.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setMaterialTitle(nameWithoutExt);
    }
  };

  const uploadFileToR2 = async (file: File, targetCourseId: string): Promise<{ fileKey: string; publicUrl: string } | null> => {
    try {
      setUploadProgressText(`Requesting upload URL for ${file.name}...`);
      const presignRes = await fetch("/api/materials/generate-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/pdf",
          fileSize: file.size,
          courseId: targetCourseId,
        }),
      });

      if (!presignRes.ok) {
        const errorData = await presignRes.json();
        throw new Error(errorData.error || "Failed to generate upload URL");
      }

      const { uploadUrl, fileKey, publicUrl } = await presignRes.json();

      setUploadProgressText(`Uploading ${file.name} to storage...`);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage upload failed with HTTP status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during file upload."));
        };

        xhr.send(file);
      });

      return { fileKey, publicUrl };
    } catch (err: any) {
      console.error("R2 file upload error:", err);
      throw err;
    }
  };

  const uploadMaterialToR2 = async (file: File, targetCourseId: string): Promise<string | null> => {
    try {
      const res = await uploadFileToR2(file, targetCourseId);
      if (!res) return null;

      setUploadProgressText("Saving course material record...");

      // Save CourseMaterial record to MongoDB
      const saveRes = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: materialTitle.trim() || title.trim() || file.name,
          description: `Lecture material for live class: "${title.trim()}"`,
          courseId: targetCourseId,
          materialType: materialType,
          fileName: file.name,
          fileKey: res.fileKey,
          fileUrl: res.publicUrl,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          isPublished: true,
        }),
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json();
        throw new Error(errJson.error || "Failed to save material record");
      }

      const savedMaterialData = await saveRes.json();
      return savedMaterialData.data?._id || null;
    } catch (uploadErr) {
      console.error("Material upload error during class scheduling:", uploadErr);
      throw uploadErr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Please select an assignment component from the Course Grade Breakdown");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    if (type === "assignment") {
      if (!date) {
        toast.warning("Due date is required");
        return;
      }
      if (date < todayStr) {
        toast.error("Assignment due date cannot be in the past. Please select a valid future date.");
        return;
      }
    }

    setSubmitting(true);
    setUploadProgressText("");

    try {
      if (type === "class") {
        let uploadedMaterialId: string | null = null;

        // If lecturer attached a lecture material file, upload it first to R2
        if (materialFile) {
          try {
            uploadedMaterialId = await uploadMaterialToR2(materialFile, courseId);
          } catch (uploadError: any) {
            toast.error(uploadError.message || "Failed to upload attached lecture material");
            setSubmitting(false);
            return;
          }
        }

        setUploadProgressText("Scheduling live class session...");

        const res = await fetch("/api/lecturer/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            courseId,
            date,
            time,
            meetingLink: link,
            description,
            materialId: uploadedMaterialId,
            materials: uploadedMaterialId ? [uploadedMaterialId] : [],
          }),
        });

        if (res.ok) {
          if (uploadedMaterialId) {
            toast.success(`Live Class "${title}" scheduled and lecture material uploaded successfully!`);
          } else {
            toast.success(`Live Class "${title}" scheduled successfully!`);
          }
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to schedule live class");
        }
      } else if (type === "assignment") {
        let uploadedPdfUrl = "";
        let uploadedPdfName = "";
        let uploadedPdfSize = 0;
        let uploadedFileKey = "";

        if (assignmentPdfFile) {
          try {
            const uploadRes = await uploadFileToR2(assignmentPdfFile, courseId);
            if (uploadRes) {
              uploadedPdfUrl = uploadRes.publicUrl;
              uploadedPdfName = assignmentPdfFile.name;
              uploadedPdfSize = assignmentPdfFile.size;
              uploadedFileKey = uploadRes.fileKey;
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to upload assignment PDF");
            setSubmitting(false);
            return;
          }
        }

        const res = await fetch("/api/lecturer/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            courseId,
            dueDate: date,
            maxPoints,
            description,
            category,
            weight: Number(weight) || 20,
            attachmentUrl: uploadedPdfUrl,
            attachmentName: uploadedPdfName,
            attachmentSize: uploadedPdfSize,
            fileKey: uploadedFileKey,
          }),
        });

        if (res.ok) {
          toast.success(`Assignment "${title}" created & synced with Grade Breakdown!`);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to create assignment");
        }
      } else {
        // Material upload fallback
        await new Promise((res) => setTimeout(res, 600));
        toast.success(`Material "${title}" uploaded to course repository!`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error("Failed to complete action");
    } finally {
      setSubmitting(false);
      setUploadProgressText("");
    }
  };

  const titles = {
    assignment: "Create New Assignment",
    class: "Schedule Live Class",
    material: "Upload Course Material",
  };

  const icons = {
    assignment: <FiFilePlus className="text-[#2563EB]" />,
    class: <FiCalendar className="text-[#5A67D8]" />,
    material: <FiUploadCloud className="text-amber-600" />,
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedCourseObj = courses.find((c) => c._id === courseId);
  const courseBreakdownItems = (selectedCourseObj?.assessmentItems || []).filter(
    (i: any) => i.type !== "exam" && i.type !== "attendance"
  );

  const courseCreatedAssignments = existingAssignments.filter(
    (a: any) => (typeof a.courseId === "object" ? a.courseId?._id : a.courseId) === courseId
  );

  const createdTitlesMap = new Map<string, any>();
  courseCreatedAssignments.forEach((a: any) => {
    if (a.title) createdTitlesMap.set(a.title.trim().toLowerCase(), a);
  });

  const availableBreakdownItems = courseBreakdownItems.filter(
    (i: any) => !createdTitlesMap.has(i.name?.trim().toLowerCase())
  );

  const isMaxLimitReached = 
    type === "assignment" && 
    courseBreakdownItems.length > 0 && 
    courseCreatedAssignments.length >= courseBreakdownItems.length &&
    availableBreakdownItems.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative transform transition-all scale-100 font-sans max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 transition"
        >
          <FiX className="text-xl" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
            {icons[type]}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D3748]">{titles[type]}</h3>
            <p className="text-xs text-[#A0AEC0]">
              {type === "class" 
                ? "Set up live class details and attach lecture materials/slides"
                : "Create assignment based on Course Assessment & Grade Breakdown"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Selector */}
          {courses.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">Target Course</label>
                {type === "assignment" && selectedCourseObj && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isMaxLimitReached 
                      ? "bg-amber-50 text-amber-700 border-amber-200" 
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}>
                    {courseCreatedAssignments.length} / {courseBreakdownItems.length} Assignments Configured
                  </span>
                )}
              </div>
              <select
                value={courseId}
                onChange={(e) => {
                  const newCId = e.target.value;
                  setCourseId(newCId);
                  const matchedC = courses.find(c => c._id === newCId);
                  const items = (matchedC?.assessmentItems || []).filter(
                    (i: any) => i.type !== "exam" && i.type !== "attendance"
                  );
                  
                  const targetAssigns = existingAssignments.filter(
                    (a: any) => (typeof a.courseId === "object" ? a.courseId?._id : a.courseId) === newCId
                  );
                  const createdTitles = new Set(targetAssigns.map((a: any) => a.title?.trim().toLowerCase()));
                  const avail = items.filter((i: any) => !createdTitles.has(i.name?.trim().toLowerCase()));

                  const pick = avail.length > 0 ? avail[0] : (items.length > 0 ? items[0] : null);

                  if (pick) {
                    setTitle(pick.name);
                    setWeight(String(pick.weight));
                    if (pick.type === "quiz") setCategory("Quiz");
                    else if (pick.type === "project") setCategory("Project");
                    else if (pick.type === "coursework") setCategory("Lab Report");
                    else setCategory("Homework");
                  } else {
                    setTitle("");
                  }
                }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC]"
              >
                {courses.map((c) => {
                  const cItems = (c.assessmentItems || []).filter(
                    (i: any) => i.type !== "exam" && i.type !== "attendance"
                  );
                  const cAssigns = existingAssignments.filter(
                    (a: any) => (typeof a.courseId === "object" ? a.courseId?._id : a.courseId) === c._id
                  );
                  const isFull = cItems.length > 0 && cAssigns.length >= cItems.length;

                  return (
                    <option key={c._id} value={c._id}>
                      {c.title} {type === "assignment" ? `(${cAssigns.length}/${cItems.length} Tasks${isFull ? " - Quota Full" : ""})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* QUOTA WARNING WHEN MAX ASSIGNMENTS ARE REACHED */}
          {type === "assignment" && isMaxLimitReached && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 animate-in fade-in">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
                <span>⚠️</span> Maximum Assignment Limit Reached ({courseBreakdownItems.length} / {courseBreakdownItems.length})
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This course&apos;s <strong>Assessment & Grade Breakdown</strong> specifies exactly {courseBreakdownItems.length} assignment(s), and all {courseBreakdownItems.length} have already been created. You cannot create more than {courseBreakdownItems.length} assignment(s) for this course without first adding components to the Course Grade Breakdown under Course Management.
              </p>
            </div>
          )}

          {/* Select ONLY from configured Course Assessment & Grade Breakdown */}
          {type === "assignment" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assessment Component <span className="text-blue-600 font-bold">(From Course Grade Breakdown)</span>
              </label>

              {courseBreakdownItems.length === 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold">No assignment components configured in Grade Breakdown.</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Please configure Course Assessment & Grade Breakdown under Course Management first.
                  </p>
                </div>
              ) : (
                <select
                  required
                  disabled={isMaxLimitReached}
                  value={title}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setTitle(selectedName);
                    const match = courseBreakdownItems.find(i => i.name === selectedName);
                    if (match) {
                      setWeight(String(match.weight));
                      if (match.type === "quiz") setCategory("Quiz");
                      else if (match.type === "project") setCategory("Project");
                      else if (match.type === "coursework") setCategory("Lab Report");
                      else setCategory("Homework");
                    }
                  }}
                  className={`w-full border rounded-xl p-2.5 text-xs font-bold outline-none transition ${
                    isMaxLimitReached 
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                      : "border-gray-200 text-[#1E293B] focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC] cursor-pointer"
                  }`}
                >
                  <option value="">-- Select Configured Assessment Item --</option>
                  {courseBreakdownItems.map((item, idx) => {
                    const alreadyCreated = createdTitlesMap.has(item.name?.trim().toLowerCase());
                    return (
                      <option 
                        key={idx} 
                        value={item.name}
                        disabled={alreadyCreated}
                      >
                        {item.name} ({item.weight}% Weight &bull; {item.type}) {alreadyCreated ? "[Already Created]" : "[Available Slot]"}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {type === "class" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Live Class Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Advanced System Design & Scalability"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          )}

          {type === "assignment" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    disabled={isMaxLimitReached}
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Grade Weight (%)</label>
                  <input
                    type="text"
                    readOnly
                    value={`${weight}%`}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none bg-blue-50 text-blue-700 font-black text-center"
                  />
                </div>
              </div>

              {/* PDF ATTACHMENT UPLOAD SECTION */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1E293B]">
                    Upload Assignment Brief / PDF <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                    Cloudflare R2 Direct
                  </span>
                </div>

                {!assignmentPdfFile ? (
                  <label className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition ${
                    isMaxLimitReached 
                      ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed" 
                      : "border-gray-200 hover:border-blue-500 cursor-pointer bg-gray-50/50 hover:bg-blue-50/30"
                  }`}>
                    <FiUploadCloud className="text-2xl text-blue-600 mb-1" />
                    <p className="text-xs font-bold text-gray-700">Click to upload Assignment PDF / Rubric</p>
                    <p className="text-[10px] text-gray-400">PDF, DOCX, or ZIP files up to 250MB</p>
                    <input
                      type="file"
                      disabled={isMaxLimitReached}
                      accept=".pdf,.doc,.docx,.zip"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAssignmentPdfFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FiFileText className="text-blue-600 text-lg shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-blue-950 truncate">{assignmentPdfFile.name}</p>
                        <p className="text-[10px] text-blue-700 font-semibold">{formatSize(assignmentPdfFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssignmentPdfFile(null)}
                      className="text-gray-400 hover:text-rose-600 p-1 transition"
                      title="Remove PDF"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {type === "class" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
                />
              </div>
            </div>
          )}

          {type === "class" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting URL</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/xyz or Zoom link"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details for students..."
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] resize-none"
            />
          </div>

          {/* ATTACH LECTURE MATERIAL SECTION (FOR LIVE CLASS) */}
          {type === "class" && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#2D3748]">
                  Attach Lecture Material & Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                  Cloudflare R2 Direct
                </span>
              </div>

              {!materialFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isDragging ? "border-[#5A67D8] bg-[#EEF2FF]/40" : "border-gray-200 hover:border-[#5A67D8]/60 hover:bg-gray-50/70"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.mp4"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <FiUploadCloud className="text-2xl text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-700">Click or drag & drop lecture slides or PDF notes</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, PPTX, DOCX, ZIP up to 250MB</p>
                </div>
              ) : (
                <div className="p-3 bg-[#F7FAFC] border border-gray-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-sm">
                        <FiFileText />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D3748] truncate">{materialFile.name}</p>
                        <p className="text-[10px] text-gray-400">{formatSize(materialFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaterialFile(null)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove attached file"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Material Category</label>
                      <select
                        value={materialType}
                        onChange={(e) => setMaterialType(e.target.value as any)}
                        className="w-full border border-gray-200 rounded-lg p-1.5 text-xs outline-none bg-white font-medium"
                      >
                        <option value="slides">Lecture Slides (PPT)</option>
                        <option value="notes">Lecture Notes (PDF)</option>
                        <option value="tutorial">Tutorial Sheet</option>
                        <option value="other">General Resource</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Material Title</label>
                      <input
                        type="text"
                        value={materialTitle}
                        onChange={(e) => setMaterialTitle(e.target.value)}
                        placeholder="Material title..."
                        className="w-full border border-gray-200 rounded-lg p-1.5 text-xs outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadProgressText && (
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-700 font-medium animate-pulse">
              <FiLoader className="animate-spin text-sm shrink-0" />
              <span>{uploadProgressText}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (type === "assignment" && (isMaxLimitReached || courseBreakdownItems.length === 0))}
              className="px-5 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <FiLoader className="animate-spin text-sm" />}
              <span>
                {submitting 
                  ? (materialFile ? "Uploading & Scheduling..." : "Publishing...") 
                  : (type === "class" 
                    ? "Schedule Live Class" 
                    : isMaxLimitReached 
                    ? `Limit Reached (${courseCreatedAssignments.length}/${courseBreakdownItems.length})` 
                    : "Publish Assignment")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
