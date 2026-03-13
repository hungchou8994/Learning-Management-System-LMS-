const mongoose = require("mongoose");

const languageStatsSchema = new mongoose.Schema({
  language: {
    type: String,
    enum: ["cpp", "python", "java"],
    required: true,
  },
  problemsSolved: {
    type: Number,
    default: 0,
  },
  submissions: {
    type: Number,
    default: 0,
  },
  acceptanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  averageExecutionTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  bestExecutionTime: {
    type: Number, // in milliseconds
  },
  totalLinesOfCode: {
    type: Number,
    default: 0,
  },
});

const rankStatsSchema = new mongoose.Schema({
  rank: {
    type: String,
    enum: ["S", "A", "B", "C", "D"],
    required: true,
  },
  solved: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
});

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  icon: {
    type: String,
  },
  category: {
    type: String,
    enum: ["problem_solving", "streak", "language", "participation", "speed"],
    default: "problem_solving",
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

const programmingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      default: 1200,
      min: 0,
    },
    maxRating: {
      type: Number,
      default: 1200,
      min: 0,
    },
    rank: {
      type: String,
      enum: ["Newbie", "Pupil", "Specialist", "Expert", "Candidate Master", "Master", "International Master", "Grandmaster"],
      default: "Newbie",
    },
    totalSolved: {
      type: Number,
      default: 0,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    overallAcceptanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastSolvedAt: {
      type: Date,
    },
    preferredLanguage: {
      type: String,
      enum: ["cpp", "python", "java"],
      default: "cpp",
    },
    languageStats: [languageStatsSchema],
    rankStats: [rankStatsSchema],
    achievements: [achievementSchema],
    solvedProblems: [{
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: true,
      },
      solvedAt: {
        type: Date,
        default: Date.now,
      },
      bestSubmissionId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      attempts: {
        type: Number,
        default: 1,
      },
    }],
    contestsParticipated: {
      type: Number,
      default: 0,
    },
    bestRankInContest: {
      type: Number,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    skills: {
      type: [String],
      default: [],
    },
    favoriteTopics: {
      type: [String],
      default: [],
    },
    // Interactive tutorial progress
    tutorialsCompleted: [{
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
      completedAt: {
        type: Date,
        default: Date.now,
      },
      stepsCompleted: {
        type: Number,
        default: 0,
      },
      totalSteps: {
        type: Number,
        default: 0,
      },
      hintsUsed: {
        type: Number,
        default: 0,
      },
    }],
    // Learning progress tracking
    learningPath: {
      currentLevel: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        default: "Beginner",
      },
      completedConcepts: {
        type: [String],
        default: [],
      },
      weakAreas: {
        type: [String],
        default: [],
      },
      recommendedProblems: [{
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },
        reason: String,
        priority: {
          type: Number,
          min: 1,
          max: 5,
          default: 3,
        },
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate overall acceptance rate and update rank
programmingProfileSchema.pre('save', function(next) {
  // Calculate overall acceptance rate
  if (this.totalSubmissions > 0) {
    this.overallAcceptanceRate = Math.round((this.totalSolved / this.totalSubmissions) * 100);
  }

  // Update max rating
  if (this.rating > this.maxRating) {
    this.maxRating = this.rating;
  }

  // Determine rank based on rating
  if (this.rating >= 3000) {
    this.rank = "Grandmaster";
  } else if (this.rating >= 2600) {
    this.rank = "International Master";
  } else if (this.rating >= 2400) {
    this.rank = "Master";
  } else if (this.rating >= 2100) {
    this.rank = "Candidate Master";
  } else if (this.rating >= 1900) {
    this.rank = "Expert";
  } else if (this.rating >= 1600) {
    this.rank = "Specialist";
  } else if (this.rating >= 1400) {
    this.rank = "Pupil";
  } else {
    this.rank = "Newbie";
  }

  next();
});

// Method to add solved problem
programmingProfileSchema.methods.addSolvedProblem = function(problemId, submissionId, attempts = 1) {
  // Check if problem already solved
  const existingSolve = this.solvedProblems.find(sp => sp.problemId.toString() === problemId.toString());
  
  if (!existingSolve) {
    this.solvedProblems.push({
      problemId,
      bestSubmissionId: submissionId,
      attempts,
    });
    this.totalSolved += 1;
    
    // Update streak
    const today = new Date();
    const lastSolved = this.lastSolvedAt;
    
    if (!lastSolved || this.isConsecutiveDay(lastSolved, today)) {
      this.currentStreak += 1;
      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }
    } else if (!this.isSameDay(lastSolved, today)) {
      this.currentStreak = 1;
    }
    
    this.lastSolvedAt = today;
  } else {
    // Update existing solve if better submission
    existingSolve.attempts += attempts;
    existingSolve.bestSubmissionId = submissionId;
  }
  
  return this.save();
};

// Helper method to check if two dates are consecutive days
programmingProfileSchema.methods.isConsecutiveDay = function(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

// Helper method to check if two dates are the same day
programmingProfileSchema.methods.isSameDay = function(date1, date2) {
  return date1.toDateString() === date2.toDateString();
};

// Method to update language stats
programmingProfileSchema.methods.updateLanguageStats = function(language, solved = false) {
  let langStat = this.languageStats.find(ls => ls.language === language);
  
  if (!langStat) {
    langStat = {
      language,
      problemsSolved: 0,
      submissions: 0,
      acceptanceRate: 0,
    };
    this.languageStats.push(langStat);
  }
  
  langStat.submissions += 1;
  if (solved) {
    langStat.problemsSolved += 1;
  }
  
  langStat.acceptanceRate = langStat.submissions > 0 
    ? Math.round((langStat.problemsSolved / langStat.submissions) * 100) 
    : 0;
    
  return this.save();
};

module.exports = mongoose.model("ProgrammingProfile", programmingProfileSchema); 