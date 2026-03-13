const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  // Problem reference
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Submission details
  language: {
    type: String,
    required: true,
    enum: ["cpp", "python", "java"],
  },
  
  code: {
    type: String,
    required: true,
  },

  // Results
  status: {
    type: String,
    required: true,
    enum: ["accepted", "partial", "wrong_answer", "runtime_error", "compile_error", "time_limit_exceeded"],
  },
  
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  
  passedTestCases: {
    type: Number,
    required: true,
    min: 0,
  },
  
  totalTestCases: {
    type: Number,
    required: true,
    min: 1,
  },

  // Detailed test results
  testResults: [{
    testCaseIndex: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    input: {
      type: String,
      default: "",
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    actualOutput: {
      type: String,
      default: "",
    },
    executionTime: {
      type: Number,
      default: 0,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    }
  }],

  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Execution stats
  totalExecutionTime: {
    type: Number,
    default: 0,
  },
  
  memoryUsed: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

// Indexes for better query performance
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ problemId: 1, submittedAt: -1 });
submissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });
submissionSchema.index({ status: 1 });

// Virtual for problem title (populated)
submissionSchema.virtual('problemTitle', {
  ref: 'Problem',
  localField: 'problemId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'title rank' }
});

// Enable virtual fields in JSON
submissionSchema.set('toJSON', { virtuals: true });
submissionSchema.set('toObject', { virtuals: true });

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission; 