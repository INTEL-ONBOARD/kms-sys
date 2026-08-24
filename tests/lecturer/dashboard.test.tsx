import { render, screen } from "@testing-library/react";
import StatCard from "@/components/lecturer/StatCard";
import CourseCardLecturer from "@/components/lecturer/CourseCardLecturer";
import { FiBookOpen } from "react-icons/fi";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        name: "Dr. Alan Turing",
        role: "lecturer",
        department: "Computer Science",
      },
    },
    status: "authenticated",
  }),
}));

describe("Lecturer Dashboard Components", () => {
  it("renders StatCard component with correct label and initial rendering", () => {
    render(
      <StatCard
        icon={FiBookOpen}
        label="Active Courses"
        value={4}
        color="blue"
        trend="+1 active"
      />
    );

    expect(screen.getByText("Active Courses")).toBeInTheDocument();
    expect(screen.getByText("+1 active")).toBeInTheDocument();
  });

  it("renders CourseCardLecturer component with course details", () => {
    const mockCourse = {
      _id: "c123456789",
      title: "Advanced Data Structures",
      category: "Computer Science",
      studentCount: 25,
      avgCompletion: 82,
      assignmentCount: 6,
    };

    render(<CourseCardLecturer course={mockCourse} />);

    expect(screen.getByText("Advanced Data Structures")).toBeInTheDocument();
    expect(screen.getByText("25 Students")).toBeInTheDocument();
    expect(screen.getByText("6 Tasks")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
  });
});
