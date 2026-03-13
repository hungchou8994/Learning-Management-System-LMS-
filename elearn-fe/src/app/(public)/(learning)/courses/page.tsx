import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne";
import CourseArea from "@/components/courses/course/CourseArea";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
  title: "Course SkillGro - Online Courses & Education React Next js Template",
};
const page = () => {
  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <BreadcrumbOne title="All Courses" sub_title="Courses" />
        <CourseArea />
      </main>
      <FooterOne />
    </Wrapper>
  );
};

export default page;
