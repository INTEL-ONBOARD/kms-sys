import Link from 'next/link';
import Image from 'next/image'; 

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-sm border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Please log in to your student portal</p>
          </div>

          <form className="space-y-6">
            {/* Email / Student ID Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email / Student ID
              </label>
              <input 
                type="text" 
                placeholder="Enter your email or ID"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input 
                type="password" 
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-black focus:border-black outline-none transition"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="mr-2 cursor-pointer" />
                <label htmlFor="remember" className="text-gray-600 cursor-pointer">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-black font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              className="w-full bg-black text-white py-3 rounded text-sm font-bold tracking-wide hover:bg-gray-800 transition duration-300 mt-4"
            >
              LOG IN
            </button>
          </form>

        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden md:flex w-1/2 relative bg-slate-900 items-center justify-center flex-col text-center px-12">
        <div className="relative z-20 text-white flex flex-col items-center">
          
          {/* Logo added exactly where you marked */}
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
            Access your courses, grades, and campus resources. <br/> Education is not just preparation for life — it is life itself.
          </p>
        </div>
      </div>

    </div>
  );
}