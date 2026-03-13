const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false, // true for hidden test cases
  },
  points: {
    type: Number,
    default: 1, // points for passing this test case
  },
  explanation: {
    type: String, // explanation for the test case
  },
});

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ["cpp", "python", "java"],
    default: "cpp",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "wrong_answer", "time_limit_exceeded", "runtime_error", "compilation_error"],
    default: "pending",
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  executionTime: {
    type: Number, // in milliseconds
  },
  memoryUsed: {
    type: Number, // in KB
  },
  testCasesPassed: {
    type: Number,
    default: 0,
  },
  totalTestCases: {
    type: Number,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    rank: {
      type: String,
      enum: ["S", "A", "B", "C", "D"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    testCases: [testCaseSchema],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissions: [submissionSchema],
    tags: {
      type: [String],
      default: [],
    },
    timeLimit: {
      type: Number, // in milliseconds
      default: 5000,
    },
    memoryLimit: {
      type: Number, // in KB
      default: 256000,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert", "Master"],
      default: function() {
        const rankTodifficult = {
          "D": "Easy",
          "C": "Medium", 
          "B": "Hard",
          "A": "Expert",
          "S": "Master"
        };
        return rankTodifficult[this.rank] || "Medium";
      }
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Multi-language support
    languageTemplates: {
      cpp: {
        type: String,
        default: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
      },
      python: {
        type: String,
        default: "# Your code here\n",
      },
      java: {
        type: String,
        default: "public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
      },
    },
    supportedLanguages: {
      type: [String],
      enum: ["cpp", "python", "java"],
      default: ["cpp", "python", "java"],
    },
    // Interactive tutorial mode
    isInteractiveTutorial: {
      type: Boolean,
      default: false,
    },
    tutorialSteps: [{
      stepNumber: {
        type: Number,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      hint: {
        type: String,
      },
      codeTemplate: {
        cpp: String,
        python: String,
        java: String,
      },
      expectedOutput: {
        type: String,
      },
      isCompleted: {
        type: Boolean,
        default: false,
      },
    }],
    hints: [{
      level: {
        type: Number, // 1 = basic hint, 2 = detailed hint, 3 = solution approach
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      cost: {
        type: Number, // points deducted for using hint
        default: 0,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate acceptance rate
problemSchema.pre('save', function(next) {
  if (this.totalSubmissions > 0) {
    this.acceptanceRate = Math.round((this.solvedCount / this.totalSubmissions) * 100);
  }
  next();
});

// Method to add submission
problemSchema.methods.addSubmission = function(submissionData) {
  this.submissions.push(submissionData);
  this.totalSubmissions += 1;
  
  if (submissionData.status === 'accepted') {
    this.solvedCount += 1;
  }
  
  return this.save();
};

module.exports = mongoose.model("Problem", problemSchema); 