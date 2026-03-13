const mongoose = require("mongoose");
const Session = require("./src/models/Session");
const Lesson = require("./src/models/Lesson");

async function fixSessionLessonsLinks() {
  try {
    console.log("🔄 Starting migration to fix session-lesson links...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/elearn-test"
    );
    console.log("✅ Connected to MongoDB");

    // Get all sessions
    const sessions = await Session.find({});
    console.log(`📊 Found ${sessions.length} sessions to process`);

    let processedCount = 0;
    let fixedCount = 0;

    for (const session of sessions) {
      // Find all lessons for this session
      const lessons = await Lesson.find({ sessionId: session._id }).sort({
        order_index: 1,
      });

      // Get current lesson IDs in session
      const currentLessonIds = session.lessons.map((id) => id.toString());
      const actualLessonIds = lessons.map((lesson) => lesson._id.toString());

      // Check if lessons are missing from session
      const missingLessons = actualLessonIds.filter(
        (id) => !currentLessonIds.includes(id)
      );

      if (
        missingLessons.length > 0 ||
        currentLessonIds.length !== actualLessonIds.length
      ) {
        console.log(
          `🔧 Fixing session "${session.name}": ${lessons.length} lessons found, ${currentLessonIds.length} in session`
        );

        // Update session with correct lesson IDs
        session.lessons = lessons.map((lesson) => lesson._id);
        await session.save();

        fixedCount++;
        console.log(
          `   ✅ Fixed session "${session.name}" with ${lessons.length} lessons`
        );
      }

      processedCount++;
    }

    console.log(`\n📈 Migration completed:`);
    console.log(`   • Processed: ${processedCount} sessions`);
    console.log(`   • Fixed: ${fixedCount} sessions`);
    console.log(
      `   • Already correct: ${processedCount - fixedCount} sessions`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

fixSessionLessonsLinks();
