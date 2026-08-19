"use client";

import { useState, useEffect, useRef } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiBook, 
  FiTag, 
  FiX, 
  FiClock, 
  FiMapPin, 
  FiUserCheck, 
  FiChevronDown, 
  FiCheck, 
  FiUser,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import type { ScheduleSlot } from '@/types/lms';

// Define the Course interface based on your MongoDB structure
interface CourseData {
  _id: string;
  title: string;
  instructor: string;
  instructorId?: string;
  category: string;
  price: string;
  status: string;
  enrollments: number;
  colorCode?: string;
  schedule?: ScheduleSlot[];
}

interface LecturerUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface LecturerDropdownProps {
  selectedId: string;
  selectedName: string;
  onSelect: (lecturer: LecturerUser | null) => void;
  required?: boolean;
}

function LecturerDropdown({ selectedId, selectedName, onSelect, required = true }: LecturerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lecturers, setLecturers] = useState<LecturerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch lecturers from backend with search query
  const fetchLecturers = async (query = '') => {
    try {
      setLoading(true);
      const url = `/api/admin/users?role=lecturer${query ? `&search=${encodeURIComponent(query)}` : ''}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list: LecturerUser[] = data.users || data.data?.users || [];
        setLecturers(list.filter((u) => u.role === 'lecturer'));
      }
    } catch (err) {
      console.error('Failed to fetch lecturers for dropdown:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers('');
  }, []);

  // Backend search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLecturers(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLecturer = lecturers.find((l) => l._id === selectedId);
  const displayName = selectedLecturer?.name || selectedName;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <FiUserCheck className="text-indigo-600" /> Assign Lecturer <span className="text-red-500">*</span>
        </span>
        {displayName && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] text-gray-400 hover:text-red-500 transition font-normal"
          >
            Clear Selection
          </button>
        )}
      </label>

      {/* Main Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 bg-white text-left transition ${
          isOpen ? 'ring-2 ring-indigo-400 border-indigo-400' : 'border-gray-200 hover:border-gray-300'
        } ${!displayName ? 'text-gray-400' : 'text-gray-800'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            displayName ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
          }`}>
            {displayName ? displayName.charAt(0).toUpperCase() : <FiUser />}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-gray-800 truncate">
              {displayName || 'Select a registered lecturer...'}
            </p>
            {selectedLecturer?.email && (
              <p className="text-[10px] text-gray-400 truncate">{selectedLecturer.email}</p>
            )}
          </div>
        </div>
        <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Search Box in Dropdown */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
            <FiSearch className="text-gray-400 text-xs ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Search lecturer by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none font-medium"
            />
            {loading && <FiLoader className="animate-spin text-indigo-600 text-xs mr-1" />}
          </div>

          {/* List of Lecturers */}
          <div className="max-h-56 overflow-y-auto py-1 text-xs divide-y divide-gray-50">
            {loading && lecturers.length === 0 ? (
              <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2">
                <FiLoader className="animate-spin text-indigo-500" />
                <span>Searching lecturers...</span>
              </div>
            ) : lecturers.length === 0 ? (
              <div className="p-4 text-center text-gray-400 space-y-1">
                <p className="font-semibold text-gray-600">No registered lecturers found</p>
                <p className="text-[10px]">Ensure lecturers register with the &quot;lecturer&quot; role</p>
              </div>
            ) : (
              lecturers.map((lec) => {
                const isSelected = selectedId === lec._id || (!selectedId && displayName === lec.name);
                return (
                  <div
                    key={lec._id}
                    onClick={() => {
                      onSelect(lec);
                      setIsOpen(false);
                    }}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/80 text-indigo-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lec.name ? lec.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-800 truncate">{lec.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{lec.email}</p>
                      </div>
                    </div>
                    {isSelected && <FiCheck className="text-indigo-600 text-sm shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {required && !displayName && (
        <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
          <FiAlertCircle className="text-xs" /> Lecturer assignment is required from the dropdown.
        </p>
      )}
    </div>
  );
}

export default function CoursesAdminPage() {
  // --- States for Data and UI ---
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of courses per page

  // Modal Visibility States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // State to hold the currently selected course for Edit/View/Delete
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  // Form State for Add/Edit Modals
  const [formData, setFormData] = useState({
    title:        '',
    instructor:   '',
    instructorId: '',
    category:     'Design',
    price:        'Free',
    status:       'draft',
    colorCode:    '#5A67D8',
  });

  // Schedule slots state — separate from formData for easier array management
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);

  // Helper: add a blank slot
  const addSlot = () =>
    setScheduleSlots((prev) => [
      ...prev,
      { dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00', location: '' },
    ]);

  // Helper: remove a slot by index
  const removeSlot = (i: number) =>
    setScheduleSlots((prev) => prev.filter((_, idx) => idx !== i));

  // Helper: update a single field inside a slot
  const updateSlot = (i: number, field: keyof ScheduleSlot, value: string) =>
    setScheduleSlots((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );

  // --- 2. Fetch Courses from Database ---
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses); // Update state with real data
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run initial fetch on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // --- 3. Filter & Pagination Logic ---
  
  // Derive unique categories for the filter
  const uniqueCategories = ['All Categories', ...new Set(courses.map(c => c.category))];

  // Filter courses based on search term and selected status
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || course.status === statusFilter;
    const matchesCategory = selectedCategoryFilter === 'All Categories' || course.category === selectedCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate items for the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  // Reset to page 1 whenever the user types a search or changes the filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedCategoryFilter]);

  // --- 4. Action Handlers (API Calls) ---

  // Handle Add Course Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instructor || !formData.instructorId) {
      alert("Please select a registered lecturer from the dropdown list.");
      return;
    }

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, schedule: scheduleSlots }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ title: '', instructor: '', instructorId: '', category: 'Design', price: 'Free', status: 'draft', colorCode: '#5A67D8' });
        setScheduleSlots([]);
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Failed to add course:", error);
    }
  };

  // Handle Edit Course Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!formData.instructor || !formData.instructorId) {
      alert("Please select a registered lecturer from the dropdown list.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, schedule: scheduleSlots }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  // Handle Delete Course Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse._id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchCourses(); // Refresh table
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  // --- 5. UI Helper Functions ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Dynamic calculations for Quick Stats
  const totalPublished = courses.filter(c => c.status === 'published').length;
  const totalDrafts = courses.filter(c => c.status === 'draft').length;

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />

        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6 relative">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Course Management</h1>
              <p className="text-[#A0AEC0] font-medium mt-1">Manage all platform courses, categories, and lecturer assignments</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <div className="relative flex items-center">
                <FiTag className="absolute left-3.5 text-lg text-indigo-500 pointer-events-none" />
                <select 
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 pl-10 pr-8 py-2.5 rounded-lg text-sm font-bold shadow-sm appearance-none outline-none cursor-pointer transition duration-300 w-full"
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {/* Open Add Modal Button */}
              <button onClick={() => {
                setFormData({ title: '', instructor: '', instructorId: '', category: 'Design', price: 'Free', status: 'draft', colorCode: '#5A67D8' });
                setScheduleSlots([]);
                setIsAddModalOpen(true);
              }} className="bg-[#5A67D8] hover:bg-[#434190] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300 cursor-pointer">
                <FiPlus className="mr-2 text-lg" />
                New Course
              </button>
            </div>
          </div>

          {/* Quick Stats (Dynamically Calculated) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 mr-4">
                <FiBook className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Courses</p>
                <h3 className="text-2xl font-black text-gray-800">{courses.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="p-3.5 rounded-xl bg-green-50 text-green-600 mr-4">
                <FiEye className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Published</p>
                <h3 className="text-2xl font-black text-gray-800">{totalPublished}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="p-3.5 rounded-xl bg-orange-50 text-orange-600 mr-4">
                <FiClock className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Drafts</p>
                <h3 className="text-2xl font-black text-gray-800">{totalDrafts}</h3>
              </div>
            </div>
          </div>

          {/* Main Content Area - Courses Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Table Filters Header */}
            <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                <input 
                  type="text" 
                  placeholder="Search courses or assigned lecturers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center space-x-2">
                <FiFilter className="text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">Status:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg text-sm px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="All">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Course Name</th>
                    <th className="py-4 px-6">Assigned Lecturer</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">Loading courses...</td>
                    </tr>
                  ) : currentCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No courses found.</td>
                    </tr>
                  ) : (
                    currentCourses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 font-bold text-gray-800">
                          <div className="flex items-center gap-2">
                            {course.colorCode && (
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: course.colorCode }}
                                title={`Calendar color: ${course.colorCode}`}
                              />
                            )}
                            <span>{course.title}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <FiUserCheck className="text-xs" />
                            {course.instructor || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-500">{course.category}</td>
                        <td className="py-4 px-6 font-semibold text-gray-700">{course.price}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(course.status)}`}>
                            {course.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* View Button */}
                            <button onClick={() => { setSelectedCourse(course); setIsViewModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View Course Details">
                              <FiEye className="text-base" />
                            </button>
                            {/* Edit Button */}
                            <button onClick={() => { 
                                setSelectedCourse(course); 
                                setFormData({ 
                                  title: course.title, 
                                  instructor: course.instructor, 
                                  instructorId: course.instructorId || '',
                                  category: course.category, 
                                  price: course.price, 
                                  status: course.status, 
                                  colorCode: course.colorCode || '#5A67D8' 
                                }); 
                                setScheduleSlots(course.schedule ?? []);
                                setIsEditModalOpen(true); 
                              }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Course">
                              <FiEdit className="text-base" />
                            </button>
                            {/* Delete Button */}
                            <button onClick={() => { setSelectedCourse(course); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Course">
                              <FiTrash2 className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <span>Showing {filteredCourses.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCourses.length)} of {filteredCourses.length} entries</span>
              <div className="flex space-x-1">
                <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
                <button className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-medium">{currentPage}</button>
                <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- MODALS SECTION --- */}
      
      {/* 1. Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Add New Course</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <form id="add-course-form" onSubmit={handleAddSubmit} className="space-y-4">

                {/* Course Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Course Title <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="e.g. Interaction Design Principles" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none" />
                </div>
                
                {/* Searchable Assign Lecturer Dropdown */}
                <LecturerDropdown
                  selectedId={formData.instructorId}
                  selectedName={formData.instructor}
                  onSelect={(lec) => {
                    if (lec) {
                      setFormData({
                        ...formData,
                        instructorId: lec._id,
                        instructor: lec.name,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        instructorId: '',
                        instructor: '',
                      });
                    }
                  }}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                      <option value="Design">Design</option>
                      <option value="Media">Media</option>
                      <option value="Computing">Computing</option>
                      <option value="Arts">Arts</option>
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Business">Business</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Law">Law</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                    <input required type="text" placeholder="Free or $49.99" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  {/* Colour picker */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Calendar Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        className="h-9 w-12 rounded-xl border border-gray-300 cursor-pointer p-0.5"
                        title="Pick a calendar colour"
                      />
                      <input
                        type="text"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        maxLength={7}
                        placeholder="#5A67D8"
                        className="flex-1 border border-gray-200 rounded-xl p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Schedule Section ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FiClock className="text-indigo-500" /> Weekly Schedule
                    </label>
                    <button
                      type="button"
                      onClick={addSlot}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 border border-indigo-200 hover:border-indigo-400 px-2.5 py-1 rounded-lg transition"
                    >
                      <FiPlus /> Add Slot
                    </button>
                  </div>

                  {scheduleSlots.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                      No schedule slots yet. Click &ldquo;Add Slot&rdquo; to define class times.
                    </p>
                  )}

                  <div className="space-y-3">
                    {scheduleSlots.map((slot, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Slot {i + 1}</span>
                          <button type="button" onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-600 transition"><FiX size={14} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-3">
                            <label className="text-xs text-gray-500 mb-0.5 block">Day of Week</label>
                            <select value={slot.dayOfWeek} onChange={(e) => updateSlot(i, 'dayOfWeek', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none">
                              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Start</label>
                            <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">End</label>
                            <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block flex items-center gap-1"><FiMapPin className="inline" />Location</label>
                            <input type="text" placeholder="Hall 15" value={slot.location} onChange={(e) => updateSlot(i, 'location', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" form="add-course-form" className="px-4 py-2 text-sm font-bold text-white bg-[#5A67D8] hover:bg-[#434190] rounded-lg shadow-sm">Save Course</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Course Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Edit Course</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
            </div>

            <div className="overflow-y-auto px-6 py-4 flex-1">
              <form id="edit-course-form" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Course Title <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none" />
                </div>
                
                {/* Searchable Assign Lecturer Dropdown */}
                <LecturerDropdown
                  selectedId={formData.instructorId}
                  selectedName={formData.instructor}
                  onSelect={(lec) => {
                    if (lec) {
                      setFormData({
                        ...formData,
                        instructorId: lec._id,
                        instructor: lec.name,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        instructorId: '',
                        instructor: '',
                      });
                    }
                  }}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                      <option value="Design">Design</option>
                      <option value="Media">Media</option>
                      <option value="Computing">Computing</option>
                      <option value="Arts">Arts</option>
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Business">Business</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Law">Law</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                    <input required type="text" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  {/* Colour picker */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Calendar Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        className="h-9 w-12 rounded-xl border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        maxLength={7}
                        placeholder="#5A67D8"
                        className="flex-1 border border-gray-200 rounded-xl p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Schedule Section ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FiClock className="text-indigo-500" /> Weekly Schedule
                    </label>
                    <button
                      type="button"
                      onClick={addSlot}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 border border-indigo-200 hover:border-indigo-400 px-2.5 py-1 rounded-lg transition"
                    >
                      <FiPlus /> Add Slot
                    </button>
                  </div>

                  {scheduleSlots.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                      No schedule slots yet. Click &ldquo;Add Slot&rdquo; to define class times.
                    </p>
                  )}

                  <div className="space-y-3">
                    {scheduleSlots.map((slot, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Slot {i + 1}</span>
                          <button type="button" onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-600 transition"><FiX size={14} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-3">
                            <label className="text-xs text-gray-500 mb-0.5 block">Day of Week</label>
                            <select value={slot.dayOfWeek} onChange={(e) => updateSlot(i, 'dayOfWeek', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none">
                              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Start</label>
                            <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">End</label>
                            <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block flex items-center gap-1"><FiMapPin className="inline" />Location</label>
                            <input type="text" placeholder="Hall 15" value={slot.location} onChange={(e) => updateSlot(i, 'location', e.target.value)} className="w-full border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" form="edit-course-form" className="px-4 py-2 text-sm font-bold text-white bg-[#5A67D8] hover:bg-[#434190] rounded-lg shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-800">{selectedCourse?.title}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. View Course Modal */}
      {isViewModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-sm text-gray-400">ID: {selectedCourse._id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedCourse.status)}`}>
                {selectedCourse.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3 text-sm text-gray-600 border-t border-b border-gray-100 py-4 mb-4">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Instructor:</span>
                <span className="font-bold text-gray-800">{selectedCourse.instructor}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Category:</span>
                <span className="font-bold text-gray-800">{selectedCourse.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Price:</span>
                <span className="font-bold text-gray-800">{selectedCourse.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-400">Enrollments:</span>
                <span className="font-bold text-gray-800">{selectedCourse.enrollments || 0} Students</span>
              </div>

              {/* Schedule Details in View Modal */}
              {selectedCourse.schedule && selectedCourse.schedule.length > 0 && (
                <div className="pt-2">
                  <span className="font-semibold text-gray-400 block mb-1.5">Weekly Schedule:</span>
                  <div className="space-y-1">
                    {selectedCourse.schedule.map((s, idx) => (
                      <div key={idx} className="bg-gray-50 rounded px-2.5 py-1 text-xs text-gray-700 flex justify-between">
                        <span className="font-semibold">{s.dayOfWeek}</span>
                        <span>{s.startTime} – {s.endTime}{s.location ? ` (${s.location})` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}