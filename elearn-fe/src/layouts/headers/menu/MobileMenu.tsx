"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicMenuData, privateMenuData } from "@/data/home-data/MenuData";
import Image from "next/image";
import icon_1 from "@/assets/img/others/mega_menu_img.jpg";

interface MobileMenuProps {
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  isAuthenticated: boolean;
}

const MobileMenu = ({
  isActive,
  setIsActive,
  isAuthenticated,
}: MobileMenuProps) => {
  const pathname = usePathname();
  const menuData = isAuthenticated ? privateMenuData : publicMenuData;

  const isActiveLink = (href: string) => pathname === href;
  const isExternal = (href: string) =>
    /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);

  return (
    <div className={`mobile-menu ${isActive ? "active" : ""}`}>
      <div className="mobile-menu__header">
        <div className="logo">
          <Link href="/">
            <Image src={icon_1} alt="Logo" />
          </Link>
        </div>
        <button
          className="mobile-menu__close"
          onClick={() => setIsActive(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="mobile-menu__body">
        <ul className="navigation">
          {menuData.map((menu) => {
            // Special case for Courses, Events, Blog, and Dashboard - no dropdown
            if (
              ["Courses", "Events", "Blog", "Dashboard"].includes(menu.title)
            ) {
              return (
                <li
                  key={menu.id}
                  className={isActiveLink(menu.link) ? "active" : ""}
                >
                  {isExternal(menu.link) ? (
                    <a href={menu.link} target="_blank" rel="noopener noreferrer">
                      {menu.title}
                    </a>
                  ) : (
                    <Link href={menu.link}>{menu.title}</Link>
                  )}
                </li>
              );
            }

            return (
              <li
                key={menu.id}
                className={`menu-item-has-children ${
                  menu.sub_menus ? "has-dropdown" : ""
                }`}
              >
                <Link href={menu.link}>{menu.title}</Link>
                {menu.sub_menus && (
                  <ul className="sub-menu">
                    {menu.sub_menus.map((sub_m: any, index: any) => (
                      <li
                        key={index}
                        className={`${
                          sub_m.dropdown ? "menu-item-has-children" : ""
                        }`}
                      >
                        {isExternal(sub_m.link) ? (
                          <a
                            href={sub_m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {sub_m.title}
                          </a>
                        ) : (
                          <Link href={sub_m.link}>{sub_m.title}</Link>
                        )}
                        {sub_m.mega_menus && (
                          <ul className="sub-menu">
                            {sub_m.mega_menus?.map((mega_m: any, i: any) => (
                              <li
                                key={i}
                                className={
                                  isActiveLink(mega_m.link) ? "active" : ""
                                }
                              >
                                {isExternal(mega_m.link) ? (
                                  <a
                                    href={mega_m.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {mega_m.title}
                                  </a>
                                ) : (
                                  <Link href={mega_m.link}>{mega_m.title}</Link>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default MobileMenu;
