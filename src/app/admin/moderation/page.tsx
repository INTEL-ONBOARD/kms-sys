"use client";

import { useState, useEffect } from 'react';
import AdminSidebar from '@/Components/AdminSidebar';
import DashHeader from '@/Components/DashHeader';
import { FiEye, FiCheck, FiX, FiUserPlus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

// Define TypeScript interfaces for the fetched data to ensure type safety
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Course {
  _id: string;
  title: string;
}

export default function ModerationPage() {
  // ==========================================
  // STATE MANAGEMENT FOR COURSE ASSIGNMENT
  // ==========================================
  
  // States to store fetched data for dropdowns
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // States to hold the user's current selections
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // UI states for loading indicators and feedback messages
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // ==========================================
  // FETCH DATA ON COMPONENT MOUNT
  // ==========================================
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // 1. Fetch Users Data
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          // Extract users array gracefully, supporting both direct arrays and wrapped objects
          const usersList = Array.isArray(usersData) ? usersData : usersData.users || [];
          // Filter to only include users with the 'student' role
          setStudents(usersList.filter((u: User) => u.role === 'student'));
        }

        // 2. Fetch Courses Data
        const coursesRes = await fetch('/api/admin/courses');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          // Extract courses array gracefully
          const coursesList = Array.isArray(coursesData) ? coursesData : coursesData.courses || [];
          setCourses(coursesList);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []); // Empty dependency array means this runs once on mount

  // ==========================================
  // FORM SUBMISSION HANDLER
  // ==========================================
  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form reload
    
    // Validate that both fields are selected
    if (!selectedStudent || !selectedCourse) {
      setMessage({ text: 'Please select both a student and a course.', type: 'error' });
      return;
    }

    setIsAssigning(true);
    setMessage({ text: '', type: '' }); // Clear previous messages

    try {
      // Send a POST request to our Enrollment API
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedStudent, courseId: selectedCourse })
      });

      const data = await res.json();

      // Handle successful assignment
      if (res.ok) {
        setMessage({ text: 'Course assigned successfully!', type: 'success' });
        // Reset dropdowns to default state after success
        setSelectedStudent('');
        setSelectedCourse('');
      } else {
        // Handle API errors (e.g., student already enrolled)
        setMessage({ text: data.message || 'Failed to assign course.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setIsAssigning(false); // Stop loading state
    }
  };

  // ==========================================
  // MOCK DATA FOR EXISTING UI COMPONENTS
  // ==========================================
  const pendingCourses = [
    { id: 1, title: 'Advanced React Patterns', instructor: 'Michael Scott', date: '2026-04-27' },
    { id: 2, title: 'UI/UX Fundamentals', instructor: 'Sarah Jenkins', date: '2026-04-26' },
  ];

  const reportedPosts = [
    { id: 1, content: '"Can someone share the final exam answers here?"', course: 'Animation Studies I', author: 'Emma Watson', reason: 'Cheating/Academic Dishonesty (3 reports)' },
    { id: 2, content: '"This lecture was completely useless and the teacher is an idiot."', course: 'Design Principles', author: 'John Doe', reason: 'Harassment/Abusive Language (5 reports)' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Left Sidebar */}
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navigation Header */}
        <DashHeader />

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          
          {/* Page Title & Description */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Content Moderation</h1>
            <p className="text-[#A0AEC0] font-medium mt-1">Review courses, moderate forums, and manage manual enrollments</p>
          </div>

          {/* ========================================= */}
          {/* SECTION: MANUAL COURSE ASSIGNMENT */}
          {/* ========================================= */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-10">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <FiUserPlus className="mr-2 text-indigo-600" /> Manual Course Enrollment
            </h2>
            <p className="text-sm text-gray-500 mb-6">Assign a specific course to a student. This action will be securely logged in the audit registry.</p>

            {/* Display Success/Error Feedback Messages */}
            {message.text && (
              <div className={`p-4 rounded-lg mb-6 flex items-center text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.type === 'success' ? <FiCheckCircle className="mr-2 text-lg" /> : <FiAlertCircle className="mr-2 text-lg" />}
                {message.text}
              </div>
            )}

            {/* Assignment Form */}
            <form onSubmit={handleAssignCourse} className="flex flex-col md:flex-row gap-4 items-end">
              
              {/* Student Selection Dropdown */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Student</label>
                <select 
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition"
                >
                  <option value="">-- Choose a Student --</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Selection Dropdown */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Course</label>
                <select 
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition"
                >
                  <option value="">-- Choose a Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isAssigning}
                className="bg-[#5551FF] hover:bg-[#433fd8] text-white font-bold py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isAssigning ? 'Assigning...' : 'Assign Course'}
              </button>
            </form>
          </div>

          {/* ========================================= */}
          {/* SECTION: PENDING COURSE APPROVALS */}
          {/* ========================================= */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-[#2D3748] mb-4 flex items-center">
              <span className="bg-[#EBF4FF] text-[#5551FF] p-1.5 rounded mr-2"><FiEye /></span>
              Pending Course Approvals
              <span className="ml-3 bg-[#EBF4FF] text-[#5551FF] text-xs font-bold px-2 py-0.5 rounded-full">2 Pending</span>
            </h2>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Course Title</th>
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingCourses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-800">{course.title}</td>
                      <td className="px-6 py-4">{course.instructor}</td>
                      <td className="px-6 py-4">{course.date}</td>
                      <td className="px-6 py-4 text-right flex justify-end space-x-2">
                        <button className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition" title="View"><FiEye /></button>
                        <button className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded transition" title="Approve"><FiCheck /></button>
                        <button className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition" title="Reject"><FiX /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================= */}
          {/* SECTION: REPORTED FORUM POSTS */}
          {/* ========================================= */}
          <div>
            <h2 className="text-lg font-bold text-[#2D3748] mb-4 flex items-center">
              <span className="bg-orange-50 text-orange-500 p-1.5 rounded mr-2"><FiAlertCircle /></span>
              Reported Forum Posts
              <span className="ml-3 bg-orange-50 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">2 Reports</span>
            </h2>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Post Content & Course</th>
                    <th className="px-6 py-4">Author</th>
                    <th className="px-6 py-4">Reason For Report</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportedPosts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 mb-1">{post.content}</p>
                        <p className="text-xs text-indigo-500 font-medium">{post.course}</p>
                      </td>
                      <td className="px-6 py-4">{post.author}</td>
                      <td className="px-6 py-4">
                        <span className="text-orange-600 flex items-center text-xs font-bold">
                          <FiAlertCircle className="mr-1" /> {post.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button className="text-gray-500 font-medium hover:text-gray-700 transition">Dismiss</button>
                        <button className="text-red-600 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition">Delete Post</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}