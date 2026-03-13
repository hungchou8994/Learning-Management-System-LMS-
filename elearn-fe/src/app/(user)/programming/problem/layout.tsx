import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Programming Problem | ELearn Platform",
    default: "Programming Problem | ELearn Platform",
  },
  description:
    "Solve programming challenges and improve your coding skills with our interactive problem-solving platform. Get detailed explanations, test cases, and code templates.",
  keywords: [
    "programming problem",
    "coding challenge",
    "algorithm",
    "data structure",
    "problem solving",
    "competitive programming",
    "coding practice",
    "programming exercise",
    "code solution",
    "debug code",
    "test cases",
  ].join(", "),
  authors: [{ name: "ELearn Platform" }],
  creator: "ELearn Platform",
  publisher: "ELearn Platform",
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
  openGraph: {
    title: "Programming Problem | ELearn Platform",
    description:
      "Solve programming challenges and improve your coding skills with our interactive problem-solving platform.",
    type: "website",
    siteName: "ELearn Platform",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Programming Problem | ELearn Platform",
    description: "Solve programming challenges and improve your coding skills.",
    creator: "@elearn",
  },
};

export default function ProblemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Problem",
            name: "Programming Problem",
            description:
              "Interactive programming challenge with test cases and solutions",
            provider: {
              "@type": "Organization",
              name: "ELearn Platform",
              url: process.env.NEXT_PUBLIC_SITE_URL,
            },
            educationalLevel: "Beginner to Expert",
            learningResourceType: "Problem Set",
            programmingLanguage: ["C++", "Python", "Java"],
          }),
        }}
      />
      {children}
    </>
  );
}
