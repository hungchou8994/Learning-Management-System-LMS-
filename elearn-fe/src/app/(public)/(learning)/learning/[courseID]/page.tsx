import FooterOne from "@/layouts/footers/FooterOne";
import LessonArea from "@/components/courses/lesson/LessonArea";
import Wrapper from "@/layouts/Wrapper";
import HeaderOne from "@/layouts/headers/HeaderOne";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface PageProps {
  params: {
    courseID: string;
  };
}

export const metadata = {
  title: "Lesson SkillGro - Online Course Learning Platform",
};

async function getLessonData(courseId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/course/${courseId}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course data");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching lesson data:", error);
    throw error;
  }
}

async function checkEnrollment(courseId: string) {
  try {
    const cookieStore = cookies();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/enroll`,
      {
        headers: {
          Cookie: cookieStore.toString(),
        },
        cache: "no-store",
      }
    );
    const data = await response.json();
    if (data.status === "success") {
      return data.data.some((course: any) => course.id === courseId);
    }
    return false;
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return false;
  }
}

const LessonPage = async ({ params }: PageProps) => {
  const courseData = await getLessonData(params.courseID);
  const isEnrolled = await checkEnrollment(params.courseID);

  // If user is enrolled, unlock all lessons
  if (isEnrolled && courseData.sessions) {
    courseData.sessions = courseData.sessions.map((session: any) => ({
      ...session,
      lessons: session.lessons.map((lesson: any) => ({
        ...lesson,
        locked: false,
      })),
    }));
  }

  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <LessonArea courseData={courseData} isEnrolled={isEnrolled} />
      </main>
      <FooterOne />
    </Wrapper>
  );
};

export default LessonPage;
