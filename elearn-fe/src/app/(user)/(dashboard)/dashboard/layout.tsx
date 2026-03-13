import { ReactNode } from "react";

export const metadata = {
  title: "Dashboard | SkillGro",
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
