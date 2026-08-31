"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiClock,
  FiUsers,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertCircle,
  FiDollarSign,
  FiCalendar,
  FiX,
  FiExternalLink,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import AdminSidebar from "@/components/shared/AdminSidebar";
import DashHeader from "@/components/shared/DashHeader";
import { useToast } from "@/contexts/ToastContext";

interface StudentUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
}

interface CourseInfo {
  _id: string;
  title: string;
  price: string;
  capacity?: number;
  enrollments?: number;
  nextBatchStartDate?: string | Date | null;
  colorCode?: string;
  category?: string;
}

interface EnrollmentRequestItem {
  _id: string;
  studentId: StudentUser | null;
  courseId: CourseInfo | null;
  batchStartDate: string | Date;
  paymentSlipUrl: string;
  paymentSlipKey?: string;
  amount?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
}

interface StatsData {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function AdminEnrollmentRequestsPage() {
  const toast = useToast();

  const [requests, setRequests] = useState<EnrollmentRequestItem[]>([]);
  const [stats, setStats] = useState<StatsData>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [selectedSlipItem, setSelectedSlipItem] = useState<EnrollmentRequestItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<EnrollmentRequestItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/enroll-requests?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        const payload = data.data || data;
        setRequests(payload.requests || []);
        if (payload.stats) {
          setStats(payload.stats);
        }
      } else {
        toast.error("Failed to load enrollment requests.");
      }
    } catch (error) {
      console.error("Error fetching enrollment requests:", error);
      toast.error("Network error while loading requests.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    setCurrentPage(1);
  }, [statusFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  // Approve Request
  const handleApprove = async (item: EnrollmentRequestItem) => {
    if (isProcessingAction) return;

    try {
      setIsProcessingAction(true);
      const res = await fetch(`/api/admin/enroll-requests/${item._id}/approve`, {
        method: "PUT",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to approve enrollment request");
      }

      toast.success(
        `Enrollment approved for ${item.studentId?.name || "Student"} in ${item.courseId?.title || "course"}!`
      );

      // Close slip view modal if open for this item
      if (selectedSlipItem?._id === item._id) {
        setSelectedSlipUrl(null);
        setSelectedSlipItem(null);
      }

      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Approval failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Reject Request
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem || isProcessingAction) return;

    try {
      setIsProcessingAction(true);
      const res = await fetch(`/api/admin/enroll-requests/${rejectingItem._id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReasonInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to reject enrollment request");
      }

      toast.success(`Request for ${rejectingItem.studentId?.name || "Student"} was rejected.`);
      setRejectingItem(null);
      setRejectionReasonInput("");

      if (selectedSlipItem?._id === rejectingItem._id) {
        setSelectedSlipUrl(null);
        setSelectedSlipItem(null);
      }

      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Rejection failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filter Search
  const filteredRequests = requests.filter((r) => {
    const studentName = r.studentId?.name?.toLowerCase() || "";
    const studentEmail = r.studentId?.email?.toLowerCase() || "";
    const courseTitle = r.courseId?.title?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return (
      studentName.includes(search) ||
      studentEmail.includes(search) ||
      courseTitle.includes(search) ||
      r._id.toLowerCase().includes(search)
    );
  });

  // Pagination Slice
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-16 pt-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D3748] tracking-tight">
                Enrollment & Payment Requests
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Review student bank deposit slips, verify tuition fees, and approve or reject intake cohort enrollments.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:border-[#5A67D8] hover:text-[#5A67D8] rounded-xl shadow-xs transition self-start sm:self-auto cursor-pointer"
            >
              <FiRefreshCw className={`text-xs ${isRefreshing ? "animate-spin text-[#5A67D8]" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Quick KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
                <FiClock />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Review</p>
                <h3 className="text-2xl font-black text-gray-800 mt-0.5">{stats.pending}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <FiCheckCircle />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved</p>
                <h3 className="text-2xl font-black text-gray-800 mt-0.5">{stats.approved}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
                <FiXCircle />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rejected</p>
                <h3 className="text-2xl font-black text-gray-800 mt-0.5">{stats.rejected}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#5A67D8] flex items-center justify-center text-xl shrink-0">
                <FiUsers />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Requests</p>
                <h3 className="text-2xl font-black text-gray-800 mt-0.5">{stats.total}</h3>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by student, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-xs font-medium text-gray-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8] transition"
                />
              </div>

              {/* Status Filter Tab Pill */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {[
                  { key: "pending", label: "Pending Review" },
                  { key: "approved", label: "Approved" },
                  { key: "rejected", label: "Rejected" },
                  { key: "all", label: "All Statuses" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.key
                        ? "bg-[#5A67D8] text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-6">Course</th>
                    <th className="py-3.5 px-6">Fee</th>
                    <th className="py-3.5 px-6">Intake Batch</th>
                    <th className="py-3.5 px-6">Transfer Slip</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <FiRefreshCw className="animate-spin text-lg text-[#5A67D8]" />
                          <span>Loading enrollment requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <FiFileText className="text-3xl mx-auto mb-2 text-gray-300" />
                        <p className="font-bold text-gray-600">No enrollment requests found</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {searchTerm ? "Try searching with a different keyword." : "There are no requests under this filter."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentRequests.map((req) => {
                      const student = req.studentId;
                      const course = req.courseId;
                      const isPending = req.status === "pending";

                      return (
                        <tr key={req._id} className="hover:bg-gray-50/60 transition">
                          {/* Student Info */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {student?.avatar ? (
                                  <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  (student?.name || "S").charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{student?.name || "Unknown Student"}</p>
                                <p className="text-[11px] text-gray-400 truncate">{student?.email || "No email"}</p>
                              </div>
                            </div>
                          </td>

                          {/* Course Info */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {course?.colorCode && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: course.colorCode }}
                                />
                              )}
                              <span className="font-bold text-gray-900 line-clamp-1">{course?.title || "Unknown Course"}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-semibold">{course?.category || "General"}</span>
                          </td>

                          {/* Fee */}
                          <td className="py-4 px-6 font-bold text-gray-900">
                            {req.amount || course?.price || "Free"}
                          </td>

                          {/* Batch Start Date */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <FiCalendar className="text-gray-400 text-xs shrink-0" />
                              <span>
                                {req.batchStartDate
                                  ? new Date(req.batchStartDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Immediate"}
                              </span>
                            </div>
                          </td>

                          {/* Payment Slip Link / Thumbnail */}
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSlipUrl(req.paymentSlipUrl);
                                setSelectedSlipItem(req);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#5A67D8] bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition cursor-pointer"
                            >
                              <FiEye className="text-xs" /> View Slip
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${getStatusBadge(
                                req.status
                              )}`}
                            >
                              {req.status}
                            </span>
                            {req.status === "rejected" && req.rejectionReason && (
                              <p className="text-[10px] text-rose-500 mt-1 line-clamp-1" title={req.rejectionReason}>
                                Reason: {req.rejectionReason}
                              </p>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isProcessingAction}
                                  onClick={() => handleApprove(req)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
                                  title="Approve and register into batch"
                                >
                                  <FiCheckCircle className="text-xs" /> Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessingAction}
                                  onClick={() => {
                                    setRejectingItem(req);
                                    setRejectionReasonInput("");
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                                  title="Reject payment slip"
                                >
                                  <FiXCircle className="text-xs" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {filteredRequests.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} entries
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <FiChevronLeft /> Prev
                </button>
                <span className="px-3 py-1.5 font-bold text-[#5A67D8] bg-indigo-50 border border-indigo-100 rounded-lg">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── View Slip Modal ── */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-indigo-50/40">
              <div>
                <h3 className="text-base font-extrabold text-[#2D3748]">
                  Bank Transfer Slip &bull; {selectedSlipItem?.studentId?.name || "Student"}
                </h3>
                <p className="text-xs text-gray-500">
                  Course: <strong>{selectedSlipItem?.courseId?.title}</strong> &bull; Amount: <strong>{selectedSlipItem?.amount}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FiExternalLink /> Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlipUrl(null);
                    setSelectedSlipItem(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Slip Viewer Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-900/5 min-h-[350px]">
              {selectedSlipUrl.toLowerCase().includes(".pdf") ||
              selectedSlipItem?.paymentSlipKey?.toLowerCase().endsWith(".pdf") ||
              selectedSlipItem?.paymentSlipUrl?.toLowerCase().includes(".pdf") ? (
                <div className="w-full space-y-3">
                  <iframe
                    src={selectedSlipUrl}
                    title="PDF Slip Preview"
                    className="w-full h-[480px] rounded-xl border border-gray-200 shadow-sm bg-white"
                  />
                  <div className="text-center">
                    <a
                      href={selectedSlipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A67D8] hover:underline"
                    >
                      <FiExternalLink /> Open PDF in Full Screen Window
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={selectedSlipUrl}
                    alt="Bank transfer slip"
                    className="max-h-[480px] max-w-full object-contain rounded-xl border border-gray-200 shadow-md bg-white p-2"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer with quick action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Uploaded: {selectedSlipItem?.createdAt ? new Date(selectedSlipItem.createdAt).toLocaleString() : ""}
              </span>

              {selectedSlipItem && selectedSlipItem.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleApprove(selectedSlipItem)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FiCheckCircle /> Approve Transfer
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => {
                      setRejectingItem(selectedSlipItem);
                      setRejectionReasonInput("");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiXCircle /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Prompt Modal ── */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Reject Payment Slip</h3>
            <p className="text-xs text-gray-500 mb-4">
              Specify a reason for rejecting the transfer slip uploaded by{" "}
              <strong>{rejectingItem.studentId?.name || "this student"}</strong> for{" "}
              <strong>{rejectingItem.courseId?.title}</strong>.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Incomplete transaction reference, unreadable slip image, or incorrect tuition amount."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-rose-400 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction || !rejectionReasonInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
