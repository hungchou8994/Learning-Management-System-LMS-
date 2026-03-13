interface MenuItem {
  id: number;
  title: string;
  link: string;
  menu_class?: string;
  home_sub_menu?: {
    menu_details: {
      link: string;
      title: string;
      badge?: string;
      badge_class?: string;
    }[];
  }[];
  sub_menus?: {
    link: string;
    title: string;
    dropdown?: boolean;
    mega_menus?: {
      link: string;
      title: string;
    }[];
  }[];
}

// Group Courses/Events/Blogs under "Center"
const centerMenuItem: MenuItem = {
  id: 1,
  title: "Center",
  link: "#",
  sub_menus: [
    { title: "Courses", link: "/courses" },
    { title: "Events", link: "/events" },
    { title: "Blogs", link: "/blogs" },
  ],
};

// Menu for non-authenticated users
export const publicMenuData: MenuItem[] = [
  {
    id: 1,
    title: "Courses",
    link: "/courses",
  },
  {
    id: 2,
    title: "Events",
    link: "/events",
  },
  {
    id: 3,
    title: "Blogs",
    link: "/blogs",
  },
  {
    id: 4,
    title: "Instructors",
    link: "/instructors",
  },
  {
    id: 5,
    title: "About",
    link: "/about-us",
  },
  {
    id: 6,
    title: "Contact",
    link: "/contact",
  },
];

// Menu for authenticated users
export const privateMenuData: MenuItem[] = [
  centerMenuItem,
  {
    id: 2,
    title: "Dashboard",
    link: "/dashboard",
  },
  {
    id: 3,
    title: "Assignments",
    link: "/assignments",
  },
  {
    id: 4,
    title: "Messenger",
    link: "http://localhost:3008",
  },
  {
    id: 5,
    title: "Meetings",
    link: "http://localhost:3007",
  },
  {
    id: 6,
    title: "Playground",
    link: "/programming/playground",
  },
];
