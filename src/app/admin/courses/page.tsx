"use client";

import { useState, useEffect } from 'react';
import DashHeader from '@/Components/DashHeader'; 
import AdminSidebar from '@/Components/AdminSidebar';
import { FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiEye, FiBook, FiTag, FiX, FiClock, FiMapPin } from 'react-icons/fi';
import type { ScheduleSlot } from '@/types/lms';

// Define the Course interface based on your MongoDB structure
interface CourseData {
  _id: string;
  title: string;
  instructor: string;
  category: string;
  price: string;
  status: string;
  enrollments: number;
  colorCode?: string;
  schedule?: ScheduleSlot[];
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
    title:      '',
    instructor: '',
    category:   'Design',
    price:      'Free',
    status:     'draft',
    colorCode:  '#5A67D8',
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

  // Run fetchCourses once when the component mounts
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

  // Calculate pagination variables
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem); // Courses to show on current page
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  // Reset to page 1 whenever the user types a search or changes the filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedCategoryFilter]);

  // --- 4. Action Handlers (API Calls) ---

  // Handle Add Course Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, schedule: scheduleSlots }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ title: '', instructor: '', category: 'Design', price: 'Free', status: 'draft', colorCode: '#5A67D8' });
        setScheduleSlots([]);
        fetchCourses();
      }
    } catch (error) {
      console.error("Failed to add course:", error);
    }
  };

  // Handle Edit Course Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, schedule: scheduleSlots }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchCourses();
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
              <p className="text-[#A0AEC0] font-medium mt-1">Manage all platform courses, categories, and tags</p>
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
              <button onClick={() => setIsAddModalOpen(true)} className="bg-[#5A67D8] hover:bg-[#434190] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300">
                <FiPlus className="mr-2 text-lg" />
                New Course
              </button>
            </div>
          </div>

          {/* Quick Stats (Dynamically Calculated) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mr-4"><FiBook className="text-indigo-600 text-xl" /></div>
              <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Courses</p><h3 className="text-2xl font-extrabold text-gray-800">{courses.length}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mr-4"><FiBook className="text-green-600 text-xl" /></div>
              <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Published</p><h3 className="text-2xl font-extrabold text-gray-800">{totalPublished}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mr-4"><FiBook className="text-orange-600 text-xl" /></div>
              <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">In Draft</p><h3 className="text-2xl font-extrabold text-gray-800">{totalDrafts}</h3></div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <FiFilter className="text-gray-400" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 outline-none cursor-pointer p-2"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Course Info</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading courses...</td></tr>
                  ) : currentCourses.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No courses found.</td></tr>
                  ) : (
                    // Map through the paginated & filtered courses
                    currentCourses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{course.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{course.enrollments} Enrollments</div>
                        </td>
                        <td className="px-6 py-4"><div className="font-medium text-gray-700">{course.instructor}</div></td>
                        <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">{course.category}</span></td>
                        <td className="px-6 py-4"><span className={`font-bold ${course.price === 'Free' ? 'text-green-600' : 'text-gray-700'}`}>{course.price}</span></td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${getStatusBadge(course.status)}`}>{course.status}</span></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            {/* View Button */}
                            <button onClick={() => { setSelectedCourse(course); setIsViewModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View Details">
                              <FiEye className="text-base" />
                            </button>
                            {/* Edit Button */}
                            <button onClick={() => { 
                                setSelectedCourse(course); 
                                setFormData({ title: course.title, instructor: course.instructor, category: course.category, price: course.price, status: course.status, colorCode: course.colorCode || '#5A67D8' }); 
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

                {/* Core Fields */}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label><input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label><input required type="text" value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none">
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
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><input required type="text" placeholder="Free or $49.99" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  {/* Colour picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        className="h-9 w-12 rounded border border-gray-300 cursor-pointer p-0.5"
                        title="Pick a calendar colour"
                      />
                      <input
                        type="text"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        maxLength={7}
                        placeholder="#5A67D8"
                        className="flex-1 border rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
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
                            <select value={slot.dayOfWeek} onChange={(e) => updateSlot(i, 'dayOfWeek', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none">
                              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Start</label>
                            <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">End</label>
                            <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block flex items-center gap-1"><FiMapPin className="inline" />Location</label>
                            <input type="text" placeholder="Hall 15" value={slot.location} onChange={(e) => updateSlot(i, 'location', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button form="add-course-form" type="submit" className="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-bold hover:bg-indigo-700 transition">Create Course</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Course Modal */}
      {isEditModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Edit Course</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <form id="edit-course-form" onSubmit={handleEditSubmit} className="space-y-4">

                <div><label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label><input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label><input required type="text" value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none">
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
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><input required type="text" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  {/* Colour picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        className="h-9 w-12 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.colorCode}
                        onChange={(e) => setFormData({...formData, colorCode: e.target.value})}
                        maxLength={7}
                        placeholder="#5A67D8"
                        className="flex-1 border rounded-lg p-2 text-sm font-mono focus:ring-2 focus:ring-indigo-400 outline-none"
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
                            <select value={slot.dayOfWeek} onChange={(e) => updateSlot(i, 'dayOfWeek', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none">
                              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Start</label>
                            <input type="time" value={slot.startTime} onChange={(e) => updateSlot(i, 'startTime', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">End</label>
                            <input type="time" value={slot.endTime} onChange={(e) => updateSlot(i, 'endTime', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Location</label>
                            <input type="text" placeholder="Hall 15" value={slot.location} onChange={(e) => updateSlot(i, 'location', e.target.value)} className="w-full border rounded-md p-1.5 text-sm focus:ring-1 focus:ring-indigo-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button form="edit-course-form" type="submit" className="w-full bg-blue-600 text-white rounded-lg p-2.5 font-bold hover:bg-blue-700 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. View Course Details Modal */}
      {isViewModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Course Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={24} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="font-bold text-gray-600">Title:</span> {selectedCourse.title}</p>
              <p><span className="font-bold text-gray-600">Instructor:</span> {selectedCourse.instructor}</p>
              <p><span className="font-bold text-gray-600">Category:</span> {selectedCourse.category}</p>
              <p><span className="font-bold text-gray-600">Price:</span> {selectedCourse.price}</p>
              <p><span className="font-bold text-gray-600">Status:</span> <span className="capitalize">{selectedCourse.status}</span></p>
              <p><span className="font-bold text-gray-600">Enrollments:</span> {selectedCourse.enrollments}</p>
            </div>
            <button onClick={() => setIsViewModalOpen(false)} className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-lg transition">Close</button>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Course?</h3>
            <p className="text-gray-500 mb-6 text-sm">Are you sure you want to delete <b>{selectedCourse.title}</b>? This cannot be undone.</p>
            <div className="flex space-x-3 justify-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}