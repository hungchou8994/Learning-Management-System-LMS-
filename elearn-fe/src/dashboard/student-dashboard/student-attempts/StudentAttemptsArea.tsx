"use client";

import DashboardBannerTwo from "@/dashboard/dashboard-common/DashboardBannerTwo";
import DashboardSidebarTwo from "@/dashboard/dashboard-common/DashboardSidebarTwo";
import StudentAttemptsContent from "./StudentAttemptsContent";
import Image from "next/image";
import bg_img from "@/assets/img/bg/dashboard_bg.jpg";

const StudentAttemptsArea = () => {
  return (
    <section className="dashboard__area section-pb-120">
      <div className="dashboard__bg">
        <Image src={bg_img} alt="" />
      </div>
      <div className="container">
        <DashboardBannerTwo />
        <div className="dashboard__inner-wrap">
          <div className="row">
            <DashboardSidebarTwo />
            <StudentAttemptsContent />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentAttemptsArea;
