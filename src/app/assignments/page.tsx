"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FiChevronDown, 
  FiAlertCircle, 
  FiSearch, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiClock, 
  FiFileText, 
  FiX, 
  FiUploadCloud, 
  FiExternalLink,
  FiAward,
  FiPrinter,
  FiBookOpen,
  FiUser,
  FiCalendar,
  FiCheckSquare,
  FiHelpCircle,
  FiInfo
} from 'react-icons/fi';
import { MdOutlineAssignment, MdOutlineNotificationsActive } from 'react-icons/md';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';
import { useToast } from '@/Components/ToastProvider';

interface SubmissionData {
  _id: string;
  content: string;
  files: string[];
  submittedAt: string;
  grade: number | null;
  feedback: string;
  status: string;
}

interface AssignmentData {
  _id: string;
  title: string;
  description: string;
  course: string;
  courseId: string;
  courseCategory: string;
  instructor: string;
  issuedDate: string;
  issuedDateFormatted: string;
  dueDate: string;
  dueDateFormatted: string;
  maxPoints: number;
  category: string;
  isOverdue: boolean;
  isUrgent: boolean;
  timeLeft: string;
  status: "Pending" | "Submitted" | "Graded" | "Overdue";
  submission: SubmissionData | null;
}

function AssignmentsContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialBriefId = searchParams.get('briefId') || searchParams.get('id');

  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Submitted' | 'Graded'>('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [viewingBrief, setViewingBrief] = useState<AssignmentData | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentData | null>(null);
  const [briefSection, setBriefSection] = useState<'overview' | 'rubric' | 'guidelines' | 'submission'>('overview');
  
  // Submission Form State
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/assignments');
      if (res.ok) {
        const data = await res.json();
        const items: AssignmentData[] = data.assignments || [];
        setAssignments(items);

        // If URL had initialBriefId, open that brief modal immediately
        if (initialBriefId) {
          const match = items.find((a) => a._id === initialBriefId);
          if (match) {
            setViewingBrief(match);
          }
        }
      } else {
        toast.error("Failed to load assignments");
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      toast.error("Error loading assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [initialBriefId]);

  // Distinct courses for dropdown
  const courseList = useMemo(() => {
    return Array.from(new Set(assignments.map((a) => a.course).filter(Boolean)));
  }, [assignments]);

  // Filtered assignments based on Tab, Course Filter, and Search
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // 1. Tab filter
      if (activeTab === 'Pending' && (a.status === 'Submitted' || a.status === 'Graded')) return false;
      if (activeTab === 'Submitted' && a.status !== 'Submitted') return false;
      if (activeTab === 'Graded' && a.status !== 'Graded') return false;

      // 2. Course filter
      if (selectedCourse !== 'All' && a.course !== selectedCourse) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesCourse = a.course.toLowerCase().includes(q);
        const matchesCategory = a.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse && !matchesCategory) return false;
      }

      return true;
    });
  }, [assignments, activeTab, selectedCourse, searchQuery]);

  // Split into Upcoming and Overdue
  const overdueAssignments = useMemo(() => {
    return filteredAssignments.filter((a) => a.isOverdue && !a.submission);
  }, [filteredAssignments]);

  const regularAssignments = useMemo(() => {
    return filteredAssignments.filter((a) => !a.isOverdue || a.submission);
  }, [filteredAssignments]);

  const handleOpenBrief = (assignment: AssignmentData) => {
    setViewingBrief(assignment);
    setBriefSection('overview');
  };

  const handleOpenSubmitModal = (assignment: AssignmentData) => {
    setSubmittingAssignment(assignment);
    setSubmissionContent(assignment.submission?.content || '');
    setSubmissionLink(assignment.submission?.files?.[0] || '');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    if (!submissionContent.trim() && !submissionLink.trim()) {
      toast.warning("Please provide your text response or submission file/link");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: submittingAssignment._id,
          content: submissionContent.trim(),
          files: submissionLink.trim() ? [submissionLink.trim()] : [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Assignment submitted successfully!");
        setSubmittingAssignment(null);
        setSubmissionContent('');
        setSubmissionLink('');
        fetchAssignments();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to submit assignment");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Error submitting assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintBrief = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Component */}
        <Header />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 pt-6">
          
          {/* Page Header and Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">Assignments & Briefs</h1>
                <span className="bg-[#EEF2FF] text-[#5A67D8] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {assignments.length} Total
                </span>
              </div>
              <p className="text-xs text-[#A0AEC0] mt-1">Access assignment briefs, submission guidelines, deadlines, and grades</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search brief or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 shadow-sm text-xs text-gray-700 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8]"
                />
              </div>

              {/* Course Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white border border-gray-100 shadow-sm text-xs font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50 min-w-[160px]"
                >
                  <option value="All">All Courses ({assignments.length})</option>
                  {courseList.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={fetchAssignments}
                title="Refresh assignments"
                className="p-2.5 text-gray-400 hover:text-[#5A67D8] bg-white border border-gray-100 hover:border-[#5A67D8] rounded-xl shadow-sm transition"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin text-[#5A67D8]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-6 px-1">
              {[
                { key: 'All', label: `All (${assignments.length})` },
                { key: 'Pending', label: `Pending / Due (${assignments.filter(a => !a.submission).length})` },
                { key: 'Submitted', label: `Submitted (${assignments.filter(a => a.status === 'Submitted').length})` },
                { key: 'Graded', label: `Graded (${assignments.filter(a => a.status === 'Graded').length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3.5 text-xs md:text-sm font-bold border-b-2 transition-colors duration-200 ${
                    activeTab === tab.key
                      ? 'border-[#5A67D8] text-[#5A67D8]'
                      : 'border-transparent text-[#A0AEC0] hover:text-[#4A5568] hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48" />
                      <div className="h-3 bg-gray-100 rounded w-32" />
                    </div>
                  </div>
                  <div className="h-9 bg-gray-200 rounded-xl w-24" />
                </div>
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-[#5A67D8] flex items-center justify-center mx-auto mb-3 text-2xl">
                <FiFileText />
              </div>
              <h3 className="text-base font-bold text-gray-700">No Assignments Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {assignments.length === 0
                  ? "There are no assignments published for your enrolled courses yet."
                  : "No assignments match your current tab or search criteria."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-bold text-[#5A67D8] hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Overdue Section (If any unsubmitted overdue assignments exist) */}
              {overdueAssignments.length > 0 && (
                <div>
                  <h2 className="text-xs font-extrabold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FiAlertCircle className="text-sm" /> Overdue Tasks ({overdueAssignments.length})
                  </h2>
                  <div className="bg-[#FFF5F5] rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                    <div className="flex flex-col divide-y divide-red-100">
                      {overdueAssignments.map((assignment) => (
                        <div 
                          key={assignment._id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-6 transition hover:bg-[#FEEDED] gap-4"
                        >
                          <div className="flex items-start">
                            <div className="mt-1 mr-4 text-2xl text-red-500 flex-shrink-0">
                              <FiAlertCircle />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">
                                  {assignment.category}
                                </span>
                                <span className="text-xs font-bold text-gray-400">
                                  Max: {assignment.maxPoints} pts
                                </span>
                              </div>
                              <h3 className="font-bold text-[#2D3748] text-base">{assignment.title}</h3>
                              <p className="text-xs font-medium text-red-500 mt-0.5">{assignment.course}</p>
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mt-2">
                                <span className="text-red-400">Due: {assignment.dueDateFormatted}</span>
                                <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {assignment.timeLeft}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 self-end md:self-center">
                            <button 
                              onClick={() => handleOpenBrief(assignment)}
                              className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                            >
                              <FiFileText className="text-sm" /> View Brief
                            </button>
                            <button 
                              onClick={() => handleOpenSubmitModal(assignment)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white shadow-md text-xs font-bold rounded-xl transition"
                            >
                              Submit Late
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Coursework & Briefs List */}
              {regularAssignments.length > 0 && (
                <div>
                  <h2 className="text-xs font-extrabold text-[#2D3748] uppercase tracking-wider mb-3">
                    Coursework Briefs & Tasks ({regularAssignments.length})
                  </h2>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex flex-col divide-y divide-gray-50">
                      {regularAssignments.map((assignment) => (
                        <div 
                          key={assignment._id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-6 transition hover:bg-[#F7FAFC] gap-4"
                        >
                          <div className="flex items-start">
                            <div className={`mt-1 mr-4 text-2xl flex-shrink-0 ${
                              assignment.status === 'Graded' 
                                ? 'text-green-500' 
                                : assignment.status === 'Submitted' 
                                ? 'text-[#5A67D8]' 
                                : assignment.isUrgent 
                                ? 'text-[#ED8936]' 
                                : 'text-gray-400'
                            }`}>
                              {assignment.status === 'Graded' ? (
                                <FiAward />
                              ) : assignment.status === 'Submitted' ? (
                                <FiCheckCircle />
                              ) : assignment.isUrgent ? (
                                <MdOutlineNotificationsActive />
                              ) : (
                                <MdOutlineAssignment />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-[#5A67D8] bg-[#EEF2FF] px-2 py-0.5 rounded uppercase">
                                  {assignment.category}
                                </span>
                                <span className="text-xs font-semibold text-[#A0AEC0]">
                                  {assignment.maxPoints} Points
                                </span>
                                
                                {assignment.status === 'Graded' && (
                                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <FiCheckCircle className="text-xs" /> Graded: {assignment.submission?.grade}/{assignment.maxPoints}
                                  </span>
                                )}
                                {assignment.status === 'Submitted' && (
                                  <span className="text-[10px] font-bold bg-indigo-100 text-[#5A67D8] px-2 py-0.5 rounded-full">
                                    Submitted (Pending Review)
                                  </span>
                                )}
                              </div>

                              <h3 className="font-bold text-[#2D3748] text-base">{assignment.title}</h3>
                              <p className="text-xs font-medium text-[#A0AEC0] mt-0.5">
                                {assignment.course} &bull; {assignment.instructor}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mt-2">
                                <span className="text-[#A0AEC0] flex items-center gap-1">
                                  <FiClock className="text-xs" /> Due: {assignment.dueDateFormatted}
                                </span>
                                {!assignment.submission && (
                                  <span className={assignment.isUrgent ? 'text-[#ED8936] font-bold' : 'text-gray-500'}>
                                    {assignment.timeLeft}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 self-end md:self-center">
                            {/* View Brief Button */}
                            <button 
                              onClick={() => handleOpenBrief(assignment)}
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#5A67D8] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                            >
                              <FiFileText className="text-sm" /> View Brief
                            </button>

                            {assignment.status === 'Graded' ? (
                              <button 
                                onClick={() => {
                                  handleOpenBrief(assignment);
                                  setBriefSection('submission');
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                              >
                                View Grade
                              </button>
                            ) : assignment.status === 'Submitted' ? (
                              <button 
                                onClick={() => handleOpenSubmitModal(assignment)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                              >
                                Resubmit
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleOpenSubmitModal(assignment)}
                                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md transition ${
                                  assignment.isUrgent 
                                    ? 'bg-[#ED8936] hover:bg-[#DD6B20]' 
                                    : 'bg-[#5A67D8] hover:bg-[#434190]'
                                }`}
                              >
                                Submit Work
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* OFFICIAL ASSIGNMENT BRIEF MODAL */}
      {viewingBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 bg-[#F7FAFC] flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#5A67D8] tracking-wider">
                    {viewingBrief.category} BRIEF
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                    {viewingBrief.courseCategory}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    viewingBrief.status === 'Graded' 
                      ? 'bg-green-100 text-green-700' 
                      : viewingBrief.status === 'Submitted' 
                      ? 'bg-indigo-100 text-[#5A67D8]' 
                      : viewingBrief.isOverdue 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {viewingBrief.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintBrief}
                    title="Print Brief"
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition"
                  >
                    <FiPrinter className="text-lg" />
                  </button>
                  <button
                    onClick={() => setViewingBrief(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#111827]">{viewingBrief.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 mt-1">
                  <span className="flex items-center gap-1.5 text-[#5A67D8]">
                    <FiBookOpen /> {viewingBrief.course}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <FiUser /> Lecturer: {viewingBrief.instructor}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Brief Metadata Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-gray-100 text-xs">
              <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                <p className="text-[#A0AEC0] font-semibold text-[11px]">Issued Date</p>
                <p className="font-bold text-[#2D3748] mt-0.5">{viewingBrief.issuedDateFormatted}</p>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                <p className="text-[#A0AEC0] font-semibold text-[11px]">Submission Deadline</p>
                <p className="font-bold text-red-600 mt-0.5">{viewingBrief.dueDateFormatted}</p>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                <p className="text-[#A0AEC0] font-semibold text-[11px]">Maximum Marks</p>
                <p className="font-bold text-[#5A67D8] mt-0.5">{viewingBrief.maxPoints} Points</p>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-gray-100">
                <p className="text-[#A0AEC0] font-semibold text-[11px]">Time Remaining</p>
                <p className={`font-bold mt-0.5 ${viewingBrief.isOverdue ? 'text-red-600' : 'text-[#ED8936]'}`}>
                  {viewingBrief.timeLeft}
                </p>
              </div>
            </div>

            {/* Brief Navigation Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-[#F7FAFC]/50 text-xs font-bold text-gray-500">
              <button
                onClick={() => setBriefSection('overview')}
                className={`py-3 px-4 border-b-2 transition ${
                  briefSection === 'overview'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                Task Instructions
              </button>
              <button
                onClick={() => setBriefSection('rubric')}
                className={`py-3 px-4 border-b-2 transition ${
                  briefSection === 'rubric'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                Assessment Rubric
              </button>
              <button
                onClick={() => setBriefSection('guidelines')}
                className={`py-3 px-4 border-b-2 transition ${
                  briefSection === 'guidelines'
                    ? 'border-[#5A67D8] text-[#5A67D8]'
                    : 'border-transparent hover:text-gray-800'
                }`}
              >
                Submission Guidelines
              </button>
              {viewingBrief.submission && (
                <button
                  onClick={() => setBriefSection('submission')}
                  className={`py-3 px-4 border-b-2 transition ${
                    briefSection === 'submission'
                      ? 'border-[#5A67D8] text-[#5A67D8]'
                      : 'border-transparent hover:text-gray-800'
                  }`}
                >
                  My Submission & Grade
                </button>
              )}
            </div>

            {/* Tab Contents Area */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* 1. OVERVIEW & TASK INSTRUCTIONS */}
              {briefSection === 'overview' && (
                <div className="space-y-5">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-[#434190] leading-relaxed">
                    <h4 className="font-extrabold text-sm mb-1 flex items-center gap-1.5 text-[#5A67D8]">
                      <FiInfo className="text-base" /> Assignment Objective
                    </h4>
                    <p>
                      This coursework assessment is designed to test your comprehensive understanding of the core concepts taught in <strong>{viewingBrief.course}</strong>. Ensure your work complies with academic honesty policies and fulfills all specified deliverables.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider mb-2.5">
                      Detailed Task Brief & Specifications
                    </h4>
                    <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {viewingBrief.description || "The lecturer has specified standard course requirements for this assignment. Review your lecture notes and coursework materials to submit your final response."}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider mb-2">
                      Key Deliverables Checklist
                    </h4>
                    <ul className="space-y-2 text-gray-600 bg-[#F7FAFC] p-4 rounded-2xl border border-gray-100">
                      <li className="flex items-center gap-2">
                        <FiCheckSquare className="text-[#5A67D8] flex-shrink-0" />
                        <span>Complete written report or implementation response</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FiCheckSquare className="text-[#5A67D8] flex-shrink-0" />
                        <span>Supporting diagrams, code, or cloud project repository URL</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FiCheckSquare className="text-[#5A67D8] flex-shrink-0" />
                        <span>Submission before final deadline: <strong>{viewingBrief.dueDateFormatted}</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 2. ASSESSMENT RUBRIC */}
              {briefSection === 'rubric' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                    Grading & Scoring Breakdown ({viewingBrief.maxPoints} Points Total)
                  </h4>
                  
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F7FAFC] border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3.5">Assessment Criterion</th>
                          <th className="p-3.5">Weightage</th>
                          <th className="p-3.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-600">
                        <tr>
                          <td className="p-3.5 font-bold text-[#111827]">Core Subject Mastery & Accuracy</td>
                          <td className="p-3.5 font-semibold text-[#5A67D8]">40%</td>
                          <td className="p-3.5">Correct theoretical analysis, methodology, and direct addressal of the brief requirements.</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-[#111827]">Implementation & Practical Evidence</td>
                          <td className="p-3.5 font-semibold text-[#5A67D8]">30%</td>
                          <td className="p-3.5">Functionality of code, design artifacts, calculations, or practical prototypes.</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-[#111827]">Documentation & Presentation Quality</td>
                          <td className="p-3.5 font-semibold text-[#5A67D8]">20%</td>
                          <td className="p-3.5">Clarity of explanation, structure, visual presentation, and citation standards.</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-[#111827]">Timeliness & Adherence to Guidelines</td>
                          <td className="p-3.5 font-semibold text-[#5A67D8]">10%</td>
                          <td className="p-3.5">Submission strictly on or before deadline adhering to submission formats.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. SUBMISSION GUIDELINES */}
              {briefSection === 'guidelines' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider">
                    Official Submission Instructions
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-gray-100 space-y-2">
                      <h5 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                        <FiUploadCloud className="text-[#5A67D8]" /> File & Cloud Links
                      </h5>
                      <p className="text-gray-600 leading-relaxed text-[11px]">
                        Submit your project repository link (GitHub/GitLab) or cloud folder (Google Drive, OneDrive). Ensure sharing permissions allow view access for course lecturers.
                      </p>
                    </div>

                    <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-gray-100 space-y-2">
                      <h5 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                        <FiAlertCircle className="text-amber-600" /> Late Submission Policy
                      </h5>
                      <p className="text-gray-600 leading-relaxed text-[11px]">
                        Work submitted past the due date will be marked with a <strong>Late</strong> tag. Penalties may apply according to academic regulations unless mitigating circumstances are approved.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 space-y-1">
                    <h5 className="font-bold text-xs">Academic Integrity Statement</h5>
                    <p className="text-[11px] leading-relaxed">
                      All submitted work must be your own original effort. Plagiarism or unauthorized collusion will be referred to the academic misconduct board.
                    </p>
                  </div>
                </div>
              )}

              {/* 4. MY SUBMISSION & FEEDBACK (IF EXISTS) */}
              {briefSection === 'submission' && viewingBrief.submission && (
                <div className="space-y-4">
                  <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Submitted At</span>
                        <p className="font-bold text-gray-800 text-xs">
                          {new Date(viewingBrief.submission.submittedAt).toLocaleString()}
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        viewingBrief.submission.grade !== null 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-indigo-100 text-[#5A67D8]'
                      }`}>
                        {viewingBrief.submission.grade !== null ? 'Graded' : 'Submitted'}
                      </span>
                    </div>

                    {viewingBrief.submission.content && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 mb-1">Your Written Response:</p>
                        <p className="text-gray-800 bg-white p-3.5 rounded-xl border border-gray-200 leading-relaxed">
                          {viewingBrief.submission.content}
                        </p>
                      </div>
                    )}

                    {viewingBrief.submission.files && viewingBrief.submission.files.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 mb-1">Submitted Attachment Links:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingBrief.submission.files.map((f, i) => (
                            <a
                              key={i}
                              href={f}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border border-gray-200 text-[#5A67D8] font-bold rounded-lg hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <FiExternalLink /> {f}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grade & Lecturer Feedback */}
                    {viewingBrief.submission.grade !== null && (
                      <div className="p-4 bg-white rounded-xl border border-green-200 space-y-2">
                        <div className="flex justify-between items-center text-green-700 font-extrabold">
                          <span>Awarded Grade:</span>
                          <span className="text-base">{viewingBrief.submission.grade} / {viewingBrief.maxPoints} pts</span>
                        </div>
                        {viewingBrief.submission.feedback && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-[11px] font-semibold text-gray-400">Lecturer Feedback:</p>
                            <p className="text-gray-700 italic text-xs mt-0.5">&ldquo;{viewingBrief.submission.feedback}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-[#F7FAFC] flex justify-between items-center">
              <button
                onClick={() => setViewingBrief(null)}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
              >
                Close Brief
              </button>

              {viewingBrief.status !== 'Graded' && (
                <button
                  onClick={() => {
                    const assign = viewingBrief;
                    setViewingBrief(null);
                    handleOpenSubmitModal(assign);
                  }}
                  className="px-6 py-2.5 bg-[#5A67D8] text-white font-bold text-xs rounded-xl hover:bg-[#434190] shadow-md transition flex items-center gap-1.5"
                >
                  <FiUploadCloud className="text-sm" />
                  {viewingBrief.submission ? 'Update Submission' : 'Submit Coursework'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SUBMIT WORK MODAL */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-[#F7FAFC]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#5A67D8]">
                  {submittingAssignment.course}
                </span>
                <h2 className="text-lg font-extrabold text-[#2D3748] mt-1">Submit Assignment</h2>
                <p className="text-xs text-gray-400">{submittingAssignment.title}</p>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAssignment} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Submission Notes / Written Response
                </label>
                <textarea
                  rows={4}
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Type your response or project overview here..."
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-[#5A67D8] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Cloud Project Link or File URL (Google Drive, GitHub, etc.)
                </label>
                <input
                  type="text"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  className="w-full bg-[#F7FAFC] border border-gray-200 text-gray-800 text-xs rounded-xl py-2.5 px-3.5 outline-none focus:ring-2 focus:ring-[#5A67D8]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-[11px]">
                {submittingAssignment.isOverdue ? (
                  <p className="font-semibold">⚠️ Note: This assignment is past due. Your submission will be marked as Late.</p>
                ) : (
                  <p>Make sure you verify all requirements before submitting your final response.</p>
                )}
              </div>

              {/* Submit Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="text-sm" />
                      Submit Coursework
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center text-sm text-gray-400">Loading assignments...</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}