"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiCalendar, FiCheck, FiLoader } from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

interface UserProfile {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  dob?: string;
  address?: string;
  parentName?: string;
  parentContact?: string;
  department?: string;
  expertise?: string;
  qualification?: string;
  linkedin?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            dob: data.user.dob || '',
            address: data.user.address || '',
            parentName: data.user.parentName || '',
            parentContact: data.user.parentContact || '',
            department: data.user.department || '',
            expertise: data.user.expertise || '',
            qualification: data.user.qualification || '',
            linkedin: data.user.linkedin || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully.');
        setUser(data.user);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setMessage('');
    setError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password updated successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isStudent = user?.role === 'student';
  const isLecturer = user?.role === 'lecturer' || user?.role === 'instructor';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <FiLoader className="animate-spin text-[#5A67D8] text-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#2D3748] uppercase tracking-widest">Profile</h1>
          </div>

          {(message || error) && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
              {error || message}
            </div>
          )}

          {/* Top Section: Profile Info and Edit Profile */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* Left Column: Profile Card */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-[#F7FAFC] shadow-sm">
                  <Image src="/propic.png" alt={user?.name || 'User'} width={128} height={128} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold text-[#2D3748]">{user?.name || 'User'}</h2>
                <p className="text-sm font-semibold text-[#A0AEC0] mb-6 capitalize">{user?.role?.replace('_', ' ') || 'Student'}</p>
                <div className="w-full text-left space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[#4A5568]">Status :</span>
                    <span className={`font-medium capitalize ${user?.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{user?.status || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-[#4A5568]">Joined :</span>
                    <span className="font-medium text-[#718096]">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Edit Profile Form */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full flex flex-col">
                <h3 className="text-lg font-bold text-[#2D3748] mb-6">Edit Profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-1">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange}
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Email</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange}
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">First Name</label>
                    <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange}
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange}
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange}
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                  </div>
                  <div className="flex flex-col relative">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Date of Birth</label>
                    <div className="relative">
                      <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange}
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Home Address</label>
                    <input type="text" name="address" value={formData.address || ''} onChange={handleChange}
                      className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                  </div>

                  {/* Student Specific Fields */}
                  {isStudent && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Parent/Guardian Name</label>
                        <input type="text" name="parentName" value={formData.parentName || ''} onChange={handleChange}
                          className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Parent Contact</label>
                        <input type="text" name="parentContact" value={formData.parentContact || ''} onChange={handleChange}
                          className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      </div>
                    </>
                  )}

                  {/* Lecturer Specific Fields */}
                  {isLecturer && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Department</label>
                        <input type="text" name="department" value={formData.department || ''} onChange={handleChange}
                          className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Area of Expertise</label>
                        <input type="text" name="expertise" value={formData.expertise || ''} onChange={handleChange}
                          className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Qualification</label>
                        <input type="text" name="qualification" value={formData.qualification || ''} onChange={handleChange}
                          className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">LinkedIn</label>
                        <input type="text" name="linkedin" value={formData.linkedin || ''} onChange={handleChange}
                          className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-4 mt-auto pt-4">
                  <button onClick={() => setFormData({
                    name: user?.name || '',
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    dob: user?.dob || '',
                    address: user?.address || '',
                    parentName: user?.parentName || '',
                    parentContact: user?.parentContact || '',
                    department: user?.department || '',
                    expertise: user?.expertise || '',
                    qualification: user?.qualification || '',
                    linkedin: user?.linkedin || '',
                  })} className="px-8 py-2.5 bg-white border border-[#A0AEC0] text-[#4A5568] font-bold text-sm rounded-lg hover:bg-gray-50 transition">
                    Discard
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-10 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-sm rounded-lg shadow-md shadow-indigo-100 transition disabled:opacity-70 flex items-center gap-2">
                    {saving && <FiLoader className="animate-spin" />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Account Settings */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#2D3748] mb-6">Account Settings</h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Change Password */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full">
                  <h3 className="text-lg font-bold text-[#2D3748] mb-6">Change Password</h3>

                  <div className="space-y-5 mb-8">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Current Password</label>
                      <input type="password" value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                    </div>
                    <div className="flex flex-col relative">
                      <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">New Password</label>
                      <input type="password" value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                      <input type="password" value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition" />
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-auto">
                    <button onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                      className="flex-1 py-2.5 bg-white border border-[#A0AEC0] text-[#4A5568] font-bold text-sm rounded-lg hover:bg-gray-50 transition">
                      Discard
                    </button>
                    <button onClick={handlePasswordChange} disabled={saving}
                      className="flex-1 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-sm rounded-lg shadow-md shadow-indigo-100 transition disabled:opacity-70 flex items-center justify-center gap-2">
                      {saving && <FiLoader className="animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full">
                  <h3 className="text-lg font-bold text-[#2D3748] mb-6">Notifications</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Assignment deadlines",
                      "Dashboard Alerts",
                      "Grade Updates",
                      "Timetable Reminders",
                      "Announcements",
                      "Exam Reminders",
                      "Messages From Lectures"
                    ].map((item, index) => (
                      <label key={index} className="flex items-center p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <div className="relative flex items-center justify-center w-5 h-5 mr-4 border-2 border-[#5A67D8] bg-[#5A67D8] rounded">
                          <FiCheck className="text-white text-sm" />
                          <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" defaultChecked />
                        </div>
                        <span className="text-sm font-bold text-[#4A5568]">{item}</span>
                      </label>
                    ))}

                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <span className="text-sm font-bold text-[#4A5568]">Two-Factor Authentication</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A67D8]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
