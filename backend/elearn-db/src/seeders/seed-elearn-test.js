/* eslint-disable no-console */
/**
 * 4) Seed full data on elearn-db (elearn-test) based on seeded auth users file.
 *
 * Requirements:
 * - Takes users from a JSON file created by auth-service seed script.
 * - Creates: users(profiles), courses, sessions, lessons, assignments, attempts, feedbacks (reviews), enrolls.
 *
 * Usage:
 *   node src/seeders/seed-elearn-test.js --mongo mongodb://127.18.0.2:27017/elearn-test --users ../../seed-users.json --courses 20
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const User = require("../models/User");
const Course = require("../models/Course");
const Session = require("../models/Session");
const Lesson = require("../models/Lesson");
const Feedback = require("../models/Feedback");
const Enrollment = require("../models/Enroll");
const Assignment = require("../models/Assignment");
const Attempt = require("../models/Attempt");

// Seed content defaults (requested)
const DEFAULT_LESSON_VIDEO_URL =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const DEFAULT_MEETING_URL =
  "http://localhost:3007/meeting/41edc0e1-979a-4792-abc9-c716daa438cd";

const DEFAULT_STUDENT_AVATAR_URL =
  "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5";
const DEFAULT_STUDENT_COVER_URL =
  "https://img.freepik.com/psd-cao-cap/mau-banner-hien-dai-giam-gia-lon-voi-kieu-chu-3d_856760-360.jpg";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) {
      args._.push(raw);
      continue;
    }
    const eq = raw.indexOf("=");
    if (eq > 0) {
      args[raw.slice(2, eq)] = raw.slice(eq + 1);
      continue;
    }
    const k = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[k] = true;
    } else {
      args[k] = next;
      i += 1;
    }
  }
  return args;
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slug(i) {
  return String(i).padStart(2, "0");
}

function courseThumbName(n) {
  const k = Number(n);
  if (!Number.isFinite(k) || k <= 0) return "course_thumb01.jpg";
  if (k <= 9) return `course_thumb0${k}.jpg`;
  return `course_thumb${k}.jpg`;
}

function countWords(text) {
  const t = String(text || "");
  const m = t.match(/\b[\w'-]+\b/g);
  return m ? m.length : 0;
}

function pickSentence(seed, topicLabel) {
  const sentences = [
    `In this lesson, we focus on the core ideas behind ${topicLabel} and why they matter in real projects.`,
    `You will build intuition first, then reinforce it through a concrete example and a short exercise.`,
    `Each section is designed to be clear, practical, and easy to revisit when you need a quick refresher.`,
    `We will connect the concept to real-world scenarios so you understand not only what to do, but also when to do it.`,
    `Take notes as you go, and pause to test your understanding before moving to the next part.`,
    `If something feels confusing at first, that is normal—practice and repetition will make it click.`,
    `By the end, you should be able to explain the idea in your own words and apply it confidently.`,
    `You will also learn common pitfalls and how to avoid them when building features or solving problems.`,
    `The goal is steady progress: small steps, frequent practice, and a clear plan for what comes next.`,
    `As you follow along, try to predict the next step before reading it, then compare with the solution.`,
  ];
  // rotate but still "random enough"
  return sentences[seed % sentences.length];
}

function sampleWithoutReplacement(arr, k) {
  const a = Array.isArray(arr) ? [...arr] : [];
  const n = a.length;
  const kk = Math.max(0, Math.min(n, Number(k) || 0));
  for (let i = n - 1; i > 0; i -= 1) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, kk);
}

function makeParagraph({ minWords, maxWords, seed = 0, topicLabel = "this topic" }) {
  const target = randInt(minWords, maxWords);
  const parts = [];
  let i = 0;
  while (countWords(parts.join(" ")) < target && i < 200) {
    parts.push(pickSentence(seed + i, topicLabel));
    i += 1;
  }

  // If we overshoot, trim last sentence to fit maxWords
  let out = parts.join(" ");
  while (countWords(out) > maxWords && out.includes(". ")) {
    out = out.split(". ").slice(0, -1).join(". ");
    if (!out.endsWith(".")) out += ".";
  }

  // If still over maxWords (rare), hard trim words at the end (keeps paragraph readable)
  if (countWords(out) > maxWords) {
    const words = out.match(/\b[\w'-]+\b/g) || [];
    const trimmed = words.slice(0, maxWords).join(" ");
    out = `${trimmed}.`;
  }

  // Ensure at least minWords
  while (countWords(out) < minWords) {
    out = `${out} ${pickSentence(seed + 999, topicLabel)}`;
    if (countWords(out) > maxWords) break;
  }

  return out;
}

function topicLabelFromTag(tag) {
  const t = String(tag || "").toLowerCase();
  if (t === "web") return "Web Development";
  if (t === "data") return "Data Science";
  if (t === "design") return "UI/UX Design";
  if (t === "cloud") return "Cloud Computing";
  return "Web Development";
}

function genUsdPrice() {
  // Requested: USD range around 19–80
  const originalPrice = randInt(19, 80);
  // salePrice <= originalPrice, keep it in same USD-ish range
  const discount = randInt(0, Math.min(20, originalPrice - 19));
  const salePrice = Math.max(19, originalPrice - discount);
  return { originalPrice, salePrice };
}

function normalizeUsersFile(usersPath) {
  const raw = fs.readFileSync(usersPath, "utf8");
  const json = JSON.parse(raw);
  const users = Array.isArray(json?.users) ? json.users : [];
  return users
    .map((u) => ({
      role: String(u.role || "").trim(),
      username: String(u.username || "").trim(),
      email: String(u.email || "").trim(),
      password: String(u.password || ""),
    }))
    .filter((u) => u.role && u.username);
}

function makeProfile(u, idx) {
  const firstNames = [
    "Minh",
    "Huy",
    "Linh",
    "Mai",
    "Tuan",
    "Trang",
    "Khoa",
    "Vy",
    "Nam",
    "Ngoc",
  ];
  const lastNames = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vo", "Dang", "Bui"];
  const skills = [
    "Web Development",
    "Data Science",
    "UI/UX",
    "Cloud Computing",
    "Algorithms",
    "Backend Engineering",
    "Frontend Engineering",
  ];

  if (u.role === "admin") {
    return {
      username: u.username,
      firstName: "Admin",
      lastName: "Seed",
      bio:
        "Seeded admin account for local development. Use this account to review applications, manage courses, and validate end-to-end flows.",
      avatarUrl: "/assets/img/instructor/instructor01.png",
      coverUrl: "/assets/img/bg/dashboard_bg.jpg",
      address: "Elearn Center",
      phoneNumber: "+84900000000",
      skill: "Management",
    };
  }

  const fn = pick(firstNames, idx);
  const ln = pick(lastNames, idx);
  const skill = pick(skills, idx);

  // Teachers: use local instructor assets (01..08)
  if (u.role === "teacher") {
    const n = (idx % 8) + 1;
    const fn2 = fn;
    const ln2 = ln;
    const topicLabel = pick(skills, idx);
    return {
      username: u.username,
      firstName: fn,
      lastName: ln,
      bio: makeParagraph({
        minWords: 48,
        maxWords: 55,
        seed: idx + 10,
        topicLabel: `${topicLabel}`,
      })
        .replace(/^In this lesson, we focus on/i, `Hi, I’m ${fn2} ${ln2}. I focus on`)
        .replace(/in real projects\./i, "with a practical, project-first approach.")
        .replace(/You will build intuition first,/i, "You’ll build intuition first,")
        .replace(/Each section is designed/gi, "Each course is designed"),
      avatarUrl: `/assets/img/instructor/instructor${slug(n)}.png`,
      coverUrl: "/assets/img/bg/instructor_bg.jpg",
      address: "Elearn Center",
      phoneNumber: `+849${String(100000000 + idx).slice(-9)}`,
      skill,
      socialShare: [
        "https://github.com/",
        "https://www.linkedin.com/",
      ],
    };
  }

  // Students: fixed avatar + cover (requested)
  if (u.role === "student") {
    const fn2 = fn;
    const ln2 = ln;
    return {
      username: u.username,
      firstName: fn,
      lastName: ln,
      bio: makeParagraph({
        minWords: 48,
        maxWords: 55,
        seed: idx + 50,
        topicLabel: `${skill}`,
      })
        .replace(/^In this lesson, we focus on/i, `I’m ${fn2} ${ln2}, and I focus on`)
        .replace(/in real projects\./i, "through steady, consistent practice.")
        .replace(/The goal is steady progress/gi, "My goal is steady progress"),
      avatarUrl: DEFAULT_STUDENT_AVATAR_URL,
      coverUrl: DEFAULT_STUDENT_COVER_URL,
      address: "Elearn Community",
      phoneNumber: `+849${String(100000000 + idx).slice(-9)}`,
      skill,
    };
  }

  return {
    username: u.username,
    firstName: fn,
    lastName: ln,
    bio:
      "Seeded staff profile for local development.",
    avatarUrl: "/assets/img/instructor/instructor02.png",
    coverUrl: "/assets/img/bg/dashboard_bg.jpg",
    address: "Elearn Center",
    phoneNumber: `+849${String(100000000 + idx).slice(-9)}`,
    skill,
  };
}

function buildAssignment({ sessionId, idx }) {
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Assignment({
    name: `Session ${idx + 1} Assignment`,
    description:
      "Practice what you learned with a short quiz + one open-ended question. This assignment is auto-graded in seed mode.",
    gradingMode: "auto",
    ratio: 10,
    duration: 45,
    deadline,
    sessionId,
    questions: [
      {
        title: "Q1 (Multiple choice): 2 + 2 = ?",
        type: "multi_choice",
        orderIndex: 1,
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
      },
      {
        title: "Q2 (Short answer): Define an API in one sentence.",
        type: "assignment",
        orderIndex: 2,
        options: [],
        correctAnswer: "application programming interface",
      },
    ],
  });
}

function lessonMarkdown({ kind, topic, sessionIndex, lessonIndex }) {
  const topicLabel = topicLabelFromTag(topic);
  const header = `# ${topicLabel} — Session ${sessionIndex + 1}, Lesson ${lessonIndex + 1}`;
  const goals = [
    "- Understand the core concept and why it matters",
    "- Practice with a small, focused example",
    "- Leave with a checklist you can reuse",
  ];

  const codeByTopic = {
    web: "```ts\n// Example: typed utility function\nexport function clamp(n: number, min: number, max: number) {\n  return Math.max(min, Math.min(max, n));\n}\n```",
    data: "```python\n# Example: quick data transform\nnums = [1, 2, 3, 4]\nsquares = [n*n for n in nums]\nprint(squares)\n```",
    design: "```css\n/* Example: responsive card */\n.card {\n  display: grid;\n  gap: 12px;\n  padding: 16px;\n  border-radius: 16px;\n  background: #fff;\n}\n```",
    cloud: "```bash\n# Example: basic Docker workflow\ndocker build -t my-app .\ndocker run -p 3000:3000 my-app\n```",
  };

  const code = codeByTopic[String(topic || "").toLowerCase()] || codeByTopic.web;

  // Make sure lesson descriptions are long (400–450 words) while still being readable in markdown viewers.
  const intro = makeParagraph({ minWords: 90, maxWords: 110, seed: sessionIndex * 10 + lessonIndex, topicLabel });
  const deepDive = makeParagraph({ minWords: 120, maxWords: 140, seed: sessionIndex * 10 + lessonIndex + 100, topicLabel });
  const practice = makeParagraph({ minWords: 85, maxWords: 100, seed: sessionIndex * 10 + lessonIndex + 200, topicLabel });
  const wrapUp = makeParagraph({ minWords: 85, maxWords: 100, seed: sessionIndex * 10 + lessonIndex + 300, topicLabel });

  if (kind === "online") {
    const out = [
      header,
      "",
      "## Live session",
      "",
      intro,
      "",
      `**Meeting link:** ${DEFAULT_MEETING_URL}`,
      "",
      "### Agenda",
      "- 10 min: recap & Q/A",
      "- 20 min: guided exercise",
      "- 10 min: next steps",
      "",
      "### What to prepare",
      "- A notebook (or code editor)",
      "- Questions from the video lesson",
      "",
      "## Deep dive",
      "",
      deepDive,
      "",
      "## Practice",
      "",
      practice,
      "",
      "## Wrap up",
      "",
      wrapUp,
    ].join("\n");

    // keep within 400–450 words; trim only the last paragraph if needed
    const words = countWords(out);
    if (words > 450) {
      const maxWrap = Math.max(10, 450 - (words - countWords(wrapUp)));
      const trimmedWrap = makeParagraph({
        minWords: Math.min(maxWrap, 60),
        maxWords: maxWrap,
        seed: sessionIndex * 10 + lessonIndex + 333,
        topicLabel,
      });
      return out.replace(wrapUp, trimmedWrap);
    }
    return out;
  }

  if (kind === "document") {
    const out = [
      header,
      "",
      "## Notes",
      "",
      intro,
      "",
      "## Learning goals",
      ...goals,
      "",
      "## Deep dive",
      "",
      deepDive,
      "",
      "## Example",
      code,
      "",
      "## Practice",
      "",
      practice,
      "",
      "## Checklist",
      "- I can explain the concept in my own words",
      "- I can run the example and modify it",
      "- I know what to learn next",
      "",
      "## Next steps",
      "",
      wrapUp,
    ].join("\n");
    const words = countWords(out);
    if (words > 450) {
      const maxWrap = Math.max(10, 450 - (words - countWords(wrapUp)));
      const trimmedWrap = makeParagraph({
        minWords: Math.min(maxWrap, 60),
        maxWords: maxWrap,
        seed: sessionIndex * 10 + lessonIndex + 444,
        topicLabel,
      });
      return out.replace(wrapUp, trimmedWrap);
    }
    return out;
  }

  // video
  const out = [
    header,
    "",
    "## Watch this lesson",
    "",
    intro,
    "",
    "## Learning goals",
    ...goals,
    "",
    "## Deep dive",
    "",
    deepDive,
    "",
    "## Quick example",
    code,
    "",
    "## Practice",
    "",
    practice,
    "",
    "## Wrap up",
    "",
    wrapUp,
  ].join("\n");
  const words = countWords(out);
  if (words > 450) {
    const maxWrap = Math.max(10, 450 - (words - countWords(wrapUp)));
    const trimmedWrap = makeParagraph({
      minWords: Math.min(maxWrap, 60),
      maxWords: maxWrap,
      seed: sessionIndex * 10 + lessonIndex + 555,
      topicLabel,
    });
    return out.replace(wrapUp, trimmedWrap);
  }
  return out;
}

async function seed() {
  const args = parseArgs(process.argv);

  if (process.env.NODE_ENV === "production") {
    throw new Error("Refuse to seed in production (NODE_ENV=production).");
  }

  const mongoUri =
    String(args.mongo || args.uri || process.env.MONGODB_URI || "").trim() ||
    "mongodb://localhost:27017/elearn-test?directConnection=true";
  const usersPathRaw = String(args.users || "").trim();
  if (!usersPathRaw) {
    throw new Error("Missing --users path (JSON from auth-service seed-users.js).");
  }

  const usersPath = path.resolve(process.cwd(), usersPathRaw);
  const users = normalizeUsersFile(usersPath);
  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  const courseCount = Math.max(1, Math.min(200, Number(args.courses || 20)));
  const sessionsPerCourse = Math.max(
    1,
    Math.min(20, Number(args.sessionsPerCourse || args.sessions || 3))
  );
  const lessonsPerSession = Math.max(
    3,
    Math.min(20, Number(args.lessonsPerSession || args.lessons || 3))
  );
  const maxEnrollPerStudent = Math.max(
    0,
    Math.min(courseCount, Number(args.maxEnrollPerStudent || args.maxEnroll || 12))
  );

  console.log("== Seed elearn-test ==");
  console.log("- mongo:", mongoUri);
  console.log("- users:", usersPath);
  console.log(`- teachers: ${teachers.length}, students: ${students.length}, totalUsers: ${users.length}`);
  console.log(`- courses: ${courseCount}`);
  console.log(`- sessionsPerCourse: ${sessionsPerCourse}`);
  console.log(`- lessonsPerSession: ${lessonsPerSession}`);
  console.log(`- maxEnrollPerStudent: ${maxEnrollPerStudent}`);

  await mongoose.connect(mongoUri);
  const dbName = mongoose.connection.db.databaseName;
  if (dbName !== "elearn-test") {
    throw new Error(`Refuse to seed db="${dbName}". Expected "elearn-test".`);
  }

  // Ensure empty-ish (we expect wipe script ran, but keep idempotent)
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Session.deleteMany({}),
    Lesson.deleteMany({}),
    Feedback.deleteMany({}),
    Enrollment.deleteMany({}),
    Assignment.deleteMany({}),
    Attempt.deleteMany({}),
  ]);

  // Create profiles
  const profileDocs = users.map((u, idx) => makeProfile(u, idx));
  await User.insertMany(profileDocs, { ordered: false });

  const teacherProfiles = await User.find({ username: { $in: teachers.map((t) => t.username) } }).lean();
  const studentProfiles = await User.find({ username: { $in: students.map((s) => s.username) } }).lean();

  if (!teacherProfiles.length) throw new Error("No teacher profiles created.");
  if (!studentProfiles.length) throw new Error("No student profiles created.");

  // Create courses
  const courseTemplates = [
    { topic: "Web Development", tag: "web", level: 1 },
    { topic: "Data Science", tag: "data", level: 2 },
    { topic: "UI/UX Design", tag: "design", level: 1 },
    { topic: "Cloud Computing", tag: "cloud", level: 2 },
  ];

  const courses = [];
  for (let i = 0; i < courseCount; i += 1) {
    const t = courseTemplates[i % courseTemplates.length];
    const teacher = teacherProfiles[i % teacherProfiles.length];
    const { originalPrice, salePrice } = genUsdPrice();
    const thumbIdx = (i % 13) + 1;
    const courseName = `${t.topic} — Foundations #${slug(i + 1)}`;
    courses.push(
      new Course({
        name: courseName,
        description: makeParagraph({
          minWords: 40,
          maxWords: 50,
          seed: i + 700,
          topicLabel: t.topic,
        }),
        shortDescription: `Learn ${t.topic} with hands-on lessons and a guided project.`,
        originalPrice,
        salePrice,
        thumbnail: `/assets/img/courses/${courseThumbName(thumbIdx)}`,
        targets: [
          "Build a solid foundation and avoid common beginner mistakes",
          "Practice with bite-sized exercises after each lesson",
          "Complete a mini-project and one capstone project",
          "Understand how to keep learning with the right resources",
        ],
        requirements: [
          "A computer with internet access",
          "Willingness to practice (15–30 minutes per day)",
          "No prior experience required for level 1 courses",
        ],
        certificate: true,
        level: t.level,
        instructorId: teacher._id,
        tag: t.tag,
        totalStudents: 0,
        rating: 0,
        sessions: [],
      })
    );
  }

  const createdCourses = await Course.insertMany(courses);

  // Enrollments: each student enrolls in 0..maxEnrollPerStudent courses (paid)
  const enrollDocs = [];
  for (const stu of studentProfiles) {
    const k = randInt(0, maxEnrollPerStudent);
    const chosenCourses = sampleWithoutReplacement(createdCourses, k);
    for (const c of chosenCourses) {
      enrollDocs.push(
        new Enrollment({
          username: stu.username,
          courseId: c._id,
          status: "paid",
          paymentMethod: randInt(0, 1) === 0 ? "cash" : "bank",
          progress: randInt(0, 100),
        })
      );
    }
  }
  if (enrollDocs.length) {
    await Enrollment.insertMany(enrollDocs);
  }

  const enrolledByCourseId = new Map(); // courseId -> array of studentProfiles
  for (const c of createdCourses) {
    enrolledByCourseId.set(String(c._id), []);
  }
  const studentByUsername = new Map(studentProfiles.map((s) => [s.username, s]));
  for (const e of enrollDocs) {
    const key = String(e.courseId);
    const stu = studentByUsername.get(e.username);
    if (!stu) continue;
    if (!enrolledByCourseId.has(key)) enrolledByCourseId.set(key, []);
    enrolledByCourseId.get(key).push(stu);
  }

  // Create sessions, lessons, assignments
  for (const course of createdCourses) {
    const sessions = [];
    for (let si = 0; si < sessionsPerCourse; si += 1) {
      sessions.push(
        new Session({
          name: `Session ${si + 1}`,
          description:
            `Session ${si + 1} focuses on core concepts, guided practice, and a short check-in exercise to reinforce learning.`,
          orderIndex: si + 1,
          courseId: course._id,
          lessons: [],
        })
      );
    }
    // eslint-disable-next-line no-await-in-loop
    const createdSessions = await Session.insertMany(sessions);

    // Attach sessions to course
    course.sessions = createdSessions.map((s) => s._id);
    // eslint-disable-next-line no-await-in-loop
    await course.save();

    for (let si = 0; si < createdSessions.length; si += 1) {
      const s = createdSessions[si];
      // Always include all types: video + document + online, then add one extra lesson to reach lessonsPerSession.
      const baseLessons = [
        {
          title: `Video lesson ${si + 1}.1 — Core concept`,
          type: "video",
          duration: randInt(8, 18),
          order_index: 1,
          video_url: DEFAULT_LESSON_VIDEO_URL,
          kind: "video",
        },
        {
          title: `Reading ${si + 1}.2 — Notes & examples`,
          type: "document",
          duration: randInt(10, 20),
          order_index: 2,
          video_url: null,
          kind: "document",
        },
        {
          title: `Live session ${si + 1}.3 — Q&A and practice`,
          type: "online",
          duration: randInt(30, 90),
          order_index: 3,
          video_url: DEFAULT_MEETING_URL,
          kind: "online",
        },
      ];

      const extras = [];
      for (let li = 3; li < lessonsPerSession; li += 1) {
        const isVideo = li % 2 === 1;
        extras.push({
          title: isVideo
            ? `Video lesson ${si + 1}.${li + 1} — Guided walkthrough`
            : `Reading ${si + 1}.${li + 1} — Exercises & checklist`,
          type: isVideo ? "video" : "document",
          duration: isVideo ? randInt(8, 20) : randInt(10, 25),
          order_index: li + 1,
          video_url: isVideo ? DEFAULT_LESSON_VIDEO_URL : null,
          kind: isVideo ? "video" : "document",
        });
      }

      const lessons = [...baseLessons, ...extras].map((l, lessonIndex) => {
        return new Lesson({
          title: l.title,
          type: l.type,
          duration: l.duration,
          order_index: l.order_index,
          video_url: l.video_url,
          description: lessonMarkdown({
            kind: l.kind,
            topic: course.tag || "web",
            sessionIndex: si,
            lessonIndex,
          }),
          sessionId: s._id,
          locked: false,
        });
      });
      // eslint-disable-next-line no-await-in-loop
      const createdLessons = await Lesson.insertMany(lessons);
      s.lessons = createdLessons.map((l) => l._id);

      // Create assignment for session
      const assignment = buildAssignment({ sessionId: s._id, idx: si });
      // eslint-disable-next-line no-await-in-loop
      const createdAssignment = await assignment.save();
      s.assignment = createdAssignment._id;

      // eslint-disable-next-line no-await-in-loop
      await s.save();

      // Create some attempts for assignment
      const enrolledStudents = enrolledByCourseId.get(String(course._id)) || [];
      const sampleStudents =
        enrolledStudents.length > 0
          ? sampleWithoutReplacement(enrolledStudents, Math.min(5, enrolledStudents.length))
          : sampleWithoutReplacement(studentProfiles, Math.min(5, studentProfiles.length));
      const attempts = sampleStudents.map((stu, idx) => {
        const answers = [
          { questionIndex: 0, answer: idx % 2 === 0 ? "4" : "3" },
          {
            questionIndex: 1,
            answer:
              idx % 2 === 0
                ? "An API is an Application Programming Interface: a set of rules for software to communicate."
                : "API means a way for programs to talk to each other.",
          },
        ];
        return new Attempt({
          username: stu.username,
          assignmentId: createdAssignment._id,
          answers,
          grade: idx % 2 === 0 ? 100 : 0,
          feedback:
            idx % 2 === 0
              ? "Auto-grade: great job — correct answers."
              : "Auto-grade: please review the lesson and try again.",
          gradingMode: "auto",
          gradedAt: new Date(),
          autoSummary: { correct: idx % 2 === 0 ? 2 : 0, total: 2 },
        });
      });
      // eslint-disable-next-line no-await-in-loop
      await Attempt.insertMany(attempts);
    }

    // totalStudents from enroll map (paid only)
    const enrolledStudents = enrolledByCourseId.get(String(course._id)) || [];
    course.totalStudents = enrolledStudents.length;

    // Feedbacks (reviews) from enrolled students only
    const feedbackFrom = enrolledStudents.length
      ? sampleWithoutReplacement(enrolledStudents, Math.min(5, enrolledStudents.length))
      : [];

    const feedbacks = feedbackFrom.map((stu, idx) => {
      return new Feedback({
        rate: randInt(3, 5),
        title: `Review #${idx + 1}`,
        comment:
          idx % 2 === 0
            ? "Well-structured lessons and clear examples. The assignments help reinforce the concepts."
            : "Good pacing and practical content. I liked the mix of video, notes, and live sessions.",
        userId: stu._id,
        courseId: course._id,
      });
    });
    // eslint-disable-next-line no-await-in-loop
    if (feedbacks.length) {
      await Feedback.insertMany(feedbacks);
      course.rating =
        Math.round(
          (feedbacks.reduce((sum, f) => sum + f.rate, 0) / feedbacks.length) * 10
        ) / 10;
    } else {
      course.rating = 0;
    }
    // eslint-disable-next-line no-await-in-loop
    await course.save();
  }

  console.log("Seeded successfully.");
  await mongoose.disconnect();
}

seed().catch(async (e) => {
  console.error("Seed failed:", e);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});


