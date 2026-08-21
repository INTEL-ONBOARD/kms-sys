import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GradesPage from '@/app/grades/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/grades',
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(''),
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
  reportApproved: true,
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
      allAssessmentsCompleted: true,
      totalPoints: 89,
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
      allAssessmentsCompleted: false,
      totalPoints: 81,
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

  it('renders Grades page title and Export Report button', async () => {
    render(<GradesPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Course Grades & Academic Performance/i })).toBeInTheDocument();
    expect(screen.getByText(/Export Report/i)).toBeInTheDocument();
  });

  it('opens download options modal when Export Report button is clicked and report is approved', async () => {
    render(<GradesPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Animation Studies I/i })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Export Report/i });
    fireEvent.click(downloadBtn);

    expect(screen.getByText(/Export Academic Performance Report/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV Spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/Printable PDF Transcript/i)).toBeInTheDocument();
  });

  it('shows admin approval modal when Export Report is clicked and report is not approved', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...mockGradesData, reportApproved: false }),
      })
    ) as jest.Mock;

    render(<GradesPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Animation Studies I/i })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Export Report/i });
    fireEvent.click(downloadBtn);

    expect(screen.getByText(/Admin Approval Required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request Admin Approval/i })).toBeInTheDocument();
  });

  it('filters grade entries when selecting semester', async () => {
    render(<GradesPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Animation Studies I/i })).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const semesterSelect = selects[0]; // First select is Semester

    fireEvent.change(semesterSelect, { target: { value: 'Semester 01' } });

    expect(screen.getByRole('heading', { level: 3, name: /Animation Studies I/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /Principles of Script Writing/i })).not.toBeInTheDocument();
  });
});
