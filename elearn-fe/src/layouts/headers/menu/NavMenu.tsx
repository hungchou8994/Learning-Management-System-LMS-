"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicMenuData, privateMenuData } from "@/data/home-data/MenuData";

interface NavMenuProps {
  isAuthenticated: boolean;
}

const NavMenu = ({ isAuthenticated }: NavMenuProps) => {
  const pathname = usePathname();
  const menuData = isAuthenticated ? privateMenuData : publicMenuData;

  const isActive = (href: string) => pathname === href;
  const isExternal = (href: string) =>
    /^https?:\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);

  // Function to check if any of the links in an array is active
  const isAnyChildActive = (hrefs: string[] = []) =>
    hrefs.some((href) => pathname === href);

  return (
    <ul className="navigation">
      {menuData.map((menu) => {
        const hasChildren = Boolean(menu.sub_menus && menu.sub_menus.length > 0);

        // Render a simple nav link when there are no dropdown children
        if (!hasChildren) {
          return (
            <li key={menu.id} className={isActive(menu.link) ? "active" : ""}>
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

        // Collect all links from sub_menus for the parent menu
        const subMenuLinks =
          menu.sub_menus?.map((sub_m) => sub_m.link).filter(Boolean) || [];
        const megaMenuLinks =
          menu.sub_menus
            ?.flatMap((sub_m) => sub_m.mega_menus?.map((mega_m) => mega_m.link))
            .filter(Boolean) || [];

        // Filter out undefined values and create a combined array of links
        const allLinks = [...subMenuLinks, ...megaMenuLinks].filter(
          Boolean
        ) as string[];

        return (
          <li
            key={menu.id}
            className={`menu-item-has-children ${
              isAnyChildActive(allLinks) ? "active" : ""
            }`}
          >
            <Link href={menu.link}>{menu.title}</Link>
            {menu.sub_menus && (
              <ul className={`sub-menu ${menu.menu_class || ""}`}>
                {menu.sub_menus.map((sub_m: any, index: any) => {
                  const isSubMenuActive = isActive(sub_m.link);
                  const isAnyMegaChildActive = isAnyChildActive(
                    sub_m.mega_menus
                      ?.map((mega_m: any) => mega_m.link)
                      .filter(Boolean) as string[]
                  );

                  return (
                    <li
                      key={index}
                      className={`${
                        sub_m.dropdown ? "menu-item-has-children" : ""
                      } ${
                        isSubMenuActive || isAnyMegaChildActive ? "active" : ""
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
                              className={isActive(mega_m.link) ? "active" : ""}
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
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default NavMenu;
