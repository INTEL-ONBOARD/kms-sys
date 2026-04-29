"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

// Define the User type structure
type User = {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
};

// Initial state for the user creation form
const initialForm = {
  name: "",
  email: "",
  role: "student"
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  // Function to fetch users from the API
  const loadUsers = async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    const data = (await res.json()) as User[];
    setUsers(data);
  };

  // Fetch users when the component mounts
  useEffect(() => {
    // Wrap the async call in a function to avoid ESLint cascading render warnings
    const fetchUsers = async () => {
      try {
        await loadUsers();
      } catch {
        setMessage("Failed to load users");
      }
    };

    // Execute the async function
    fetchUsers();
  }, []);

  // Handle the creation of a new user
  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      
      if (!res.ok) {
        setMessage(data.message ?? "Failed to create user");
        return;
      }

      // Reset form and reload user list upon success
      setForm(initialForm);
      await loadUsers();
    } catch {
      setMessage("An unexpected error occurred while creating the user.");
    }
  };

  return (
    <main className="container stack">
      <section className="panel row" style={{ justifyContent: "space-between" }}>
        <h1>Users</h1>
        <Link href="/">Back to Courses</Link>
      </section>

      <section className="panel stack">
        <h2>Create User</h2>
        <form className="stack" onSubmit={createUser}>
          <input
            placeholder="Name"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <select
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                role: e.target.value as "student" | "instructor" | "admin"
              }))
            }
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Create User</button>
        </form>
        {message ? <small>{message}</small> : null}
      </section>

      <section className="panel stack">
        <h2>User List</h2>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          users.map((user) => (
            <article key={user._id} className="panel stack">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span>Role: {user.role}</span>
            </article>
          ))
        )}
      </section>
    </main>
  );
}