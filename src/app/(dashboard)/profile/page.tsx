"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiCalendar, FiCheck, FiLoader, FiArrowLeft } from 'react-icons/fi';
import Header from '@/components/shared/DashHeader';

interface UserProfile {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  isMobileVerified?: boolean;
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

  const [otpState, setOtpState] = useState<'unverified' | 'sent' | 'verified'>('unverified');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setOtpState(data.user.isMobileVerified ? 'verified' : 'unverified');
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

  const handleSendOTP = async () => {
    if (!formData.phone) {
      setError("Please save your phone number first.");
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/profile/send-mobile-otp', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP sent successfully.');
        setOtpState('sent');
        setCountdown(60);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/profile/verify-mobile-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Mobile number verified successfully.');
        setOtpState('verified');
        setUser({ ...user!, isMobileVerified: true });
        setOtp('');
      } else {
        setError(data.message || 'Failed to verify OTP.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isStudent = user?.role === 'student';
  const isLecturer = user?.role === 'lecturer' || user?.role === 'instructor';

  const dashboardHref =
    user?.role === 'admin' || user?.role === 'super_admin'
      ? '/admin'
      : user?.role === 'lecturer' || user?.role === 'instructor'
      ? '/lecturer'
      : '/student';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <FiLoader className="animate-spin text-[#5A67D8] text-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans text-gray-800">
      <Header />

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 pt-6 max-w-7xl mx-auto w-full">
        {/* Top Header with Return to Dashboard Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl font-extrabold text-[#2D3748] tracking-wide">User Profile</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage personal information, contact details, and account settings</p>
          </div>
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#5A67D8] font-bold text-xs rounded-xl border border-indigo-100 shadow-xs transition hover:shadow-sm"
          >
            <FiArrowLeft className="text-sm" />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {(message || error) && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
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

              {/* Mobile Number Verification */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full">
                  <h3 className="text-lg font-bold text-[#2D3748] mb-6">Mobile Number Verification</h3>

                  <div className="flex flex-col space-y-6">
                    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-[#F7FAFC]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#4A5568]">Current Mobile Number</span>
                        <span className="text-md text-[#2D3748] mt-1">{formData.phone || 'Not set'}</span>
                      </div>
                      <div>
                        {otpState === 'verified' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                            Verified <FiCheck className="inline ml-1" />
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                            Not Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {otpState === 'unverified' && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSendOTP}
                          disabled={saving || !formData.phone}
                          className="px-6 py-2.5 bg-[#5A67D8] hover:bg-[#434190] text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-70 flex items-center gap-2"
                        >
                          {saving && <FiLoader className="animate-spin" />}
                          Send OTP
                        </button>
                      </div>
                    )}

                    {otpState === 'sent' && (
                      <div className="flex flex-col space-y-4">
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-[#A0AEC0] mb-1.5 uppercase tracking-wide">Enter 6-digit OTP</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full md:w-1/2 bg-[#F7FAFC] border border-gray-200 text-[#4A5568] font-medium text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:border-[#5A67D8] focus:ring-1 focus:ring-[#5A67D8] transition tracking-widest"
                            placeholder="------"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={handleVerifyOTP}
                            disabled={saving || otp.length !== 6}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-70 flex items-center gap-2"
                          >
                            {saving && <FiLoader className="animate-spin" />}
                            Verify
                          </button>
                          
                          <button
                            onClick={handleSendOTP}
                            disabled={saving || countdown > 0}
                            className="text-sm font-bold text-[#5A67D8] hover:text-[#434190] transition disabled:text-gray-400"
                          >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
