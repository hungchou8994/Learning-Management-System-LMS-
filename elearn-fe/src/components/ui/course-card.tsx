import { Course, Profile, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type CourseCardProps = {
  course: Course & {
    teacher: User & {
      profile: Profile | null;
    };
    _count: {
      lessons: number;
      students: number;
    };
  };
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
        <div className="relative h-48 w-full">
          <Image
            src={course.thumbnail || "/course-placeholder.jpg"}
            alt={course.title}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">
              {course.category}
            </span>
            <span className="text-xs text-gray-500">
              {course._count.lessons} lessons
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {course.teacher.name?.[0] || "T"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {course.teacher.name}
                </p>
                <p className="text-xs text-gray-500">
                  {course._count.students} students
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-indigo-600">
              ${course.price.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
