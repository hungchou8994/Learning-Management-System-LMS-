import Link from "next/link"
import Image from "next/image"

import logo from "@/assets/img/logo/secondary_logo.svg"

const FooterCommon = () => {
   return (
      <>
         <div className="col-xl-3 col-lg-4 col-md-6">
            <div className="footer__widget">
               <div className="logo mb-35">
                  <Link href="/"><Image src={logo} alt="img" /></Link>
               </div>
               <div className="footer__content">
                  <p>
                     Elearn is a learning hub where teachers create courses and students learn, practice, and interact in one place.
                  </p>
                  <ul className="list-wrap">
                     <li><Link href="/courses">Browse Courses</Link></li>
                     <li><Link href="http://localhost:3005/apply">Apply to Teach</Link></li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
            <div className="footer__widget">
               <h4 className="footer__widget-title">Explore</h4>
               <div className="footer__link">
                  <ul className="list-wrap">
                     <li><Link href="/courses">Courses</Link></li>
                     <li><Link href="/instructors">Instructors</Link></li>
                     <li><Link href="/blogs">Blog</Link></li>
                     <li><Link href="/about-us">About</Link></li>
                     <li><Link href="/contact">Contact</Link></li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
            <div className="footer__widget">
               <h4 className="footer__widget-title">For Educators</h4>
               <div className="footer__link">
                  <ul className="list-wrap">
                     <li><Link href="http://localhost:3005/apply">Teacher Application</Link></li>
                     <li><Link href="/courses">Publish & Share Courses</Link></li>
                     <li><Link href="/contact">Support</Link></li>
                  </ul>
               </div>
            </div>
         </div>
      </>
   )
}

export default FooterCommon
