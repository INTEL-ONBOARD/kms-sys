"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiUploadCloud,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiFileText,
  FiFilm,
  FiPackage,
} from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

interface CourseOption {
  _id: string;
  title: string;
}

interface MaterialUploadModalProps {
  initialCourseId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type UploadState = "idle" | "generating_url" | "uploading_r2" | "saving_metadata" | "success" | "error";

export default function MaterialUploadModal({
  initialCourseId = "",
  onClose,
  onSuccess,
}: MaterialUploadModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<"notes" | "slides" | "tutorial" | "assignment" | "video" | "other">("notes");
  
  // File & Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch lecturer courses
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const res = await fetch("/api/lecturer/courses?limit=50");
        if (res.ok) {
          const data = await res.json();
          const courseList: CourseOption[] = data.data || [];
          setCourses(courseList);
          if (!selectedCourseId && courseList.length > 0) {
            setSelectedCourseId(courseList[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, [selectedCourseId]);

  const handleFileSelect = (file: File) => {
    // 250MB limit
    if (file.size > 250 * 1024 * 1024) {
      setErrorMessage("File exceeds the maximum limit of 250MB.");
      return;
    }
    setSelectedFile(file);
    setErrorMessage("");
    if (!title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast.error("Please select a target course");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a material title");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setErrorMessage("");
      setUploadState("generating_url");
      setUploadProgress(5);

      // STEP 1: Request Pre-signed Upload URL from Next.js API
      const presignRes = await fetch("/api/materials/generate-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          courseId: selectedCourseId,
        }),
      });

      if (!presignRes.ok) {
        const errorData = await presignRes.json();
        throw new Error(errorData.error || "Failed to generate upload URL");
      }

      const { uploadUrl, fileKey, publicUrl } = await presignRes.json();

      // STEP 2: Upload File directly to Cloudflare R2 using XMLHttpRequest with progress
      setUploadState("uploading_r2");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage upload failed with HTTP status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during file upload to Cloudflare R2. Check CORS configuration."));
        };

        xhr.send(selectedFile);
      });

      // STEP 3: Save metadata to MongoDB
      setUploadState("saving_metadata");

      const metaRes = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          courseId: selectedCourseId,
          materialType,
          fileName: selectedFile.name,
          fileKey,
          fileUrl: publicUrl,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || "application/octet-stream",
        }),
      });

      if (!metaRes.ok) {
        const metaError = await metaRes.json();
        throw new Error(metaError.error || "Failed to save material metadata");
      }

      setUploadState("success");
      toast.success(`"${title}" published to course successfully!`);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during upload.";
      setErrorMessage(msg);
      setUploadState("error");
      toast.error(msg);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FiFile className="w-6 h-6 text-gray-400" />;
    const type = selectedFile.type.toLowerCase();
    if (type.includes("pdf") || type.includes("word") || type.includes("presentation")) {
      return <FiFileText className="w-6 h-6 text-[#5A67D8]" />;
    }
    if (type.includes("video")) {
      return <FiFilm className="w-6 h-6 text-purple-600" />;
    }
    if (type.includes("zip") || type.includes("rar")) {
      return <FiPackage className="w-6 h-6 text-amber-600" />;
    }
    return <FiFile className="w-6 h-6 text-emerald-600" />;
  };

  const isUploading = uploadState === "generating_url" || uploadState === "uploading_r2" || uploadState === "saving_metadata";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in font-sans">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative transform transition-all scale-100 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 transition disabled:opacity-40"
        >
          <FiX className="text-xl" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl shrink-0">
            <FiUploadCloud />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#2D3748]">Upload Course Material</h3>
            <p className="text-xs text-[#A0AEC0]">Distribute lecture notes and resources to enrolled students</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUploadAndSubmit} className="space-y-4 overflow-y-auto pr-1">
          
          {/* Target Course Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Target Course <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={isUploading || loadingCourses}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC] disabled:opacity-50"
            >
              {loadingCourses ? (
                <option value="">Loading courses...</option>
              ) : courses.length === 0 ? (
                <option value="">No teaching courses found</option>
              ) : (
                courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Type and Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as any)}
                disabled={isUploading}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] bg-[#F7FAFC]"
              >
                <option value="notes">Lecture Notes</option>
                <option value="slides">Slides / PPT</option>
                <option value="tutorial">Tutorial</option>
                <option value="assignment">Assignment</option>
                <option value="video">Recording</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Week 4 - Relational Databases & SQL"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Instructions or supplementary reading notes for students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A67D8] resize-none"
            />
          </div>

          {/* File Attachment Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              File Attachment <span className="text-red-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              disabled={isUploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.mp4"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-[#5A67D8] bg-indigo-50/50"
                    : "border-gray-200 hover:border-[#5A67D8] bg-[#F7FAFC]"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-white text-[#5A67D8] shadow-xs flex items-center justify-center text-lg">
                    <FiUploadCloud />
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    Click to browse or drag & drop file
                  </p>
                  <p className="text-[10px] text-gray-400">
                    PDF, PowerPoint (PPTX), Word (DOCX), ZIP, MP4 up to 250MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#F7FAFC] border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-white rounded-lg shadow-2xs shrink-0">
                    {getFileIcon()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &middot; {selectedFile.type || "file"}
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-md transition"
                  >
                    <FiX className="text-base" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress Status */}
          {isUploading && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A67D8]">
                <span className="flex items-center gap-1.5">
                  <FiLoader className="animate-spin text-sm" />
                  {uploadState === "generating_url" && "Authorizing storage token..."}
                  {uploadState === "uploading_r2" && `Streaming file (${uploadProgress}%)...`}
                  {uploadState === "saving_metadata" && "Saving course record..."}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#5A67D8] h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Notification */}
          {uploadState === "success" && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
              <FiCheckCircle className="text-green-600 shrink-0" />
              <span>Material successfully uploaded and shared with students!</span>
            </div>
          )}

          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
              <FiAlertCircle className="text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !selectedCourseId || !title.trim()}
              className="px-5 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-sm shadow-indigo-100 transition flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isUploading ? (
                <>
                  <FiLoader className="animate-spin text-sm" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FiUploadCloud className="text-sm" />
                  <span>Upload & Publish</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
