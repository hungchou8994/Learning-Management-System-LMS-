import { Metadata } from "next";
import Wrapper from "@/layouts/Wrapper";
import HeaderOne from "@/layouts/headers/HeaderOne";
import FooterOne from "@/layouts/footers/FooterOne";

export const metadata: Metadata = {
  title: "Programming Hub - Interactive Coding Platform | ELearn",
  description:
    "Master programming with interactive problems, real-time feedback, and comprehensive progress tracking. Practice C++, Python, Java and more with our advanced coding platform.",
  keywords:
    "programming, coding, algorithms, data structures, c++, python, java, competitive programming, practice problems, code challenge",
  authors: [{ name: "ELearn Platform" }],
  creator: "ELearn Platform",
  publisher: "ELearn Platform",
  openGraph: {
    title: "Programming Hub - Interactive Coding Platform",
    description:
      "Enhance your coding skills with interactive problems, real-time feedback, and comprehensive progress tracking. From beginner to expert level.",
    url: "/programming",
    siteName: "ELearn Platform",
    images: [
      {
        url: "/assets/img/logo/programming-hub.png",
        width: 1200,
        height: 630,
        alt: "Programming Hub - Interactive Coding Platform",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Programming Hub - Interactive Coding Platform",
    description:
      "Master programming with interactive problems and real-time feedback",
    images: ["/assets/img/logo/programming-hub.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export default function ProgrammingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Wrapper>
      <HeaderOne />
      {children}
      <FooterOne />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Programming Hub",
            applicationCategory: "EducationalApplication",
            description:
              "Interactive programming platform with coding challenges, real-time feedback, and progress tracking for developers of all skill levels.",
            url: "/programming",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
            featureList: [
              "Interactive coding problems",
              "Multiple programming languages support",
              "Real-time code execution",
              "Progress tracking and analytics",
              "Community features",
              "Achievement system",
            ],
            screenshot: "/assets/img/logo/programming-hub.png",
            provider: {
              "@type": "Organization",
              name: "ELearn Platform",
              url: "/",
            },
          }),
        }}
      />
    </Wrapper>
  );
}
