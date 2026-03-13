"use client";

import DashboardBannerTwo from "@/dashboard/dashboard-common/DashboardBannerTwo";
import DashboardSidebarTwo from "@/dashboard/dashboard-common/DashboardSidebarTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import Image from "next/image";
import bg_img from "@/assets/img/bg/dashboard_bg.jpg";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <section className="dashboard__area section-pb-120">
          <div className="dashboard__bg">
            <Image
              src={bg_img}
              alt="Dashboard background"
              style={{ width: "100%" }}
            />
          </div>
          <div className="container">
            <DashboardBannerTwo />
            <div className="dashboard__inner-wrap">
              <div className="row">
                <DashboardSidebarTwo />
                <div className="col-lg-9">{children}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterOne />
    </Wrapper>
  );
}
