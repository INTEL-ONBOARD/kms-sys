export interface GradeBoundary {
  grade: string;
  minScore: number;
  gpaPoint: number;
  description?: string;
  color?: string;
}

export const DEFAULT_GRADING_SCALE: GradeBoundary[] = [
  { grade: "A", minScore: 80, gpaPoint: 4.0, description: "Distinction / First Class", color: "emerald" },
  { grade: "B", minScore: 70, gpaPoint: 3.0, description: "Very Good / Upper Second", color: "blue" },
  { grade: "C", minScore: 60, gpaPoint: 2.0, description: "Good / Lower Second", color: "amber" },
  { grade: "S", minScore: 50, gpaPoint: 1.0, description: "Pass", color: "purple" },
  { grade: "F", minScore: 0, gpaPoint: 0.0, description: "Fail", color: "rose" },
];

export const GRADING_SCALE_PRESETS: { [key: string]: { name: string; description: string; scale: GradeBoundary[] } } = {
  standard: {
    name: "Standard Academic (80+ A)",
    description: "Traditional university scale with 80% cutoff for Distinction",
    scale: DEFAULT_GRADING_SCALE,
  },
  lenient: {
    name: "Lenient Pass (70+ A)",
    description: "Flexible cutoff giving A grade for all scores 70% and above",
    scale: [
      { grade: "A", minScore: 70, gpaPoint: 4.0, description: "Distinction (70%+)", color: "emerald" },
      { grade: "B", minScore: 60, gpaPoint: 3.0, description: "Very Good (60-69%)", color: "blue" },
      { grade: "C", minScore: 50, gpaPoint: 2.0, description: "Credit Pass (50-59%)", color: "amber" },
      { grade: "S", minScore: 40, gpaPoint: 1.0, description: "Simple Pass (40-49%)", color: "purple" },
      { grade: "F", minScore: 0, gpaPoint: 0.0, description: "Fail (<40%)", color: "rose" },
    ],
  },
  detailed: {
    name: "Standard 9-Tier (A+, A, A-, B+...)",
    description: "Fine-grained +/- tier breakdown with corresponding GPA points",
    scale: [
      { grade: "A+", minScore: 90, gpaPoint: 4.0, description: "High Distinction", color: "emerald" },
      { grade: "A", minScore: 85, gpaPoint: 4.0, description: "Distinction", color: "emerald" },
      { grade: "A-", minScore: 80, gpaPoint: 3.7, description: "Excellent", color: "emerald" },
      { grade: "B+", minScore: 75, gpaPoint: 3.3, description: "Very Good", color: "blue" },
      { grade: "B", minScore: 70, gpaPoint: 3.0, description: "Good", color: "blue" },
      { grade: "B-", minScore: 65, gpaPoint: 2.7, description: "Above Average", color: "blue" },
      { grade: "C+", minScore: 60, gpaPoint: 2.3, description: "Satisfactory", color: "amber" },
      { grade: "C", minScore: 55, gpaPoint: 2.0, description: "Pass", color: "amber" },
      { grade: "S", minScore: 45, gpaPoint: 1.0, description: "Conditional Pass", color: "purple" },
      { grade: "F", minScore: 0, gpaPoint: 0.0, description: "Fail", color: "rose" },
    ],
  },
};

export function getGradeBadgeColors(colorName?: string, grade?: string) {
  if (colorName === "emerald" || grade?.startsWith("A")) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      pill: "bg-emerald-100 text-emerald-800",
      badgeClass: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    };
  }
  if (colorName === "blue" || grade?.startsWith("B")) {
    return {
      text: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
      pill: "bg-blue-100 text-blue-800",
      badgeClass: "text-blue-700 bg-blue-50 border border-blue-200",
    };
  }
  if (colorName === "amber" || grade?.startsWith("C")) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      pill: "bg-amber-100 text-amber-800",
      badgeClass: "text-amber-700 bg-amber-50 border border-amber-200",
    };
  }
  if (colorName === "purple" || grade === "S" || grade?.startsWith("D")) {
    return {
      text: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      pill: "bg-purple-100 text-purple-800",
      badgeClass: "text-purple-700 bg-purple-50 border border-purple-200",
    };
  }
  return {
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    pill: "bg-rose-100 text-rose-800",
    badgeClass: "text-rose-700 bg-rose-50 border border-rose-200",
  };
}

/**
 * Resolves a letter grade, GPA point, and UI color for a given score based on the course's grading scale.
 */
export function resolveGradeFromScale(
  score: number,
  scale?: GradeBoundary[]
): {
  grade: string;
  gpaPoint: number;
  description: string;
  colorName: string;
  badgeClass: string;
  isPassing: boolean;
} {
  const activeScale = Array.isArray(scale) && scale.length > 0 ? scale : DEFAULT_GRADING_SCALE;

  // Sort descending by minScore to ensure accurate threshold matching
  const sortedScale = [...activeScale].sort((a, b) => (b.minScore ?? 0) - (a.minScore ?? 0));

  const validScore = Math.max(0, Math.min(100, Math.round(score)));

  const matched = sortedScale.find((b) => validScore >= (b.minScore ?? 0)) || sortedScale[sortedScale.length - 1];

  const grade = matched?.grade || "F";
  const gpaPoint = typeof matched?.gpaPoint === "number" ? matched.gpaPoint : 0.0;
  const description = matched?.description || "";
  const colorName = matched?.color || (grade.startsWith("A") ? "emerald" : grade.startsWith("B") ? "blue" : grade.startsWith("C") ? "amber" : grade === "S" ? "purple" : "rose");
  const colors = getGradeBadgeColors(colorName, grade);
  const isPassing = gpaPoint > 0 && !grade.toUpperCase().includes("F");

  return {
    grade,
    gpaPoint,
    description,
    colorName,
    badgeClass: colors.badgeClass,
    isPassing,
  };
}
