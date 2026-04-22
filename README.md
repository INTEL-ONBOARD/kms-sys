# LMS System (Next.js + MongoDB)

Basic full-stack LMS starter using Next.js App Router and MongoDB (Mongoose).

## Included Structure

- `app/` pages and API routes
- `app/api/courses` for course CRUD
- `app/api/users` for user CRUD (create/list)
- `app/api/enrollments` for enrollment create/list
- `lib/db.ts` shared MongoDB connection
- `models/` Mongoose schemas (`User`, `Course`, `Enrollment`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and update Mongo URI:

```bash
cp .env.example .env
```

3. Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`

## Notes

- This is a minimal structure with basic forms and API endpoints.
- No auth/permissions added yet (easy to extend with NextAuth/JWT later).
