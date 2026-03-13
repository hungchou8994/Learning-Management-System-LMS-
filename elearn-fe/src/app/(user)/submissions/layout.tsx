import type { Metadata } from "next";
import Wrapper from "@/layouts/Wrapper";
import HeaderOne from "@/layouts/headers/HeaderOne";
import FooterOne from "@/layouts/footers/FooterOne";

export const metadata: Metadata = {
  title: "My Submissions | ELearn",
  description:
    "Review your submission history, track results, and analyze your coding progress.",
};

export default function SubmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Wrapper>
      <HeaderOne />
      {children}
      <FooterOne />
    </Wrapper>
  );
}

