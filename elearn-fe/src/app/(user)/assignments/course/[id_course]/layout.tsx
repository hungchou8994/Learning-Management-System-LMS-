import React from "react";

export const metadata = {
  title: "Course Assignments",
  description: "Course Assignments",
};

const CourseLayout = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export default CourseLayout;
