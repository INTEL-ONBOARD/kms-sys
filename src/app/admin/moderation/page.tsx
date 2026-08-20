"use client";

import { useState, useEffect } from 'react';
import AdminSidebar from '@/Components/AdminSidebar';
import DashHeader from '@/Components/DashHeader';
import { FiUserPlus, FiAlertCircle, FiCheckCircle, FiUsers, FiTrash2, FiSettings, FiSearch } from 'react-icons/fi';

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
  maxCapacity: number;
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

  const [manageBatchId, setManageBatchId] = useState('');
  const [batchStudents, setBatchStudents] = useState<User[]>([]);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [isManagingBatch, setIsManagingBatch] = useState(false);
  const [batchMessage, setBatchMessage] = useState({ text: '', type: '' });
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityInput, setCapacityInput] = useState('');
  const [isSavingCapacity, setIsSavingCapacity] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedBatchData = batches.find(b => b._id === manageBatchId);
  const currentCapacity = selectedBatchData?.maxCapacity || 50;
  const currentEnrolledCount = batchStudents.length;
  const isBatchFull = currentEnrolledCount >= currentCapacity;

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
            text: `Bulk enrollment complete: ${data.enrolledCount ?? 0} enrolled, ${data.skippedCount ?? 0} skipped (already enrolled).`, 
            type: 'success' 
          });
          setSelectedBatch('');
          setSelectedCourse('');
        } else {
          setMessage({ text: data.message || 'Failed to enroll batch.', type: 'error' });
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message || 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchBatchStudents = async (batchId: string, search: string = '') => {
    if (!batchId) {
      setBatchStudents([]);
      return;
    }
    try {
      const url = search 
        ? `/api/admin/batches/${batchId}/students?search=${encodeURIComponent(search)}` 
        : `/api/admin/batches/${batchId}/students`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBatchStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching batch students:", error);
    }
  };

  useEffect(() => {
    const selected = batches.find(b => b._id === manageBatchId);
    if (selected) {
      setCapacityInput(selected.maxCapacity.toString());
      setIsEditingCapacity(false);
    }
  }, [manageBatchId, batches]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatchStudents(manageBatchId, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [manageBatchId, searchQuery]);

  const handleCreateBatch = async () => {
    setIsCreatingBatch(true);
    setBatchMessage({ text: '', type: '' });
    try {
      const nextBatchNumber = batches.length + 1;
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Batch ${nextBatchNumber}`, description: `Auto-generated Batch ${nextBatchNumber}` })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchMessage({ text: `Successfully created ${data.batch?.name || 'new batch'}.`, type: 'success' });
        // Refresh batches list
        const batchesRes = await fetch('/api/admin/batches');
        if (batchesRes.ok) {
          const batchesData = await batchesRes.json();
          setBatches(batchesData.batches || []);
        }
      } else {
        setBatchMessage({ text: data.message || 'Failed to create batch.', type: 'error' });
      }
    } catch (error) {
      setBatchMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleAssignToBatch = async () => {
    if (!manageBatchId || !assignStudentId) return;
    setIsManagingBatch(true);
    setBatchMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/admin/users/${assignStudentId}/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: manageBatchId })
      });
      if (res.ok) {
        setBatchMessage({ text: 'Student assigned to batch successfully.', type: 'success' });
        setAssignStudentId('');
        fetchBatchStudents(manageBatchId, searchQuery);
      } else {
        const data = await res.json();
        setBatchMessage({ text: data.message || 'Failed to assign student.', type: 'error' });
      }
    } catch (error) {
      setBatchMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsManagingBatch(false);
    }
  };

  const handleRemoveFromBatch = (studentId: string) => {
    setStudentToRemove(studentId);
  };

  const confirmRemoval = async () => {
    if (!studentToRemove) return;
    setIsManagingBatch(true);
    setBatchMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/admin/users/${studentToRemove}/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: null })
      });
      if (res.ok) {
        setBatchMessage({ text: 'Student removed successfully.', type: 'success' });
        fetchBatchStudents(manageBatchId, searchQuery);
      } else {
        const data = await res.json();
        setBatchMessage({ text: data.message || 'Failed to remove student.', type: 'error' });
      }
    } catch (error) {
      setBatchMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsManagingBatch(false);
      setStudentToRemove(null);
    }
  };

  const handleUpdateCapacity = async () => {
    if (!manageBatchId || !capacityInput) return;
    const newCap = parseInt(capacityInput, 10);
    if (isNaN(newCap) || newCap < 1) {
      setBatchMessage({ text: 'Please enter a valid capacity greater than 0.', type: 'error' });
      return;
    }

    setIsSavingCapacity(true);
    try {
      const res = await fetch(`/api/admin/batches/${manageBatchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCapacity: newCap })
      });
      
      if (res.ok) {
        setBatchMessage({ text: 'Batch capacity updated successfully.', type: 'success' });
        setIsEditingCapacity(false);
        // Refresh batches to reflect new capacity
        const batchesRes = await fetch('/api/admin/batches');
        if (batchesRes.ok) {
          const batchesData = await batchesRes.json();
          setBatches(batchesData.batches || []);
        }
      } else {
        const data = await res.json();
        setBatchMessage({ text: data.message || 'Failed to update capacity.', type: 'error' });
      }
    } catch (error) {
      setBatchMessage({ text: 'An unexpected error occurred while updating capacity.', type: 'error' });
    } finally {
      setIsSavingCapacity(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />
        
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Manual Course Enrollment</h1>
            <p className="text-[#A0AEC0] font-medium mt-1">Assign courses directly to registered students and manage enrollment access</p>
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
                  onClick={(e) => { e.preventDefault(); setEnrollmentMode('individual'); setMessage({ text: '', type: '' }); }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${enrollmentMode === 'individual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Individual
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setEnrollmentMode('batch'); setMessage({ text: '', type: '' }); }}
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-10">
            <div className="mb-6 border-b border-gray-100 pb-4 flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <FiSettings className="mr-2 text-indigo-600" /> Batch Management
                </h2>
                <p className="text-sm text-gray-500 mt-1">Manage students assigned to a specific batch.</p>
              </div>
              
              {selectedBatchData && (
                <div className="mt-4 md:mt-0 flex items-center bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                  <span className="text-sm font-bold text-indigo-900 mr-3">
                    Capacity: {currentEnrolledCount} / {isEditingCapacity ? (
                      <input 
                        type="number" 
                        value={capacityInput}
                        onChange={(e) => setCapacityInput(e.target.value)}
                        className="w-16 px-2 py-1 text-sm font-normal border border-gray-300 rounded focus:outline-none focus:border-indigo-500 inline-block"
                        min="1"
                        autoFocus
                      />
                    ) : (
                      currentCapacity
                    )}
                  </span>
                  
                  {isEditingCapacity ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleUpdateCapacity}
                        disabled={isSavingCapacity}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded font-medium transition disabled:opacity-50"
                      >
                        {isSavingCapacity ? '...' : 'Save'}
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingCapacity(false);
                          setCapacityInput(currentCapacity.toString());
                        }}
                        className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2 py-1 rounded font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingCapacity(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline transition"
                    >
                      Edit Limit
                    </button>
                  )}
                </div>
              )}
            </div>

            {batchMessage.text && (
              <div className={`p-4 rounded-lg mb-6 flex items-center text-sm font-medium ${batchMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {batchMessage.type === 'success' ? <FiCheckCircle className="mr-2 text-lg" /> : <FiAlertCircle className="mr-2 text-lg" />}
                {batchMessage.text}
              </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full md:w-1/2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Batch to Manage</label>
                <select 
                  value={manageBatchId}
                  onChange={(e) => setManageBatchId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition"
                >
                  <option value="">-- Choose a Batch --</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleCreateBatch}
                disabled={isCreatingBatch}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-50 whitespace-nowrap"
              >
                {isCreatingBatch ? 'Creating...' : '+ Create New Batch'}
              </button>
            </div>

            {manageBatchId && (
              <>
                <div className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Student to Batch</label>
                    <select 
                      value={assignStudentId}
                      onChange={(e) => setAssignStudentId(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none transition"
                    >
                      <option value="">-- Select a student to assign --</option>
                      {students.filter(s => !batchStudents.find(bs => bs._id === s._id)).map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} ({student.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <button 
                      onClick={handleAssignToBatch}
                      disabled={isManagingBatch || !assignStudentId || isBatchFull}
                      className="bg-[#5551FF] hover:bg-[#433fd8] text-white font-bold py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isManagingBatch ? 'Processing...' : 'Assign to Batch'}
                    </button>
                    {isBatchFull && (
                      <span className="text-xs text-red-500 font-bold mt-1 text-center flex items-center justify-center">
                        <FiAlertCircle className="mr-1" /> Batch is Full
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="relative w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                      placeholder="Search students by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batchStudents.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                            No students are currently assigned to this batch.
                          </td>
                        </tr>
                      ) : (
                        batchStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleRemoveFromBatch(student._id)}
                                disabled={isManagingBatch}
                                className="text-red-600 hover:text-red-900 flex items-center justify-end w-full disabled:opacity-50 transition"
                              >
                                <FiTrash2 className="mr-1" /> Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* Removal Confirmation Modal */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center text-red-600 mb-4">
              <FiAlertCircle className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Remove Student</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this student from the batch? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStudentToRemove(null)}
                disabled={isManagingBatch}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoval}
                disabled={isManagingBatch}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center"
              >
                {isManagingBatch ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}