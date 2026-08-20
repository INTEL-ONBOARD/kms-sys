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
  FiLock,
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
  const [recordingLink, setRecordingLink] = useState("");
  
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

  if (!loadingCourses && courses.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FiLock />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Upload Materials Blocked</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            You do not have any assigned courses. All material uploads and sharing are blocked until an administrator assigns courses to your account from the Admin Panel.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (file: File) => {
    // 50MB lecturer limit
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File exceeds the maximum lecturer upload limit of 50MB.");
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

    // Link-only for lecture recordings
    if (materialType === "video") {
      if (!recordingLink.trim()) {
        toast.error("Please provide a valid recording link (e.g. Google Drive link)");
        return;
      }

      try {
        setErrorMessage("");
        setUploadState("saving_metadata");
        setUploadProgress(70);

        const metaRes = await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            courseId: selectedCourseId,
            materialType: "video",
            fileName: title.trim() + " (Recording Link)",
            fileKey: `external-link-${Date.now()}`,
            fileUrl: recordingLink.trim(),
            fileSize: 0,
            mimeType: "video/mp4",
          }),
        });

        if (!metaRes.ok) {
          const errJson = await metaRes.json();
          throw new Error(errJson.message || errJson.error || "Failed to save recording link");
        }

        setUploadState("success");
        setUploadProgress(100);
        toast.success(`Lecture recording link for "${title}" published successfully!`);

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      } catch (err: any) {
        setUploadState("error");
        setErrorMessage(err.message || "An unexpected error occurred.");
        toast.error(err.message || "Failed to save recording link");
      }
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

      // Step 1: Request pre-signed upload URL from R2
      const urlRes = await fetch("/api/materials/generate-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
        }),
      });

      if (!urlRes.ok) {
        const errJson = await urlRes.json();
        throw new Error(errJson.error || "Failed to authorize upload");
      }

      const urlData = await urlRes.json();
      const { uploadUrl, fileKey, publicUrl } = urlData.data;

      // Step 2: Upload binary directly to Cloudflare R2
      setUploadState("uploading_r2");
      setUploadProgress(20);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 70) + 20; // Scale from 20% to 90%
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage service error (${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during file transfer"));
        xhr.send(selectedFile);
      });

      // Step 3: Save metadata to MongoDB
      setUploadState("saving_metadata");
      setUploadProgress(95);

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
        const errJson = await metaRes.json();
        throw new Error(errJson.error || "Failed to save material record");
      }

      setUploadState("success");
      setUploadProgress(100);
      toast.success(`"${title}" uploaded and published to students!`);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Upload workflow failed:", err);
      setUploadState("error");
      setErrorMessage(err.message || "An unexpected error occurred during upload.");
      toast.error(err.message || "Material upload failed.");
    }
  };

  const isUploading =
    uploadState === "generating_url" ||
    uploadState === "uploading_r2" ||
    uploadState === "saving_metadata";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#5A67D8] flex items-center justify-center font-bold text-sm">
              <FiUploadCloud />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Upload Course Material</h2>
              <p className="text-[11px] text-[#A0AEC0]">
                Publish notes, slides, tutorials, or video recordings for enrolled students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-40"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleUploadAndSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Target Course Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Select Course <span className="text-red-500">*</span>
            </label>
            {loadingCourses ? (
              <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={isUploading}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#5A67D8] focus:border-transparent transition"
              >
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Material Category Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Material Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: "notes", label: "Lecture Notes", icon: FiFileText },
                { id: "slides", label: "Slides", icon: FiPackage },
                { id: "tutorial", label: "Tutorial", icon: FiFile },
                { id: "assignment", label: "Assignment", icon: FiFileText },
                { id: "video", label: "Recording", icon: FiFilm },
                { id: "other", label: "Other", icon: FiPackage },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = materialType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={isUploading}
                    onClick={() => setMaterialType(cat.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                      isSelected
                        ? "bg-[#EEF2FF] border-[#5A67D8] text-[#5A67D8] font-bold shadow-xs"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                    }`}
                  >
                    <Icon className="text-base mb-1" />
                    <span className="text-[10px] truncate w-full">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Material Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isUploading}
              placeholder="e.g. Lecture 04: Animation Timing & Motion Curves"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#5A67D8] focus:border-transparent transition"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Description / Instructions <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              disabled={isUploading}
              placeholder="Provide context, required readings, or chapter references for students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#5A67D8] focus:border-transparent transition resize-none"
            />
          </div>

          {/* Drag & Drop File Upload Area OR Recording Link Input */}
          {materialType === "video" ? (
            <div className="space-y-2 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#1E293B]">
                  Lecture Recording Link <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Link Only (Drive / Zoom / YouTube)
                </span>
              </div>
              <input
                type="url"
                required
                disabled={isUploading}
                placeholder="https://drive.google.com/file/d/... or Zoom / YouTube link"
                value={recordingLink}
                onChange={(e) => setRecordingLink(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              />
              <p className="text-[10px] text-purple-700 font-medium leading-relaxed">
                ℹ️ Lecture recordings are attached via cloud links only (e.g. Google Drive, Zoom Cloud, YouTube, OneDrive). Direct video file upload is disabled.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Attach File <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                disabled={isUploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? "border-[#5A67D8] bg-[#EEF2FF]/50"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#5A67D8] flex items-center justify-center mx-auto mb-2 text-lg">
                    <FiUploadCloud />
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Supported: PDF, PPTX, DOCX, ZIP &middot; Max size: 50 MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-[#F7FAFC] border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-[#5A67D8] flex items-center justify-center text-base shrink-0 font-bold">
                      <FiFile />
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
          )}

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
