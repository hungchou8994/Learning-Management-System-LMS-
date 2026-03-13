const mongoose = require("mongoose");
const Lesson = require("./src/models/Lesson");

async function fixLessonLockedStatus() {
  try {
    console.log("🔄 Starting migration to fix lesson locked status...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/elearn-test"
    );
    console.log("✅ Connected to MongoDB");

    // Get all lessons
    const lessons = await Lesson.find({});
    console.log(`📊 Found ${lessons.length} lessons to process`);

    let updatedCount = 0;

    for (const lesson of lessons) {
      // Check if locked field is missing or is false when it should be true
      if (lesson.locked === undefined || lesson.locked === null) {
        console.log(
          `🔧 Fixing lesson "${lesson.title}": setting locked = true (was undefined/null)`
        );

        lesson.locked = true; // Set default to locked
        await lesson.save();
        updatedCount++;
      } else {
        // Just log current status
        console.log(`📝 Lesson "${lesson.title}": locked = ${lesson.locked}`);
      }
    }

    console.log(`\n📈 Migration completed:`);
    console.log(`   • Total lessons: ${lessons.length}`);
    console.log(`   • Updated lessons: ${updatedCount}`);
    console.log(
      `   • Already had locked status: ${lessons.length - updatedCount}`
    );

    // Show breakdown by status
    const lockedLessons = await Lesson.countDocuments({ locked: true });
    const unlockedLessons = await Lesson.countDocuments({ locked: false });

    console.log(`\n🔒 Current status breakdown:`);
    console.log(`   • Locked lessons: ${lockedLessons}`);
    console.log(`   • Unlocked lessons: ${unlockedLessons}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

fixLessonLockedStatus();
