import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('GradesPage component', () => {
  it('renders Grades page title and Download Report button', () => {
    render(<GradesPage />);
    expect(screen.getByRole('heading', { level: 1, name: /GRADES/i })).toBeInTheDocument();
    expect(screen.getByText(/Download Report/i)).toBeInTheDocument();
  });

  it('opens download options modal when Download Report button is clicked', () => {
    render(<GradesPage />);
    const downloadBtn = screen.getByRole('button', { name: /Download Report/i });
    fireEvent.click(downloadBtn);

    expect(screen.getByText(/Download Grade Report/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV Spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF Academic Transcript/i)).toBeInTheDocument();
  });

  it('filters grade entries in table when selecting semester', () => {
    render(<GradesPage />);
    const selects = screen.getAllByRole('combobox');
    const semesterSelect = selects[0]; // First select is Semester

    fireEvent.change(semesterSelect, { target: { value: 'Semester 01' } });
    
    // Check that table cell for Semester 01 course exists and Semester 02 course table cell does not
    expect(screen.getByRole('cell', { name: /Animation Studies I/i })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: /Principles of Script Writing/i })).not.toBeInTheDocument();
  });
});
