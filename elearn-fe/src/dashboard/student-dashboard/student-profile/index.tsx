import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import DashboardBannerTwo from "@/dashboard/dashboard-common/DashboardBannerTwo";
import DashboardSidebarTwo from "@/dashboard/dashboard-common/DashboardSidebarTwo";
import bg_img from "@/assets/img/bg/dashboard_bg.jpg";
import InstructorProfileContent from "@/dashboard/instructor-dashboard/profile/InstructorProfileContent";
import Image from "next/image";

const StudentProfile = () => {
  return (
    <>
      <HeaderOne />
      <main className="main-area fix">
        <section className="dashboard__area section-pb-120">
          <div className="dashboard__bg">
            <Image src={bg_img} alt="" />
          </div>
          <div className="container">
            <DashboardBannerTwo />
            <div className="dashboard__inner-wrap">
              <div className="row">
                <DashboardSidebarTwo />
                <InstructorProfileContent style={true} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterOne />
    </>
  );
};

export default StudentProfile;
