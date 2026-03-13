"use client";
import Image from "next/image";
import Link from "next/link";
import BtnArrow from "@/svg/BtnArrow";
import SvgAnimation from "@/hooks/SvgAnimation";
import InjectableSvg from "@/hooks/InjectableSvg";

import instructor_thumb1 from "@/assets/img/instructor/instructor_two01.png";
import instructor_thumb2 from "@/assets/img/instructor/instructor_two02.png";

const InstructorTwo = ({ style }: any) => {
  const svgIconRef = SvgAnimation(
    "/assets/img/instructor/instructor_shape02.svg"
  );
  const svgIconRef2 = SvgAnimation(
    "/assets/img/instructor/instructor_shape02.svg"
  );

  return (
    <section
      className={`${style ? "instructor__area-four" : "instructor__area-two"}`}
    >
      <div className="container">
        <div className="instructor__item-wrap-two">
          <div className="row">
            <div className="col-xl-6">
              <div className="instructor__item-two tg-svg" ref={svgIconRef}>
                <div className="instructor__thumb-two">
                  <Image src={instructor_thumb1} alt="img" />
                  <div className="shape-one">
                    <InjectableSvg
                      src="/assets/img/instructor/instructor_shape01.svg"
                      alt="img"
                      className="injectable"
                    />
                  </div>
                  <div className="shape-two">
                    <span className="svg-icon"></span>
                  </div>
                </div>
                <div className="instructor__content-two">
                  <h3 className="title">
                    <Link href="http://localhost:3005/apply">
                      Become an Instructor
                    </Link>
                  </h3>
                  <p>
                    Share your expertise, build your audience, and help learners
                    grow with project-based courses.
                  </p>
                  <div className="tg-button-wrap">
                    <Link
                      href="http://localhost:3005/apply"
                      className="btn arrow-btn"
                    >
                      Apply to Teach <BtnArrow />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-6">
              <div className="instructor__item-two tg-svg" ref={svgIconRef2}>
                <div className="instructor__thumb-two">
                  <Image src={instructor_thumb2} alt="img" />
                  <div className="shape-one">
                    <InjectableSvg
                      src="/assets/img/instructor/instructor_shape01.svg"
                      alt="img"
                      className="injectable"
                    />
                  </div>
                  <div className="shape-two">
                    <span className="svg-icon"></span>
                  </div>
                </div>
                <div className="instructor__content-two">
                  <h3 className="title">
                    <Link href="/contact">Become a Student</Link>
                  </h3>
                  <p>
                    Start learning today with structured lessons, real
                    assignments, and progress you can measure.
                  </p>
                  <div className="tg-button-wrap">
                    <Link href="/courses" className="btn arrow-btn">
                      Start Learning <BtnArrow />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorTwo;
