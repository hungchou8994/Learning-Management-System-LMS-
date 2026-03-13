import Social from "@/components/common/Social"
import FooterCommon from "./FooterCommon"
import Image from "next/image"
import Link from "next/link"

import icon_1 from "@/assets/img/others/google-play.svg"
import icon_2 from "@/assets/img/others/apple-store.svg"

const FooterOne = ({ style, style_2 }: any) => {
   return (
      <footer className={`footer__area ${style_2 ? "footer__area-five" : style ? "footer__area-two" : ""}`}>
         <div className={`footer__top ${style_2 ? "footer__top-three" : ""}`}>
            <div className="container">
               <div className="row">
                  <FooterCommon />
                  <div className="col-xl-3 col-lg-4 col-md-6">
                     <div className="footer__widget">
                        <h4 className="footer__widget-title">Get In Touch</h4>
                        <div className="footer__contact-content">
                           <p>
                              A platform built for teachers and students to learn, teach, and connect through courses, feedback, and community.
                           </p>
                           <ul className="list-wrap footer__social">
                              <Social />
                           </ul>
                        </div>
                        <div className="app-download">
                           <Link href="/courses"><Image src={icon_1} alt="Browse courses" /></Link>
                           <Link href="http://localhost:3005/apply"><Image src={icon_2} alt="Apply to teach" /></Link>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            {style_2 && <div className="footer__shape" style={{ backgroundImage: `url(/assets/img/others/h8_footer_shape.svg)` }}></div>}
         </div>
         
         <div className={`footer__bottom ${style_2 ? "footer__bottom-four" : ""}`}>
            <div className="container">
               <div className="row align-items-center">
                  <div className="col-md-7">
                     <div className="copy-right-text">
                        <p>© 2024–2026 nerkar297. All rights reserved.</p>
                     </div>
                  </div>
                  <div className="col-md-5">
                     <div className="footer__bottom-menu">
                        <ul className="list-wrap">
                           <li><Link href="/contact">Terms</Link></li>
                           <li><Link href="/contact">Privacy</Link></li>
                        </ul>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </footer>
   )
}

export default FooterOne
