"use client"; 

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function SignupPage() {
  // --- State Management for Stepper & Form ---
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'student' | 'lecturer' | ''>('');
  
  const [formData, setFormData] = useState({
    // Common Fields
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Student Specific Fields
    dob: '',
    address: '',
    parentName: '',
    parentContact: '',
    
    // Lecturer Specific Fields
    department: '',
    expertise: '',
    qualification: '',
    linkedin: '',
    otp: ''
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // Handle dynamic input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculate max date for Date of Birth (must be at least 15 years old)
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 15);
  const maxDobString = maxDobDate.toISOString().split('T')[0];

  // Move to the next step
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    // Move from Step 2 to Step 3
    if (step === 2) {
      const errors: Record<string, string> = {};
      const nameRegex = /^[A-Za-z\s\-]+$/;
      const phoneRegex = /^[0-9]{10}$/;

      if (!nameRegex.test(formData.firstName)) errors.firstName = "Must contain only letters, spaces, and hyphens.";
      if (!nameRegex.test(formData.lastName)) errors.lastName = "Must contain only letters, spaces, and hyphens.";
      if (!phoneRegex.test(formData.phone)) errors.phone = "Must be exactly 10 digits.";

      if (role === 'student') {
        if (!nameRegex.test(formData.parentName)) errors.parentName = "Must contain only letters, spaces, and hyphens.";
        if (!phoneRegex.test(formData.parentContact)) errors.parentContact = "Must be exactly 10 digits.";
        
        if (formData.dob) {
           const selectedDate = new Date(formData.dob);
           const minAgeDate = new Date();
           minAgeDate.setFullYear(minAgeDate.getFullYear() - 15);
           
           if (selectedDate > minAgeDate) {
             errors.dob = "You must be at least 15 years old to register.";
           }
        }
      }

      if (role === 'lecturer') {
        const expertiseRegex = /^[^0-9]*$/;
        if (!expertiseRegex.test(formData.expertise)) {
          errors.expertise = "Numbers are not allowed.";
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setStep(3);
    } 
    // Final Form Submission (Step 3)
    else if (step === 3) {
      const errors: Record<string, string> = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address.";
      }
      if (!passwordRegex.test(formData.password)) {
        errors.password = "Password must be at least 8 characters long, contain at least 1 uppercase letter and 1 number.";
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
      if (formData.otp.length !== 6) {
        errors.otp = "Please enter the 6-digit OTP sent to your email.";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      submitRegistration();
    }
  };

  // Move to the previous step
  const handleBack = () => {
    setError('');
    setFieldErrors({});
    setStep(step - 1);
  };

  // Handle Role Selection (Step 1)
  const selectRole = (selectedRole: 'student' | 'lecturer') => {
    setRole(selectedRole);
    setFieldErrors({});
    setStep(2); // Automatically move to step 2 after selecting a role
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setFieldErrors({ ...fieldErrors, email: "Please enter your email first." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFieldErrors({ ...fieldErrors, email: "Please enter a valid email address." });
      return;
    }
    
    setSendingOtp(true);
    setError('');
    setOtpMessage('');
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setOtpSent(true);
      setOtpMessage('OTP sent to your email!');
      setTimeout(() => setOtpMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  // Final API Submission Logic
  const submitRegistration = async () => {
    setLoading(true);

    try {
      // Prepare the payload to match the backend expectation
      const payload = {
        role,
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}` // Combine for backward compatibility
      };
      
      // Make the actual fetch call to our backend signup route
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Check if the backend returned an error (e.g., email already exists)
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Show success message returned by backend API
      setSuccess(data.message || 'Account created successfully!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 font-sans">
      
      {/* Left Side - Dynamic Registration Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-xl w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-black mb-2">Create an Account</h2>
            <p className="text-gray-500 text-sm">
              Step {step} of 3: {step === 1 ? 'Select Role' : step === 2 ? 'Personal Details' : 'Account Setup'}
            </p>
            
            {/* Stepper Progress Bar */}
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 flex">
              <div className={`h-1.5 bg-black rounded-full transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
            </div>
          </div>

          {/* Alert Messages */}
          {error && <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded border border-red-100">{error}</div>}
          {success && (
            <div className="mb-6 text-center space-y-4">
              <div className="text-green-700 text-sm font-medium bg-green-50 p-4 rounded-lg border border-green-200">
                {success}
              </div>
              <Link href="/login" className="inline-block w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition">
                Go to Login
              </Link>
            </div>
          )}

          {/* ================= STEP 1: ROLE SELECTION ================= */}
          {step === 1 && (
            <div className="space-y-4 mt-8">
              <button 
                onClick={() => selectRole('student')}
                className="w-full flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-black hover:bg-gray-50 transition duration-200 group text-left"
              >
                <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition"><img src="/student.png" alt="student" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">I am a Student</h3>
                  <p className="text-sm text-gray-500">I want to learn, access courses, and view my grades.</p>
                </div>
              </button>

              <button 
                onClick={() => selectRole('lecturer')}
                className="w-full flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-black hover:bg-gray-50 transition duration-200 group text-left"
              >
                <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition"><img src="/lecturer.png" alt="lecturer" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">I am a Lecturer</h3>
                  <p className="text-sm text-gray-500">I want to manage courses, grade assignments, and teach.</p>
                </div>
              </button>
            </div>
          )}

          {/* ================= STEP 2 & 3: FORMS ================= */}
          {(step === 2 || step === 3) && !success && (
            <form onSubmit={handleNext} className="space-y-5">
              
              {/* STEP 2: PERSONAL DETAILS */}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Common Fields for Step 2 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                    {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                    {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" maxLength={10} value={formData.phone} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                    {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                  </div>

                  {/* Student Specific Fields */}
                  {role === 'student' && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" name="dob" max={maxDobString} value={formData.dob} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.dob ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                        {fieldErrors.dob && <p className="text-red-500 text-xs mt-1">{fieldErrors.dob}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Home Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Parent/Guardian Name</label>
                        <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.parentName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                        {fieldErrors.parentName && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Contact</label>
                        <input type="tel" name="parentContact" maxLength={10} value={formData.parentContact} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.parentContact ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                        {fieldErrors.parentContact && <p className="text-red-500 text-xs mt-1">{fieldErrors.parentContact}</p>}
                      </div>
                    </>
                  )}

                  {/* Lecturer Specific Fields */}
                  {role === 'lecturer' && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Department / Faculty</label>
                        <select name="department" value={formData.department} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition bg-white">
                          <option value="">Select Department</option>
                          <option value="computing">Computing & IT</option>
                          <option value="business">Business & Management</option>
                          <option value="engineering">Engineering</option>
                          <option value="science">Applied Sciences</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Area of Expertise</label>
                        <input type="text" name="expertise" placeholder="e.g. Data Science" value={formData.expertise} onChange={handleChange} required className={`w-full px-4 py-3 border ${fieldErrors.expertise ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                        {fieldErrors.expertise && <p className="text-red-500 text-xs mt-1">{fieldErrors.expertise}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Highest Qualification</label>
                        <select name="qualification" value={formData.qualification} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition bg-white">
                          <option value="">Select Qualification</option>
                          <option value="bsc">Bachelor&apos;s Degree</option>
                          <option value="msc">Master&apos;s Degree</option>
                          <option value="phd">Ph.D.</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">LinkedIn Profile (Optional)</label>
                        <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition" />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: ACCOUNT SETUP */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                      <div className="flex-1">
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your email" className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                      </div>
                      <button type="button" onClick={handleSendOtp} disabled={sendingOtp} className="whitespace-nowrap bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700 transition duration-300 disabled:opacity-70">
                        {sendingOtp ? 'SENDING...' : 'SEND OTP'}
                      </button>
                    </div>
                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                    {otpMessage && <p className="text-green-600 text-sm mt-2 font-medium">{otpMessage}</p>}
                  </div>
                  
                  {otpSent && (
                    <div className="animate-fade-in-up">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">6-Digit OTP</label>
                      <input type="text" name="otp" maxLength={6} value={formData.otp} onChange={handleChange} required placeholder="Enter OTP from your email" className={`w-full px-4 py-3 border ${fieldErrors.otp ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition text-center tracking-widest text-xl`} />
                      {fieldErrors.otp && <p className="text-red-500 text-xs mt-1">{fieldErrors.otp}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="Create a strong password" className={`w-full px-4 py-3 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={8} placeholder="Confirm your password" className={`w-full px-4 py-3 border ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded outline-none transition`} />
                    {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                </div>
              )}

              {/* Navigation Buttons for Step 2 & 3 */}
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={handleBack} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-200 transition duration-300">
                  BACK
                </button>
                <button type="submit" disabled={loading || (step === 3 && !otpSent)} className="w-2/3 bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
                  {step === 2 ? 'CONTINUE' : loading ? 'CREATING...' : 'COMPLETE SIGNUP'}
                </button>
              </div>
            </form>
          )}

          {/* Login Link placed nicely below the form area */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-black font-bold hover:underline">
              Log In
            </Link>
          </div>

        </div>
      </div>

      {/* Right Side - Branding (Unchanged) */}
      <div className="hidden md:flex w-1/2 relative bg-slate-900 items-center justify-center flex-col text-center px-12">
        <div className="relative z-20 text-white flex flex-col items-center">
          <div className="mb-8">
            <Image 
              src="/logo2.png" 
              alt="Wise East University Logo"
              width={100} 
              height={100}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4 uppercase tracking-wider">Wise East University</h1>
          <p className="text-lg font-light text-gray-300">
            Access your courses, grades, and campus resources. <br/> 
            {/* Escaped the dash entity to resolve ESLint warning */}
            Education is not just preparation for life &mdash; it is life itself.
          </p>
        </div>
      </div>

    </div>
  );
}