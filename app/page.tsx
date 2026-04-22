"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Course = {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  published: boolean;
  createdAt: string;
};

type CreateCourseForm = {
  title: string;
  instructor: string;
  description: string;
};

const initialForm: CreateCourseForm = {
  title: "",
  instructor: "",
  description: ""
};

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CreateCourseForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadCourses = async () => {
    const res = await fetch("/api/courses", { cache: "no-store" });
    const data = (await res.json()) as Course[];
    setCourses(data);
  };

  useEffect(() => {
    loadCourses().catch(() => setMessage("Failed to load courses"));
  }, []);

  const createCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "Failed to create course");
        return;
      }

      setForm(initialForm);
      setMessage("Course created");
      await loadCourses();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setMessage("Failed to delete course");
        return;
      }
      await loadCourses();
    } catch {
      setMessage("Failed to delete course");
    }
  };

  return (
    <main className="container stack">
      <section className="panel stack">
        <h1>Basic LMS</h1>
        <p>Minimal Next.js + MongoDB LMS structure.</p>
        <div className="row">
          <Link href="/users">Users</Link>
          <Link href="/enrollments">Enrollments</Link>
        </div>
      </section>

      <section className="panel stack">
        <h2>Create Course</h2>
        <form className="stack" onSubmit={createCourse}>
          <input
            placeholder="Course title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <input
            placeholder="Instructor name"
            value={form.instructor}
            onChange={(e) => setForm((prev) => ({ ...prev, instructor: e.target.value }))}
            required
          />
          <textarea
            placeholder="Course description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
        {message ? <small>{message}</small> : null}
      </section>

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Courses</h2>
          <button className="secondary" onClick={() => loadCourses()}>
            Refresh
          </button>
        </div>

        {courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          courses.map((course) => (
            <article key={course._id} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{course.title}</strong>
                <button className="secondary" onClick={() => deleteCourse(course._id)}>
                  Delete
                </button>
              </div>
              <span>Instructor: {course.instructor}</span>
              <p>{course.description || "No description"}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
