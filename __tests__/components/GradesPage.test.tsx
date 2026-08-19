import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GradesPage from '@/app/grades/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/grades',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Student User', email: 'student@example.com' } },
    status: 'authenticated',
  }),
  signOut: jest.fn(),
}));

const mockGradesData = {
  studentName: "Student User",
  studentId: "12345",
  gpa: "3.8",
  cgpa: "3.8",
  availableSemesters: ["Semester 01", "Semester 02"],
  availableCourses: ["Animation Studies I", "Principles of Script Writing"],
  allGrades: [
    {
      id: "1",
      title: "Animation Studies I",
      code: "WISE-ANIM101",
      assignments: "18 / 20",
      courseWork: "26 / 30",
      finalExam: "35 / 40",
      attendance: "10 / 10",
      grade: "A",
      gradeColor: "text-green-500 bg-green-50",
      semester: "Semester 01",
    },
    {
      id: "2",
      title: "Principles of Script Writing",
      code: "WISE-SCRP102",
      assignments: "16 / 20",
      courseWork: "24 / 30",
      finalExam: "32 / 40",
      attendance: "09 / 10",
      grade: "B +",
      gradeColor: "text-orange-400 bg-orange-50",
      semester: "Semester 02",
    },
  ],
};

describe('GradesPage component', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGradesData),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Grades page title and Download Report button', async () => {
    render(<GradesPage />);
    expect(screen.getByRole('heading', { level: 1, name: /GRADES/i })).toBeInTheDocument();
    expect(screen.getByText(/Download Report/i)).toBeInTheDocument();
  });

  it('opens download options modal when Download Report button is clicked', async () => {
    render(<GradesPage />);
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: /Animation Studies I/i })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download Report/i });
    fireEvent.click(downloadBtn);

    expect(screen.getByText(/Download Grade Report/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV Spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF Academic Transcript/i)).toBeInTheDocument();
  });

  it('filters grade entries in table when selecting semester', async () => {
    render(<GradesPage />);
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: /Animation Studies I/i })).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const semesterSelect = selects[0]; // First select is Semester

    fireEvent.change(semesterSelect, { target: { value: 'Semester 01' } });

    expect(screen.getByRole('cell', { name: /Animation Studies I/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: /Principles of Script Writing/i })).not.toBeInTheDocument();
  });
});
