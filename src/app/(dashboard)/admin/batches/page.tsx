"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/shared/AdminSidebar";
import DashHeader from "@/components/shared/DashHeader";
import { FiPlus, FiUsers, FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Batch {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  maxCapacity: number;
  students: Student[];
  createdAt: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Form States
  const [formData, setFormData] = useState({ name: "", description: "", maxCapacity: 50, isActive: true });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch batches
      const batchesRes = await fetch("/api/admin/batches");
      if (batchesRes.ok) {
        const data = await batchesRes.json();
        setBatches(data.batches || []);
      }

      // Fetch all students using the newly refactored Users API
      const usersRes = await fetch("/api/admin/users?role=student&limit=1000");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setStudents(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (studentId: string) => {
    setSelectedStudents((prev) => 
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ text: "Batch name is required.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          maxCapacity: formData.maxCapacity,
          isActive: formData.isActive,
          students: selectedStudents,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Batch created successfully!", type: "success" });
        setIsModalOpen(false);
        setFormData({ name: "", description: "", maxCapacity: 50, isActive: true });
        setSelectedStudents([]);
        fetchData(); // Refresh the list
      } else {
        setMessage({ text: data.message || "Failed to create batch.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An unexpected error occurred.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashHeader />
        
        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-widest">Batches & Cohorts</h1>
              <p className="text-[#A0AEC0] font-medium mt-1">Organize students into logical groups for bulk enrollment</p>
            </div>
            <button 
              onClick={() => {
                setMessage({ text: "", type: "" });
                setIsModalOpen(true);
              }}
              className="mt-4 md:mt-0 bg-[#5551FF] hover:bg-[#433fd8] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center transition duration-300"
            >
              <FiPlus className="mr-2 text-lg" />
              Create New Batch
            </button>
          </div>

          {/* Messages */}
          {message.text && !isModalOpen && (
            <div className={`p-4 rounded-lg mb-6 flex items-center text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? <FiCheckCircle className="mr-2 text-lg" /> : <FiAlertCircle className="mr-2 text-lg" />}
              {message.text}
            </div>
          )}

          {/* Batches Grid */}
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 font-medium">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
              <FiUsers className="mx-auto text-4xl text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-700">No batches found</h3>
              <p className="text-gray-500 mt-2">Create your first batch to start organizing students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => (
                <div key={batch._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      {batch.name}
                      {batch.isActive && (
                        <span className="ml-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                      )}
                    </h2>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
                      <FiUsers className="mr-1.5" />
                      {batch.students?.length || 0} / {batch.maxCapacity || 50}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm flex-1 mb-4 line-clamp-3">
                    {batch.description || <span className="italic text-gray-400">No description provided</span>}
                  </p>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-medium">
                    <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Create New Batch</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {message.text && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <form id="create-batch-form" onSubmit={handleCreateBatch} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Batch Name <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Fall 2026 - CS Students"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#5551FF] outline-none transition" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (Optional)</label>
                  <textarea 
                    rows={2}
                    placeholder="Brief details about this cohort..."
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#5551FF] outline-none transition resize-none" 
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Max Capacity</label>
                    <input 
                      type="number"
                      min="1"
                      value={formData.maxCapacity} 
                      onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 50})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#5551FF] outline-none transition" 
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-white transition h-[46px]">
                      <input 
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 text-[#5551FF] border-gray-300 rounded focus:ring-[#5551FF]"
                      />
                      <span className="ml-2 text-sm font-bold text-gray-700">Set as Active Batch</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-gray-700">Select Students</label>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {selectedStudents.length} Selected
                    </span>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-gray-50 p-2 space-y-1 custom-scrollbar">
                    {students.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No students available.</div>
                    ) : (
                      students.map(student => (
                        <label key={student._id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition">
                          <input 
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleCheckboxChange(student._id)}
                            className="w-4 h-4 text-[#5551FF] border-gray-300 rounded focus:ring-[#5551FF]"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-bold text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                form="create-batch-form"
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#5551FF] hover:bg-[#433fd8] text-white text-sm font-bold rounded-lg shadow-sm transition disabled:opacity-70 flex items-center"
              >
                {isSubmitting ? 'Creating...' : 'Create Batch'}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}
