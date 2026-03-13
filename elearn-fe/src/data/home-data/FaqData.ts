interface DataType {
   id: number;
   page: string;
   question: string;
   answer: string;
   class_name?:string;
}[];

const faq_data: DataType[] = [
   {
      id: 1,
      page: "home_1",
      question: "What will I learn on this platform?",
      answer:
        "You’ll learn through structured lessons and hands-on practice. Courses focus on real skills you can apply immediately—whether you’re building your first project or advancing your career.",
   },
   {
      id: 2,
      page: "home_1",
      question: "Why learn with us?",
      class_name:"collapsed",
      answer:
        "We prioritize clarity and outcomes: guided learning paths, practical assignments, and content designed to help you improve step by step—without wasting time on fluff.",
   },
   {
      id: 3,
      page: "home_1",
      question: "How do courses work?",
      class_name:"collapsed",
      answer:
        "Enroll in a course, follow the lessons in order, and practice with assignments where available. You can learn at your own pace and revisit any lesson anytime.",
   },
   {
      id: 4,
      page: "home_1",
      question: "Are courses free or paid?",
      class_name:"collapsed",
      answer:
        "Both. Some courses are free, and paid courses unlock additional content and features. Pricing is displayed on each course card so you always know before enrolling.",
   },
];

export default faq_data;