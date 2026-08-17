/**
 * Clean, single-color monochromatic university registrar seal SVG for Wise East University transcripts.
 */
export function generateCertificateSealSVG(docId: string): string {
  return `
<svg width="110" height="110" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Circular Text Arc Paths -->
    <path id="topCertArc" d="M 20, 90 A 70,70 0 1,1 160, 90" />
    <path id="bottomCertArc" d="M 156, 90 A 66,66 0 0,1 24, 90" />
  </defs>

  <!-- Outer Double Circle Border -->
  <circle cx="90" cy="90" r="86" fill="#F8FAFC" stroke="#0F172A" stroke-width="2.5" />
  <circle cx="90" cy="90" r="80" fill="none" stroke="#0F172A" stroke-width="1" />

  <!-- Inner Circle Border -->
  <circle cx="90" cy="90" r="54" fill="none" stroke="#0F172A" stroke-width="1.5" />

  <!-- Top Arc Text: WISE EAST UNIVERSITY -->
  <text font-family="'Cinzel', Georgia, serif" font-size="11.5" font-weight="700" fill="#0F172A" letter-spacing="1">
    <textPath href="#topCertArc" startOffset="50%" text-anchor="middle">
      WISE EAST UNIVERSITY
    </textPath>
  </text>

  <!-- Bottom Arc Text: OFFICIAL REGISTRY SEAL -->
  <text font-family="'Inter', sans-serif" font-size="9" font-weight="700" fill="#334155" letter-spacing="0.8">
    <textPath href="#bottomCertArc" startOffset="50%" text-anchor="middle">
      • OFFICIAL REGISTRY SEAL •
    </textPath>
  </text>

  <!-- Core Content Inside Inner Circle -->
  <!-- Top Star Accent -->
  <text x="90" y="62" font-size="8" fill="#0F172A" text-anchor="middle">★</text>

  <!-- VERIFIED & ACCREDITED -->
  <text x="90" y="75" font-family="'Inter', sans-serif" font-size="8" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="0.6">
    VERIFIED &amp;
  </text>
  <text x="90" y="86" font-family="'Inter', sans-serif" font-size="8" font-weight="800" fill="#0F172A" text-anchor="middle" letter-spacing="0.6">
    ACCREDITED
  </text>

  <!-- Divider Line -->
  <line x1="64" y1="93" x2="116" y2="93" stroke="#0F172A" stroke-width="1" />

  <!-- SEC REF Code -->
  <text x="90" y="105" font-family="monospace" font-size="7.5" font-weight="700" fill="#475569" text-anchor="middle">
    SEC REF: ${docId}
  </text>
</svg>
`;
}
