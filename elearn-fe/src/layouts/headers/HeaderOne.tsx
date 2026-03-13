"use client";
import Link from "next/link";
import HeaderTopOne from "./menu/HeaderTopOne";
import Image from "next/image";
import NavMenu from "./menu/NavMenu";
import React, { useState, useEffect, useRef } from "react";
import UseSticky from "@/hooks/UseSticky";
import MobileSidebar from "./menu/MobileSidebar";
import InjectableSvg from "@/hooks/InjectableSvg";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const TotalCart = dynamic(() => import("@/components/common/TotalCart"), {
  ssr: false,
});
const TotalWishlist = dynamic(
  () => import("@/components/common/TotalWishlist"),
  { ssr: false }
);
const CustomSelect = dynamic(() => import("@/ui/CustomSelect"), { ssr: false });

import logo from "@/assets/img/logo/logo.svg";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
}

const HeaderOne = () => {
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelectChange = (option: React.SetStateAction<null>) => {
    setSelectedOption(option);
  };

  const { sticky } = UseSticky();
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch auth user info
        const authResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth/me`,
          {
            credentials: "include",
          }
        );

        if (authResponse.ok) {
          const authData = await authResponse.json();
          setUser(authData.user);

          // Only fetch profile if auth was successful
          const profileResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/user`,
            {
              credentials: "include",
            }
          );

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setUserProfile(profileData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as any).contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      setUser(null);
      setUserProfile(null);
      router.push("/sign-in");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Helper function to get display name
  const getDisplayName = () => {
    if (userProfile && (userProfile.firstName || userProfile.lastName)) {
      return `${userProfile.firstName} ${userProfile.lastName}`.trim();
    }
    return user?.username || "";
  };

  // Helper function to get avatar initial
  const getAvatarInitial = () => {
    if (userProfile && userProfile.firstName) {
      return userProfile.firstName.charAt(0).toUpperCase();
    }
    return user?.username.charAt(0).toUpperCase() || "";
  };

  return (
    <>
      <header>
        <HeaderTopOne />
        <div id="header-fixed-height"></div>
        <div
          id="sticky-header"
          className={`tg-header__area ${sticky ? "sticky-menu" : ""}`}
        >
          <div className="container custom-container">
            <div className="row">
              <div className="col-12">
                <div className="tgmenu__wrap">
                  <nav className="tgmenu__nav">
                    <div className="logo">
                      <Link href="/">
                        <Image src={logo} alt="Logo" />
                      </Link>
                    </div>
                    <div className="tgmenu__navbar-wrap tgmenu__main-menu d-none d-xl-flex">
                      <NavMenu isAuthenticated={!!user} />
                    </div>
                    <div className="tgmenu__action">
                      <ul className="list-wrap">
                        <li className="wishlist-icon">
                          <Link href="/wishlist" className="cart-count">
                            <InjectableSvg
                              src="/assets/img/icons/heart.svg"
                              className="injectable"
                              alt="img"
                            />
                            <TotalWishlist />
                          </Link>
                        </li>
                        <li className="mini-cart-icon">
                          <Link href="/cart" className="cart-count">
                            <InjectableSvg
                              src="/assets/img/icons/cart.svg"
                              className="injectable"
                              alt="img"
                            />
                            <TotalCart />
                          </Link>
                        </li>
                        {isLoading ? (
                          <li className="header-btn login-btn">
                            <div className="animate-pulse h-10 w-20 bg-gray-200 rounded"></div>
                          </li>
                        ) : user ? (
                          <li
                            className="header-btn user-profile"
                            ref={dropdownRef}
                          >
                            <div
                              className="user-profile__wrapper"
                              onClick={() => setDropdownOpen((open) => !open)}
                              tabIndex={0}
                              style={{ outline: "none" }}
                            >
                              <div className="user-avatar">
                                <span className="avatar-initial">
                                  {getAvatarInitial()}
                                </span>
                              </div>
                            </div>
                            {dropdownOpen && (
                              <div className="user-dropdown user-dropdown--active mt-2">
                                <div className="user-info">
                                  <div className="username">
                                    {getDisplayName()}
                                  </div>
                                  {/* <div className="username">
                                    @{user.username}
                                  </div> */}
                                  <div className="status-row">
                                    <span className="online-dot"></span>
                                    <span className="status-label">
                                      Status:
                                    </span>
                                    <span className="status-online">
                                      Online
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="settings-btn"
                                  onClick={() => {
                                    router.push("/settings");
                                    setDropdownOpen(false);
                                  }}
                                >
                                  <i className="fas fa-cog"></i> Settings
                                </button>
                                <button
                                  onClick={handleLogout}
                                  className="logout-btn"
                                >
                                  <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                              </div>
                            )}
                          </li>
                        ) : (
                          <li className="header-btn login-btn">
                            <Link href="/sign-in">Log in</Link>
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="mobile-login-btn">
                      {user ? (
                        <div className="user-avatar">
                          <span className="avatar-initial">
                            {getAvatarInitial()}
                          </span>
                          <span className="online-status"></span>
                        </div>
                      ) : (
                        <Link href="/sign-in">
                          <InjectableSvg
                            src="/assets/img/icons/user.svg"
                            alt=""
                            className="injectable"
                          />
                        </Link>
                      )}
                    </div>
                    <div
                      onClick={() => setIsActive(true)}
                      className="mobile-nav-toggler"
                    >
                      <i className="tg-flaticon-menu-1"></i>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <MobileSidebar
        isActive={isActive}
        setIsActive={setIsActive}
        isAuthenticated={!!user}
      />
    </>
  );
};

export default HeaderOne;
