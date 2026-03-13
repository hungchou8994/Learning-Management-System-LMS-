import Image from "next/image";
import Link from "next/link";

interface Instructor {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  bio: string;
  skill: string;
}

interface InstructorsProps {
  instructor: Instructor;
}

const Instructors = ({ instructor }: InstructorsProps) => {
  return (
    <>
      <div className="courses__instructors-wrap">
        <div className="courses__instructors-thumb">
          <Image
            src={
              instructor.avatarUrl ||
              "/assets/img/courses/instructor_default.png"
            }
            alt={`${instructor.firstName} ${instructor.lastName}`}
            width={225}
            height={225}
          />
        </div>
        <div className="courses__instructors-content">
          <h4 className="title">
            {instructor.firstName} {instructor.lastName}
          </h4>
          <span className="designation">{instructor.skill}</span>
          <p className="avg-rating">
            <i className="fas fa-star"></i>(4.8 Ratings)
          </p>
          <p>{instructor.bio}</p>
          <p>
            Dorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua Quis
            ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas
            accumsan.
          </p>
          <div className="instructor__social">
            <ul className="list-wrap justify-content-start">
              <li>
                <Link href="#">
                  <i className="fab fa-facebook-f"></i>
                </Link>
              </li>
              <li>
                <Link href="#">
                  <i className="fab fa-twitter"></i>
                </Link>
              </li>
              <li>
                <Link href="#">
                  <i className="fab fa-whatsapp"></i>
                </Link>
              </li>
              <li>
                <Link href="#">
                  <i className="fab fa-instagram"></i>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Instructors;
