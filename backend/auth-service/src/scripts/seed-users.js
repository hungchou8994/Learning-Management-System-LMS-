/* eslint-disable no-console */
/**
 * 3) Seed full accounts on auth-service + write credentials to .txt and .json
 *
 * Usage:
 *   node src/scripts/seed-users.js --host localhost --port 5435 --user auth_user --password auth_password --db auth_db --teachers 4 --students 15
 *
 * Output (defaults):
 * - <repoRoot>/credentials.txt
 * - <repoRoot>/seed-users.json
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { parseArgs, applyAuthDbEnvFromArgs, defaultRepoRoot } = require("./_args");

function pad3(n) {
  return String(n).padStart(3, "0");
}

function buildUsers({ teacherCount, studentCount }) {
  const staff = [
    { role: "admin", username: "admin123", email: "admin123@skillgro.local", password: "Khanh9i12345." },
    { role: "manager", username: "manager_01", email: "manager_01@skillgro.local", password: "SkillGro2026A301a" },
    { role: "recruiter", username: "hr_01", email: "hr_01@skillgro.local", password: "SkillGro2026A302a" },
    { role: "accountant", username: "accountant_01", email: "accountant_01@skillgro.local", password: "SkillGro2026A303a" },
  ];

  const teachers = Array.from({ length: teacherCount }).map((_, i) => {
    const idx = i + 1;
    const username = `teacher_${pad3(idx)}`;
    return {
      role: "teacher",
      username,
      email: `${username}@skillgro.local`,
      password: `SkillGro2026T${pad3(idx)}a`,
    };
  });

  const students = Array.from({ length: studentCount }).map((_, i) => {
    const idx = i + 1;
    const username = `student_${pad3(idx)}`;
    return {
      role: "student",
      username,
      email: `${username}@skillgro.local`,
      password: `SkillGro2026S${pad3(idx)}a`,
    };
  });

  return [...staff, ...teachers, ...students];
}

function writeCredentialsTxt(outPath, users) {
  const now = new Date().toISOString();
  const lines = [
    "# SkillGro Seed Credentials",
    `# Generated at: ${now}`,
    "",
  ];
  for (const u of users) {
    lines.push(`role=${u.role}`);
    lines.push(`username=${u.username}`);
    lines.push(`email=${u.email}`);
    lines.push(`password=${u.password}`);
    lines.push("");
  }
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
}

async function main() {
  const args = parseArgs(process.argv);
  const teacherCount = Math.max(1, Math.min(50, Number(args.teachers || args.instructors || 4)));
  const studentCount = Math.max(1, Math.min(500, Number(args.students || 15)));

  if (process.env.NODE_ENV === "production") {
    console.error("Refuse to seed users in production (NODE_ENV=production).");
    process.exit(1);
  }

  applyAuthDbEnvFromArgs(args);

  const repoRoot = defaultRepoRoot();
  const outTxt = path.resolve(repoRoot, String(args.out || "credentials.txt"));
  const outJson = path.resolve(repoRoot, String(args.outJson || "seed-users.json"));

  const users = buildUsers({ teacherCount, studentCount });

  // eslint-disable-next-line global-require
  const { sequelize, User } = require("../models");

  try {
    console.log("Connecting to auth-service DB...");
    await sequelize.authenticate();
    console.log("Connected.");

    // Upsert by username so re-run doesn't explode.
    for (const u of users) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await User.findOne({ where: { username: u.username } });
      if (existing) {
        existing.email = u.email;
        existing.role = u.role;
        existing.password = u.password; // will be hashed by hook
        existing.isActive = true;
        // eslint-disable-next-line no-await-in-loop
        await existing.save();
      } else {
        // eslint-disable-next-line no-await-in-loop
        await User.create({
          username: u.username,
          email: u.email,
          password: u.password,
          role: u.role,
          isActive: true,
        });
      }
    }

    writeCredentialsTxt(outTxt, users);
    fs.writeFileSync(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), users }, null, 2), "utf8");

    console.log(`Wrote credentials: ${outTxt}`);
    console.log(`Wrote users json: ${outJson}`);
    console.log(`Summary: staff=4, teachers=${teacherCount}, students=${studentCount}, total=${users.length}`);

    await sequelize.close();
    process.exit(0);
  } catch (e) {
    console.error("Seed users failed:", e?.message || String(e));
    try {
      await sequelize.close();
    } catch {
      // ignore
    }
    process.exit(1);
  }
}

main();


