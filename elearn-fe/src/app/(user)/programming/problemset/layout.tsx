import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programming Problemset | ELearn Platform",
  description:
    "Explore our comprehensive collection of programming challenges and coding problems. Practice with problems ranging from beginner to expert level across multiple programming languages.",
  keywords: [
    "programming problems",
    "coding challenges",
    "algorithms",
    "data structures",
    "competitive programming",
    "coding practice",
    "programming exercises",
    "C++",
    "Python",
    "Java",
    "coding contest",
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
    title: "Programming Problemset | ELearn Platform",
    description:
      "Explore our comprehensive collection of programming challenges and coding problems. Practice with problems ranging from beginner to expert level.",
    url: "/programming",
    siteName: "ELearn Platform",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Programming Problemset | ELearn Platform",
    description:
      "Explore our comprehensive collection of programming challenges and coding problems.",
    creator: "@elearn",
  },
  alternates: {
    canonical: "/programming",
  },
};

export default function ProblemsetLayout({
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
            "@type": "CollectionPage",
            name: "Programming Problemset",
            description:
              "Collection of programming challenges and coding problems for skill development",
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/programming`,
            mainEntity: {
              "@type": "ItemList",
              name: "Programming Problems",
              description: "Curated list of programming challenges",
              itemListElement: [],
            },
            provider: {
              "@type": "Organization",
              name: "ELearn Platform",
              url: process.env.NEXT_PUBLIC_SITE_URL,
            },
          }),
        }}
      />
      {children}
    </>
  );
}
