import React from "react";
import type { Metadata } from "next";
import { getProblemById } from "@/lib/api";
import { notFound } from "next/navigation";

interface Props {
  params: { problemId: string };
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: { problemId: string };
}): Promise<Metadata> {
  try {
    const response = await getProblemById(params.problemId);

    if (!response.success || !response.data) {
      return {
        title: "Problem Not Found | ELearn Platform",
        description: "The requested programming problem could not be found.",
      };
    }

    const problem = response.data;
    const rankNames = {
      S: "Master",
      A: "Expert",
      B: "Advanced",
      C: "Intermediate",
      D: "Beginner",
    };

    const difficultyLevel =
      rankNames[problem.rank as keyof typeof rankNames] || "Unknown";
    const languageList = problem.supportedLanguages.join(", ");

    return {
      title: `${problem.title} | ${problem.rank} Rank | Programming Problem`,
      description: `${problem.description.substring(
        0,
        160
      )}... | Difficulty: ${difficultyLevel} | Languages: ${languageList}`,
      keywords: [
        problem.title,
        `rank ${problem.rank}`,
        difficultyLevel,
        "programming problem",
        "coding challenge",
        ...problem.tags,
        ...problem.supportedLanguages,
        problem.isInteractiveTutorial
          ? "interactive tutorial"
          : "programming exercise",
      ].join(", "),
      openGraph: {
        title: `${problem.title} | ${problem.rank} Rank Programming Problem`,
        description: `${problem.description.substring(0, 160)}...`,
        url: `/programming/problem/${params.problemId}`,
        type: "article",
        siteName: "ELearn Platform",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${problem.title} | ${problem.rank} Rank`,
        description: `${problem.description.substring(0, 160)}...`,
        creator: "@elearn",
      },
      alternates: {
        canonical: `/programming/problem/${params.problemId}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Programming Problem | ELearn Platform",
      description:
        "Solve programming challenges and improve your coding skills.",
    };
  }
}

export default async function ProblemIdLayout({ params, children }: Props) {
  try {
    const response = await getProblemById(params.problemId);

    if (!response.success || !response.data) {
      notFound();
    }

    const problem = response.data;

    return (
      <>
        {/* Enhanced JSON-LD structured data with problem-specific info */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Problem",
              name: problem.title,
              description: problem.description,
              identifier: params.problemId,
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/programming/problem/${params.problemId}`,
              difficulty: problem.rank,
              keywords: problem.tags,
              programmingLanguage: problem.supportedLanguages,
              timeRequired: `PT${problem.timeLimit}MS`,
              author: {
                "@type": "Person",
                name: problem.author.firstName
                  ? `${problem.author.firstName} ${
                      problem.author.lastName || ""
                    }`
                  : problem.author.username,
              },
              provider: {
                "@type": "Organization",
                name: "ELearn Platform",
                url: process.env.NEXT_PUBLIC_SITE_URL,
              },
              educationalLevel:
                problem.rank === "S"
                  ? "Expert"
                  : problem.rank === "A"
                  ? "Advanced"
                  : problem.rank === "B"
                  ? "Intermediate"
                  : problem.rank === "C"
                  ? "Beginner"
                  : "Basic",
              learningResourceType: problem.isInteractiveTutorial
                ? "Interactive Tutorial"
                : "Problem Set",
              dateCreated: problem.createdAt,
              dateModified: problem.updatedAt,
              isAccessibleForFree: true,
              interactivityType: "active",
              educationalUse: "problem solving",
            }),
          }}
        />
        {children}
      </>
    );
  } catch (error) {
    console.error("Error in ProblemIdLayout:", error);
    return <>{children}</>;
  }
}
