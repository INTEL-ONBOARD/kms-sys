"use client";

import { useState, useEffect } from 'react';
import AdminSidebar from '@/Components/AdminSidebar';
import DashHeader from '@/Components/DashHeader';
import { FiUserPlus, FiAlertCircle, FiCheckCircle, FiUsers } from 'react-icons/fi';

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

interface Batch {
  _id: string;
  name: string;
  students: any[];
}

export default function ModerationPage() {
  const [enrollmentMode, setEnrollmentMode] = useState<'individual' | 'batch'>('individual');
  
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const usersRes = await fetch('/api/admin/users?role=student&limit=1000');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const usersList = Array.isArray(usersData) ? usersData : usersData.users || [];
          setStudents(usersList.filter((u: User) => u.role === 'student'));
        }

        const coursesRes = await fetch('/api/admin/courses');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          const coursesList = Array.isArray(coursesData) ? coursesData : coursesData.courses || [];
          setCourses(coursesList);
        }

        const batchesRes = await fetch('/api/admin/batches');
        if (batchesRes.ok) {
          const batchesData = await batchesRes.json();
          setBatches(batchesData.batches || []);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (enrollmentMode === 'individual' && (!selectedStudent || !selectedCourse)) {
      setMessage({ text: 'Please select both a student and a course.', type: 'error' });
      return;
    }
    
    if (enrollmentMode === 'batch' && (!selectedBatch || !selectedCourse)) {
      setMessage({ text: 'Please select both a batch and a course.', type: 'error' });
      return;
    }

    setIsAssigning(true);
    setMessage({ text: '', type: '' });

    try {
      if (enrollmentMode === 'individual') {
        const res = await fetch('/api/admin/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedStudent, courseId: selectedCourse })
        });
        const data = await res.json();
        
        if (res.ok) {
          setMessage({ text: 'Course assigned successfully!', type: 'success' });
          setSelectedStudent('');
          setSelectedCourse('');
        } else {
          setMessage({ text: data.message || 'Failed to assign course.', type: 'error' });
        }
      } else {
        const res = await fetch('/api/admin/enrollments/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId: selectedBatch, courseId: selectedCourse })
        });
        const data = await res.json();
        
        if (res.ok) {
          setMessage({ 
            text: `Bulk enrollment complete: ${data.data?.enrolledCount} enrolled, ${data.data?.skippedCount} skipped (already enrolled).`, 
            type: 'success' 
          });
          setSelectedBatch('');
          setSelectedCourse('');
        } else {
          setMessage({ text: data.message || 'Failed to enroll batch.', type: 'error' });
        }
      }
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />
        
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Content Moderation</h1>
            <p className="text-[#A0AEC0] font-medium mt-1">Review courses, moderate forums, and manage manual enrollments</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <FiUserPlus className="mr-2 text-indigo-600" /> Course Enrollment
                </h2>
                <p className="text-sm text-gray-500 mt-1">Assign courses to individual students or entire batches.</p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => { setEnrollmentMode('individual'); setMessage({ text: '', type: '' }); }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${enrollmentMode === 'individual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Individual
                </button>
                <button
                  onClick={() => { setEnrollmentMode('batch'); setMessage({ text: '', type: '' }); }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md flex items-center transition ${enrollmentMode === 'batch' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FiUsers className="mr-1.5" /> Batch
                </button>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-lg mb-6 flex items-center text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.type === 'success' ? <FiCheckCircle className="mr-2 text-lg" /> : <FiAlertCircle className="mr-2 text-lg" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleAssignCourse} className="flex flex-col md:flex-row gap-4 items-end">
              
              {enrollmentMode === 'individual' ? (
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
              ) : (
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <FiUsers className="mr-1" /> Select Batch
                  </label>
                  <select 
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition"
                  >
                    <option value="">-- Choose a Batch --</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name} ({batch.students?.length || 0} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <button 
                type="submit" 
                disabled={isAssigning}
                className="bg-[#5551FF] hover:bg-[#433fd8] text-white font-bold py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isAssigning ? 'Processing...' : (enrollmentMode === 'batch' ? 'Enroll Batch' : 'Assign Course')}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}