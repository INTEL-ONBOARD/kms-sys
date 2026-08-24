"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

// Define the TypeScript types for our data models
type User = {
  _id: string;
  name: string;
};

type Course = {
  _id: string;
  title: string;
};

type Enrollment = {
  _id: string;
  userId: User;
  courseId: Course;
  progress: number;
};

export default function EnrollmentsPage() {
  // State variables to hold data and UI status
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [message, setMessage] = useState("");

  // Function to fetch all required data concurrently from the APIs
  const loadData = async () => {
    const [usersRes, coursesRes, enrollmentsRes] = await Promise.all([
      fetch("/api/users", { cache: "no-store" }),
      fetch("/api/courses", { cache: "no-store" }),
      fetch("/api/enrollments", { cache: "no-store" })
    ]);

    const usersData = (await usersRes.json()) as User[];
    const coursesData = (await coursesRes.json()) as Course[];
    const enrollmentsData = (await enrollmentsRes.json()) as Enrollment[];

    setUsers(usersData);
    setCourses(coursesData);
    setEnrollments(enrollmentsData);
  };

  // Fetch data when the component mounts
  useEffect(() => {
    // Wrap the data fetching logic inside an async function to prevent ESLint cascading render warnings
    const fetchEnrollments = async () => {
      try {
        await loadData();
      } catch {
        setMessage("Failed to load enrollment data");
      }
    };

    // Execute the async function
    fetchEnrollments();
  }, []);

  // Handle the creation of a new enrollment
  const createEnrollment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    // Validate that both a user and a course are selected
    if (!selectedUserId || !selectedCourseId) {
      setMessage("Select user and course");
      return;
    }

    try {
      // Call the API to create the enrollment
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, courseId: selectedCourseId })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setMessage(data.message ?? "Failed to enroll");
        return;
      }

      setMessage("Enrollment created");
      
      // Reload the data to reflect the newly created enrollment
      await loadData();
    } catch {
      // Handle network or unexpected errors cleanly
      setMessage("An unexpected error occurred during enrollment.");
    }
  };

  return (
    <main className="container stack">
      {/* Header Section */}
      <section className="panel row" style={{ justifyContent: "space-between" }}>
        <h1>Enrollments</h1>
        <div className="row">
          <Link href="/">Courses</Link>
          <Link href="/users">Users</Link>
        </div>
      </section>

      {/* Form Section to Enroll a User */}
      <section className="panel stack">
        <h2>Enroll User to Course</h2>
        <form className="stack" onSubmit={createEnrollment}>
          
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>

          <button type="submit">Enroll</button>
        </form>
        {message ? <small>{message}</small> : null}
      </section>

      {/* List Section to Display Enrollments */}
      <section className="panel stack">
        <h2>Enrollment List</h2>
        {enrollments.length === 0 ? (
          <p>No enrollments yet.</p>
        ) : (
          enrollments.map((enrollment) => (
            <article key={enrollment._id} className="panel stack">
              <strong>{enrollment.userId?.name ?? "Unknown User"}</strong>
              <span>Course: {enrollment.courseId?.title ?? "Unknown Course"}</span>
              <span>Progress: {enrollment.progress}%</span>
            </article>
          ))
        )}
      </section>

    </main>
  );
}