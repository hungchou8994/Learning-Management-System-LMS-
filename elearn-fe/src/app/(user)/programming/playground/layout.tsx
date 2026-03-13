import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Playground - C++, Python, Java Online Compiler | ELearn",
  description:
    "Interactive multi-language code playground supporting C++, Python, and Java. Write, compile, and execute code online with real-time feedback and input/output testing.",
  keywords:
    "online compiler, code playground, c++ compiler, python interpreter, java compiler, programming practice, code editor, online ide",
  authors: [{ name: "ELearn Platform" }],
  creator: "ELearn Platform",
  publisher: "ELearn Platform",
  openGraph: {
    title: "Multi-Language Code Playground",
    description:
      "Write, compile, and execute C++, Python, and Java code online with our interactive playground featuring real-time feedback.",
    url: "/programming/playground",
    siteName: "ELearn Platform",
    images: [
      {
        url: "/assets/img/logo/playground.png",
        width: 1200,
        height: 630,
        alt: "Code Playground - Multi-Language Online Compiler",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-Language Code Playground",
    description:
      "Interactive online compiler for C++, Python, and Java with real-time execution",
    images: ["/assets/img/logo/playground.png"],
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

const PlaygroundLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Multi-Language Code Playground",
            applicationCategory: "DeveloperApplication",
            description:
              "Interactive online compiler and code playground supporting C++, Python, and Java programming languages with real-time execution and feedback.",
            url: "/programming/playground",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
            featureList: [
              "C++ online compiler",
              "Python interpreter",
              "Java online compiler",
              "Real-time code execution",
              "Input/Output testing",
              "Monaco code editor",
              "Syntax highlighting",
              "Error detection",
            ],
            screenshot: "/assets/img/logo/playground.png",
            provider: {
              "@type": "Organization",
              name: "ELearn Platform",
              url: "/",
            },
            programmingLanguage: ["C++", "Python", "Java"],
          }),
        }}
      />
      {children}
    </>
  );
};

export default PlaygroundLayout;
