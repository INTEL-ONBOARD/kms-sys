"use client";

import { useState, useEffect } from "react";
import { 
  FiAward, 
  FiCheckCircle, 
  FiSearch, 
  FiEdit3, 
  FiX, 
  FiFileText, 
  FiUser, 
  FiBook, 
  FiExternalLink, 
  FiDownload, 
  FiClock, 
  FiAlertCircle,
  FiPaperclip
} from "react-icons/fi";
import { useToast } from "@/Components/ToastProvider";

export default function LecturerGradebookPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [gradingItem, setGradingItem] = useState<any>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/lecturer/grading-queue");
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
      }
    } catch (err) {
      console.error("Failed to load gradebook:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenGradeModal = (item: any) => {
    setGradingItem(item);
    setGradeValue(item.grade !== undefined && item.grade !== null ? item.grade.toString() : "");
    setFeedback(item.feedback || "");
  };

  const handleCloseGradeModal = () => {
    setGradingItem(null);
    setGradeValue("");
    setFeedback("");
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingItem) return;

    if (gradeValue.trim() === "" || isNaN(Number(gradeValue)) || Number(gradeValue) < 0 || Number(gradeValue) > 100) {
      toast.error("Please enter a valid grade between 0 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lecturer/grade-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingItem._id,
          grade: gradeValue,
          feedback,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully graded submission for ${gradingItem.studentName}`);
        handleCloseGradeModal();
        fetchQueue();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to submit grade");
      }
    } catch (err) {
      console.error("Grade submit error:", err);
      toast.error("Failed to submit grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      // remove any timestamp/uuid prefix if present (e.g. 1720000000-uuid-filename.pdf)
      const clean = decodeURIComponent(lastPart).replace(/^\d+-[a-f0-9-]+-/, "");
      return clean || "Submitted_Document.pdf";
    } catch {
      return "Submitted_Document.pdf";
    }
  };

  const filtered = queue.filter(
    (item) =>
      item.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Gradebook & Evaluation</h1>
          <p className="text-xs text-gray-400 mt-1">Review student submissions, inspect submitted documents, and assign grades</p>
        </div>
        <div className="relative w-full sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by student, assignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7FAFC] text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAFC] border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Assignment</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Submitted Documents</th>
                <th className="px-6 py-4">Submission Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No pending submissions found in queue
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-[#F7FAFC] transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#111827]">{item.studentName}</div>
                      {item.studentEmail && (
                        <div className="text-[10px] text-gray-400">{item.studentEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{item.assignmentTitle}</td>
                    <td className="px-6 py-4 text-gray-500">{item.courseTitle}</td>
                    <td className="px-6 py-4">
                      {item.files && item.files.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <FiPaperclip className="text-xs" />
                          {item.files.length} {item.files.length === 1 ? "File" : "Files"}
                        </span>
                      ) : item.content ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <FiFileText className="text-xs" />
                          Written Text
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">No attachments</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(item.submittedAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.isOverdue ? "Overdue" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenGradeModal(item)}
                        className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                      >
                        <FiEdit3 className="text-xs" /> Review & Grade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading & Document Review Modal Overlay */}
      {gradingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
                  <FiAward className="text-[#2563EB]" /> Review & Evaluate Submission
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Examine submitted documents and record evaluation</p>
              </div>
              <button
                onClick={handleCloseGradeModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Submission Overview Card */}
            <div className="bg-[#F8FAFC] border border-gray-200/70 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Student</span>
                <p className="font-extrabold text-gray-800 flex items-center gap-1.5">
                  <FiUser className="text-blue-600" /> {gradingItem.studentName}
                </p>
                {gradingItem.studentEmail && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{gradingItem.studentEmail}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Course & Assessment</span>
                <p className="font-extrabold text-gray-800 truncate" title={gradingItem.assignmentTitle}>
                  {gradingItem.assignmentTitle}
                </p>
                <p className="text-[11px] text-gray-500 truncate" title={gradingItem.courseTitle}>
                  {gradingItem.courseTitle}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Submission Details</span>
                <p className="font-bold text-gray-700 flex items-center gap-1">
                  <FiClock className="text-gray-400" /> {new Date(gradingItem.submittedAt || Date.now()).toLocaleString()}
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${gradingItem.isOverdue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {gradingItem.isOverdue ? 'Submitted Late' : 'Submitted On-Time'}
                </span>
              </div>
            </div>

            {/* 1. STUDENT SUBMITTED DELIVERABLES & DOCUMENTS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FiPaperclip className="text-[#2563EB]" /> Student Submitted Files & Deliverables
                </h4>
                {gradingItem.files && gradingItem.files.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {gradingItem.files.length} Attached {gradingItem.files.length === 1 ? "Item" : "Items"}
                  </span>
                )}
              </div>

              {/* Files List */}
              {gradingItem.files && gradingItem.files.length > 0 ? (
                <div className="space-y-2">
                  {gradingItem.files.map((fileUrl: string, idx: number) => {
                    const fileName = getFileNameFromUrl(fileUrl);
                    const isLink = fileUrl.startsWith("http") && !fileUrl.includes("cloudflarestorage.com") && !fileUrl.includes("/materials/") && !fileUrl.includes(".pdf");
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            <FiFileText />
                          </div>
                          <div className="truncate">
                            <p className="font-extrabold text-xs text-blue-950 truncate max-w-xs sm:max-w-md">
                              {fileName}
                            </p>
                            <p className="text-[10px] text-blue-600 font-medium truncate max-w-xs sm:max-w-md">
                              {fileUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
                          <a
                            href={`/api/lecturer/submissions/${gradingItem._id}/file?index=${idx}&action=view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs flex-1 sm:flex-initial"
                          >
                            <FiExternalLink /> Open Document
                          </a>
                          <a
                            href={`/api/lecturer/submissions/${gradingItem._id}/file?index=${idx}&action=download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                            title="Download File"
                          >
                            <FiDownload />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !gradingItem.content && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/60 text-center text-gray-400 text-xs">
                    No attachments or files submitted for this task.
                  </div>
                )
              )}

              {/* Written Response Content */}
              {gradingItem.content && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500">Student Written Notes / Overview:</span>
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {gradingItem.content}
                  </div>
                </div>
              )}
            </div>

            {/* 2. GRADING & EVALUATION FORM */}
            <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2 border-t border-gray-100">
              <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiAward className="text-[#2563EB]" /> Grade & Constructive Feedback
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Awarded Score (0 – 100%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="e.g. 88"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl py-2.5 pl-4 pr-12 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-extrabold">
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Lecturer Feedback & Guidance <span className="text-gray-400 font-normal">(Visible to student upon publishing)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide feedback on strengths, rubric criteria fulfilled, or areas to improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl p-3 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseGradeModal}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 shadow-md rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  <FiCheckCircle className="text-sm" />
                  {isSubmitting ? "Publishing Grade..." : "Publish Grade & Feedback"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
