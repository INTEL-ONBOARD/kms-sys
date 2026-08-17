import { LOGO_BASE64 } from './logoBase64';
import { REALISTIC_SEAL_BASE64 } from './sealBase64';

export interface CourseGradeItem {
  id: number | string;
  title: string;
  code: string;
  assignments: string;
  courseWork: string;
  finalExam: string;
  attendance: string;
  grade: string;
  semester?: string;
}

export interface StudentReportData {
  studentName?: string;
  studentId?: string;
  semester?: string;
  gpa: string | number;
  cgpa: string | number;
  grades: CourseGradeItem[];
  generatedAt?: string;
}

/**
 * Generates a clean CSV string representation of the student's grade report.
 */
export function generateCSVReport(reportData: StudentReportData): string {
  const dateStr = reportData.generatedAt || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const lines: string[] = [];

  // Metadata headers
  lines.push(`"WISE EAST UNIVERSITY - ACADEMIC GRADE REPORT"`);
  lines.push(`"Date Generated: ${dateStr}"`);
  lines.push(`"Student: ${reportData.studentName || 'Authenticated Student'}"`);
  lines.push(`"Semester Filter: ${reportData.semester || 'All Semesters'}"`);
  lines.push(`"Semester GPA: ${reportData.gpa}","Cumulative CGPA: ${reportData.cgpa}"`);
  lines.push(``); // Empty row separator

  // Table headers
  lines.push(`"Course Title","Course Code","Assignments","Course Work 1","Final Exam","Attendance","Grade"`);

  // Data rows
  reportData.grades.forEach((item) => {
    const cleanTitle = item.title.replace(/"/g, '""');
    const cleanCode = item.code.replace(/"/g, '""');
    const cleanAssignments = item.assignments.replace(/"/g, '""');
    const cleanCourseWork = item.courseWork.replace(/"/g, '""');
    const cleanFinalExam = item.finalExam.replace(/"/g, '""');
    const cleanAttendance = item.attendance.replace(/"/g, '""');
    const cleanGrade = item.grade.replace(/"/g, '""');

    lines.push(
      `"${cleanTitle}","${cleanCode}","${cleanAssignments}","${cleanCourseWork}","${cleanFinalExam}","${cleanAttendance}","${cleanGrade}"`
    );
  });

  return lines.join('\r\n');
}

/**
 * Helper to trigger client browser download of text/CSV content.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates styled HTML document string suitable for printing as a formal 1-page PDF grade transcript with standalone circular realistic seal.
 */
export function generatePrintableHTML(reportData: StudentReportData): string {
  const dateStr = reportData.generatedAt || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const docId = `WEU-TR-${Math.floor(100000 + Math.random() * 900000)}`;

  const getGradeBadgeStyle = (grade: string) => {
    const clean = grade.trim().toUpperCase();
    if (clean.startsWith('A')) {
      return 'background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0;';
    } else if (clean.startsWith('B')) {
      return 'background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A;';
    } else if (clean.startsWith('C')) {
      return 'background-color: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;';
    }
    return 'background-color: #F3F4F6; color: #374151; border: 1px solid #E5E7EB;';
  };

  const rowsHtml = reportData.grades.map((course, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFB'};">
      <td style="padding: 9px 14px; border-bottom: 1px solid #E5E7EB;">
        <div style="font-weight: 700; color: #1E293B; font-size: 13px;">${course.title}</div>
        <div style="font-size: 10px; font-weight: 600; color: #64748B; margin-top: 2px; font-family: monospace;">CODE: ${course.code}</div>
      </td>
      <td style="padding: 9px 14px; border-bottom: 1px solid #E5E7EB; text-align: center; font-weight: 600; color: #334155; font-size: 12px;">${course.assignments}</td>
      <td style="padding: 9px 14px; border-bottom: 1px solid #E5E7EB; text-align: center; font-weight: 600; color: #334155; font-size: 12px;">${course.courseWork}</td>
      <td style="padding: 9px 14px; border-bottom: 1px solid #E5E7EB; text-align: center; font-weight: 600; color: #334155; font-size: 12px;">${course.finalExam}</td>
      <td style="padding: 9px 14px; border-bottom: 1px solid #E5E7EB; text-align: center; font-weight: 600; color: #334155; font-size: 12px;">${course.attendance}</td>
      <td style="padding: 9px 14px; border-bottom: 1px solid #E5E7EB; text-align: center;">
        <span style="display: inline-block; padding: 3px 12px; border-radius: 16px; font-weight: 800; font-size: 12px; ${getGradeBadgeStyle(course.grade)}">
          ${course.grade}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Official Academic Transcript - Wise East University</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .transcript-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 24px 36px !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0F172A;
          background-color: #F1F5F9;
          margin: 0;
          padding: 20px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .transcript-card {
          max-width: 860px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 14px;
          padding: 28px 40px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }
        /* Top Decorative Gold Line */
        .gold-banner {
          height: 5px;
          background: linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #D97706 100%);
          margin: -28px -40px 22px -40px;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0F172A;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .brand-box {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-img {
          height: 46px;
          width: auto;
          object-fit: contain;
        }
        .university-name {
          font-family: 'Cinzel', Georgia, serif;
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: 0.8px;
          line-height: 1.1;
        }
        .doc-subtitle {
          font-size: 11px;
          font-weight: 700;
          color: #D97706;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-top: 3px;
        }
        .official-tag {
          display: inline-block;
          padding: 5px 12px;
          background-color: #0F172A;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border-radius: 5px;
          border-left: 3.5px solid #F59E0B;
        }
        .action-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }
        .print-btn {
          background-color: #0F172A;
          color: #FFFFFF;
          border: none;
          padding: 9px 18px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 5px -1px rgba(15, 23, 42, 0.15);
        }
        .print-btn:hover {
          background-color: #1E293B;
        }
        /* Metadata Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px 20px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 18px;
          margin-bottom: 18px;
        }
        .info-cell {
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed #E2E8F0;
          padding-bottom: 4px;
        }
        .info-label {
          color: #64748B;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10.5px;
          letter-spacing: 0.4px;
        }
        .info-val {
          color: #0F172A;
          font-weight: 700;
        }
        /* Summary Metrics */
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .metric-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
        }
        .metric-card.gpa { border-top: 3.5px solid #D97706; }
        .metric-card.cgpa { border-top: 3.5px solid #059669; }
        .metric-card.standing { border-top: 3.5px solid #2563EB; }
        .metric-card.date { border-top: 3.5px solid #64748B; }

        .metric-val {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
        }
        .metric-lbl {
          font-size: 9.5px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-top: 3px;
        }
        /* Table Styling */
        .table-title {
          font-size: 12px;
          font-weight: 800;
          color: #0F172A;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .table-title::before {
          content: "";
          display: inline-block;
          width: 3.5px;
          height: 14px;
          background: #D97706;
          border-radius: 2px;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        th {
          background-color: #0F172A;
          color: #FFFFFF;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 700;
          padding: 9px 14px;
          text-align: left;
        }
        th.center { text-align: center; }

        /* Authorization & Signatures */
        .auth-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1.5px solid #E2E8F0;
          padding-top: 14px;
          margin-bottom: 14px;
        }
        .sig-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sig-line {
          width: 190px;
          border-bottom: 1.5px solid #0F172A;
          margin-bottom: 6px;
          height: 30px;
          display: flex;
          align-items: flex-end;
        }
        .sig-name {
          font-size: 12px;
          font-weight: 800;
          color: #0F172A;
        }
        .sig-title {
          font-size: 10.5px;
          color: #64748B;
          font-weight: 600;
        }
        .seal-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .seal-img {
          height: 90px;
          width: 90px;
          object-fit: cover;
          border-radius: 50%;
          mix-blend-mode: multiply;
          clip-path: circle(48% at 50% 50%);
        }
        .footer-note {
          text-align: center;
          font-size: 9px;
          color: #94A3B8;
          border-top: 1px solid #F1F5F9;
          padding-top: 10px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>

      <div class="transcript-card">
        <div>
          <div class="gold-banner"></div>

          <div class="action-bar no-print">
            <button class="print-btn" onclick="window.print()">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"></path>
                <path d="M6 14h12v8H6z"></path>
              </svg>
              Print / Save Official 1-Page PDF
            </button>
          </div>

          <div class="header-section">
            <div class="brand-box">
              <img src="${LOGO_BASE64}" alt="Wise East University Logo" class="logo-img" />
              <div>
                <div class="university-name">WISE EAST UNIVERSITY</div>
                <div class="doc-subtitle">OFFICIAL ACADEMIC TRANSCRIPT & PERFORMANCE REPORT</div>
              </div>
            </div>
            <div class="status-badge">
              <div class="official-tag">VERIFIED TRANSCRIPT</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-cell">
              <span class="info-label">Student Name:</span>
              <span class="info-val">${reportData.studentName || 'Authenticated Student'}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Document ID:</span>
              <span class="info-val" style="font-family: monospace;">${docId}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Semester / Term:</span>
              <span class="info-val">${reportData.semester || 'All Semesters'}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Issue Date:</span>
              <span class="info-val">${dateStr}</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Institution:</span>
              <span class="info-val">Wise East University Main Campus</span>
            </div>
            <div class="info-cell">
              <span class="info-label">Record Status:</span>
              <span class="info-val" style="color: #059669;">Active / Accredited</span>
            </div>
          </div>

          <div class="metrics-row">
            <div class="metric-card gpa">
              <div class="metric-val" style="color: #D97706;">${reportData.gpa}</div>
              <div class="metric-lbl">Semester GPA</div>
            </div>
            <div class="metric-card cgpa">
              <div class="metric-val" style="color: #059669;">${reportData.cgpa}</div>
              <div class="metric-lbl">Cumulative CGPA</div>
            </div>
            <div class="metric-card standing">
              <div class="metric-val" style="font-size: 16px; padding-top: 3px; color: #2563EB;">GOOD STANDING</div>
              <div class="metric-lbl">Academic Status</div>
            </div>
            <div class="metric-card date">
              <div class="metric-val" style="font-size: 16px; padding-top: 3px; color: #64748B;">${reportData.grades.length} / ${reportData.grades.length}</div>
              <div class="metric-lbl">Courses Evaluated</div>
            </div>
          </div>

          <div class="table-title">Course Evaluation Breakdown</div>

          <table>
            <thead>
              <tr>
                <th>Course Details</th>
                <th class="center">Assignments</th>
                <th class="center">Coursework</th>
                <th class="center">Final Exam</th>
                <th class="center">Attendance</th>
                <th class="center">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div>
          <div class="auth-section">
            <div class="sig-block">
              <div class="sig-line">
                <span style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #0F172A;">R. Vance</span>
              </div>
              <div class="sig-name">Dr. Robert Vance</div>
              <div class="sig-title">Registrar of Academic Records</div>
            </div>

            <div class="seal-container">
              <img src="${REALISTIC_SEAL_BASE64}" alt="Official University Registry Seal" class="seal-img" />
            </div>
          </div>

          <div class="footer-note">
            This document is an official academic transcript generated directly by the Wise East University KMS Portal. 
            Any unauthorized alteration or reproduction of this record is strictly prohibited. Document Ref: ${docId}
          </div>
        </div>
      </div>

    </body>
    </html>
  `;
}

/**
 * Triggers PDF printing by opening the styled HTML transcript in a popup print view.
 */
export function triggerPDFPrint(reportData: StudentReportData): void {
  if (typeof window === 'undefined') return;

  const htmlContent = generatePrintableHTML(reportData);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  }
}
