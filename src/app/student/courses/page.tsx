"use client";

import { useState, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/DashHeader';

// Define the interface for the fetched course data from the backend
interface Course {
  _id: string;
  title: string;
  category?: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch courses from the database when the component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/student/my-courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        } else {
          console.error("Failed to fetch courses");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Helper function to keep your awesome dynamic banner designs 
  // It cycles through the styles based on the index of the course array
  const getBannerStyle = (index: number, title: string) => {
    const styles = [
      { bg: "bg-[#4AA59C]", text: <div className="text-center font-black text-xl md:text-2xl leading-tight text-white uppercase tracking-wider">{title}</div> },
      { bg: "bg-[#3B5446]", text: <div className="text-center text-white font-serif italic text-lg md:text-xl"><span className="font-sans font-bold not-italic text-xl md:text-2xl block mb-1">Learn</span>{title}</div> },
      { bg: "bg-[#71A5E8]", text: <div className="text-center font-black text-xl md:text-3xl text-[#F9D658] uppercase tracking-wide">{title}</div> },
      { bg: "bg-[#F3EBE0]", text: <div className="text-center font-serif text-2xl md:text-4xl text-[#3A453C] tracking-tight">{title}</div> },
      { bg: "bg-[#111111]", text: <div className="text-center font-bold text-xl md:text-2xl text-white font-sans">{title}</div> },
      { bg: "bg-white border-b border-gray-200", text: <div className="text-center"><div className="font-serif italic text-xs md:text-sm text-gray-500 mb-1">Course Module</div><div className="font-black text-xl md:text-3xl text-black tracking-tighter uppercase">{title}</div></div> },
      { bg: "bg-[#E61F5B]", text: <div className="text-center"><div className="font-black text-xl md:text-3xl text-[#F9D658] uppercase shadow-sm tracking-widest">{title}</div></div> },
      { bg: "bg-[#F9F9FB] border-b border-gray-200", text: <div className="text-center font-serif tracking-[0.2em] text-[#3A3F58] font-bold text-lg md:text-2xl uppercase">{title}</div> },
      { bg: "bg-[#FCF5EB]", text: <div className="text-center font-black text-lg md:text-2xl text-[#CE662B] uppercase"><span className="text-[#344F89] font-serif italic normal-case text-md md:text-xl block mb-1">Enrolled</span>{title}</div> }
    ];
    return styles[index % styles.length];
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex font-sans text-gray-800">
      
      {/* Rendering the separated Left Sidebar Component */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Rendering the separated Top Header Component */}
        <Header />

        {/* COURSES SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-6">
          
          {/* Section Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#2D3748] uppercase tracking-wide">
              Courses Overview
            </h1>
            <p className="text-sm text-[#A0AEC0] mt-1">Manage and view all your enrolled modules</p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
            
            {/* Specific Course Search */}
            <div className="relative w-full md:w-[400px]">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Courses" 
                className="w-full bg-white text-sm text-gray-700 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#5A67D8] border border-gray-100 shadow-sm transition"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex space-x-4 w-full md:w-auto">
              {/* All Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50">
                  <option>All</option>
                  <option>Active</option>
                  <option>Completed</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-100 shadow-sm text-sm font-semibold text-[#4A5568] py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A67D8] cursor-pointer transition hover:bg-gray-50">
                  <option>Sort by</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>A-Z</option>
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* DYNAMIC COURSES GRID */}
          {isLoading ? (
            <div className="text-center py-20 text-[#A0AEC0] font-bold animate-pulse">
              Loading your courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-700">No Courses Enrolled</h3>
              <p className="text-sm text-gray-500 mt-2">You have not been assigned to any courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course, index) => {
                const bannerDesign = getBannerStyle(index, course.title);

                return (
                  <div key={course._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group flex flex-col h-64">
                    
                    {/* Course Banner (Dynamic) */}
                    <div className={`flex-1 ${bannerDesign.bg} flex flex-col justify-center items-center p-6 relative overflow-hidden`}>
                      {bannerDesign.text}
                    </div>
                    
                    {/* Course Details */}
                    <div className="p-5 bg-white border-t border-gray-50">
                      <h3 className="text-sm font-bold text-[#2D3748] leading-snug group-hover:text-[#5A67D8] transition truncate">
                        {course.title}
                      </h3>
                      <p className="text-xs font-medium text-[#A0AEC0] mt-1.5 uppercase tracking-widest">
                        WISE-{course._id.substring(0, 4)} / {course.category || 'CO'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && courses.length > 0 && (
            <div className="flex justify-end mt-8 text-sm font-medium text-[#A0AEC0]">
               <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                  <button className="hover:text-[#5A67D8] transition"><FiChevronLeft className="text-lg" /></button>
                  <span className="text-[#5A67D8] font-bold">1</span>
                  <button className="hover:text-[#5A67D8] transition"><FiChevronRight className="text-lg" /></button>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}