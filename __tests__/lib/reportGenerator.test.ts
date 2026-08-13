import { generateCSVReport, generatePrintableHTML, StudentReportData } from '@/lib/reportGenerator';

describe('reportGenerator utility', () => {
  const sampleReportData: StudentReportData = {
    studentName: 'Alice Smith',
    studentId: 'STU-12345',
    semester: 'Semester 01',
    gpa: '3.9',
    cgpa: '3.85',
    generatedAt: 'August 13, 2026',
    grades: [
      {
        id: 1,
        title: 'Animation Studies I',
        code: 'WISE-25.1F/CO',
        assignments: '18 / 20',
        courseWork: '26 / 30',
        finalExam: '34 / 40',
        attendance: '10 / 10',
        grade: 'A',
      },
    ],
  };

  it('generates valid CSV string with headers and escaped fields', () => {
    const csv = generateCSVReport(sampleReportData);
    expect(csv).toContain('WISE EAST UNIVERSITY - ACADEMIC GRADE REPORT');
    expect(csv).toContain('Student: Alice Smith');
    expect(csv).toContain('Semester GPA: 3.9');
    expect(csv).toContain('"Animation Studies I"');
    expect(csv).toContain('"WISE-25.1F/CO"');
    expect(csv).toContain('"A"');
  });

  it('generates styled HTML transcript containing report metadata', () => {
    const html = generatePrintableHTML(sampleReportData);
    expect(html).toContain('WISE EAST UNIVERSITY');
    expect(html).toContain('OFFICIAL ACADEMIC TRANSCRIPT & PERFORMANCE REPORT');
    expect(html).toContain('Alice Smith');
    expect(html).toContain('Animation Studies I');
    expect(html).toContain('3.9');
  });
});
