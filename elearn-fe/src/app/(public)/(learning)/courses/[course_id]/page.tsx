import BreadcrumbTwo from "@/components/common/breadcrumb/BreadcrumbTwo";
import CourseDetailsArea from "@/components/courses/course-details/CourseDetailsArea";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import { cookies } from "next/headers";

export const metadata = {
  title:
    "Course Details SkillGro - Online Courses & Education React Next js Template",
};

// import CourseDetails from "@/components/courses/course-details";

async function getCourse(courseId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/course/${courseId}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (data.status === "success") {
      return data.data;
    }
    throw new Error(data.message || "Failed to fetch course");
  } catch (error) {
    console.error("Error fetching course:", error);
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

const page = async ({ params }: { params: { course_id: string } }) => {
  const course = await getCourse(params.course_id);
  const isEnrolled = await checkEnrollment(params.course_id);

  // If user is enrolled, unlock all lessons
  if (isEnrolled && course.sessions) {
    course.sessions = course.sessions.map((session: any) => ({
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
        <BreadcrumbTwo title={course.name} sub_title="Courses" />
        <CourseDetailsArea course={course} isEnrolled={isEnrolled} />
      </main>
      <FooterOne />
    </Wrapper>
  );
};

export default page;
