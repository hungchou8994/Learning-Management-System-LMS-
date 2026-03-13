export type NavItem = {
  title: string;
  path: string;
  icon: string;
  roles: string[];
};

export const navigationItems: NavItem[] = [
  // Common pages for support teacher
  {
    title: "All Courses",
    path: "/admin/courses",
    icon: "flaticon-book",
    roles: ["support_teacher", "teacher", "manager", "admin"],
  },
  {
    title: "Settings",
    path: "/admin/settings",
    icon: "flaticon-settings",
    roles: ["support_teacher", "teacher", "accountant", "manager", "admin"],
  },
  {
    title: "Salary",
    path: "/admin/salary",
    icon: "flaticon-money",
    roles: ["support_teacher", "teacher", "accountant", "manager", "admin"],
  },
  {
    title: "All Students",
    path: "/admin/students",
    icon: "flaticon-student",
    roles: ["support_teacher", "teacher", "accountant", "manager", "admin"],
  },
  {
    title: "Feedbacks",
    path: "/admin/feedbacks",
    icon: "flaticon-feedback",
    roles: ["support_teacher", "teacher", "manager", "admin"],
  },

  // Teacher specific
  {
    title: "Supporters",
    path: "/admin/supporters",
    icon: "flaticon-support",
    roles: ["teacher", "manager", "admin"],
  },

  // Accountant specific
  {
    title: "Finance",
    path: "/admin/finance",
    icon: "flaticon-finance",
    roles: ["accountant", "manager", "admin"],
  },
  {
    title: "Payment",
    path: "/admin/payment",
    icon: "flaticon-payment",
    roles: ["accountant", "manager", "admin"],
  },

  // Recruiter specific
  {
    title: "Blogs",
    path: "/admin/blogs",
    icon: "flaticon-blog",
    roles: ["recruiter", "manager", "admin"],
  },
  {
    title: "Events",
    path: "/admin/events",
    icon: "flaticon-event",
    roles: ["recruiter", "manager", "admin"],
  },
  {
    title: "All Teachers",
    path: "/admin/teachers",
    icon: "flaticon-teacher",
    roles: ["recruiter", "manager", "admin"],
  },

  // Admin specific
  {
    title: "All Employees",
    path: "/admin/employees",
    icon: "flaticon-employee",
    roles: ["admin"],
  },
];
