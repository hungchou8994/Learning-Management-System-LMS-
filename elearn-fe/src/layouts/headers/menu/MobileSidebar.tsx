"use client";

import Image from "next/image"
import Link from "next/link"
import MobileMenu from "./MobileMenu"
import { useRouter } from "next/navigation";
import { useState } from "react";

import logo from "@/assets/img/logo/logo.svg"

interface MobileSidebarProps {
   isActive: boolean;
   setIsActive: (isActive: boolean) => void;
   isAuthenticated?: boolean;
   // Some headers pass extra props (e.g. Sidebar="...") — keep backward compatible.
   [key: string]: any;
}

const MobileSidebar = ({ isActive, setIsActive, isAuthenticated = false }: MobileSidebarProps) => {
   const router = useRouter();
   const [q, setQ] = useState("");

   const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const query = q.trim();
      if (!query) {
         router.push("/courses");
      } else {
         router.push(`/courses?q=${encodeURIComponent(query)}`);
      }
      setIsActive(false);
   };

   return (
      <div className={isActive ? "mobile-menu-visible" : ""}>
         <div className="tgmobile__menu">
            <nav className="tgmobile__menu-box">
               <div onClick={() => setIsActive(false)} className="close-btn"><i className="tg-flaticon-close-1"></i></div>
               <div className="nav-logo">
                  <Link href="/"><Image src={logo} alt="Logo" /></Link>
               </div>
               <div className="tgmobile__search">
                  <form onSubmit={onSubmit}>
                     <input
                        type="text"
                        placeholder="Search for courses..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                     />
                     <button type="submit" aria-label="Search courses">
                        <i className="fas fa-search"></i>
                     </button>
                  </form>
               </div>
               <div className="tgmobile__menu-outer">
                  <MobileMenu
                     isActive={isActive}
                     setIsActive={setIsActive}
                     isAuthenticated={isAuthenticated}
                  />
               </div>
               <div className="social-links">
                  <ul className="list-wrap">
                     <li><Link href="#"><i className="fab fa-facebook-f"></i></Link></li>
                     <li><Link href="#"><i className="fab fa-twitter"></i></Link></li>
                     <li><Link href="#"><i className="fab fa-instagram"></i></Link></li>
                     <li><Link href="#"><i className="fab fa-linkedin-in"></i></Link></li>
                     <li><Link href="#"><i className="fab fa-youtube"></i></Link></li>
                  </ul>
               </div>
            </nav>
         </div>
         <div className="tgmobile__menu-backdrop"></div>
      </div>
   )
}

export default MobileSidebar
