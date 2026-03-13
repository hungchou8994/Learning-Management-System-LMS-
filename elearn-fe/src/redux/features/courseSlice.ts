import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Course {
  _id?: string;
  name?: string;
  tag?: string;
  level?: number;
  rating?: number;
  originalPrice?: number;
  salePrice?: number;
}

interface CourseState {
  courses: Course[] | any[];
  course: Course | {};
}

const initialState: CourseState = {
  courses: [],
  course: {},
};

export const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    single_course: (state, action: PayloadAction<number>) => {
      state.course = state.courses.find((p) => Number(p.id) === Number(action.payload)) || {};
    },
  },
});

export const { single_course } = courseSlice.actions;

// Selectors
export const selectCourses = (state: { courses: CourseState }) => state?.courses?.courses;
export const selectCourse = (state: { courses: CourseState }) => state?.courses?.course;

export default courseSlice.reducer;