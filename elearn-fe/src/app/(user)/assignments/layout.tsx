import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import React from "react";

export const metadata = {
  title: "Assignments Platform",
  description: "Assignments Platform",
};

export default function AssignmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <section
          className="dashboard__area section-pb-120"
          style={{ padding: "0px", paddingBottom: "30px" }}
        >
          <div className="container">
            <div className="row">
              <div className="col-lg-12">{children}</div>
            </div>
          </div>
        </section>
      </main>
      <FooterOne />
    </Wrapper>
  );
}
