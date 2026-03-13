const Problem = require("../models/Problem");
const User = require("../models/User");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");
const mongoose = require("mongoose");
const fetch = require("node-fetch");

// Create a new problem
exports.createProblem = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    // Enforce teacher-only creation
    const role = decodedToken.role;
    const canCreate =
      role === "teacher" || role === "admin" || role === "instructor" || role === "support_teacher" || role === "manager";
    if (!canCreate) {
      return res.status(403).json({
        status: "error",
        message: "Only teachers can create problems",
      });
    }

    const username = decodedToken.username;

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Create problem with author
    const problem = new Problem({
      ...req.body,
      author: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await problem.save();

    // Populate author info for response
    await problem.populate("author", "username firstName lastName");

    return res.status(201).json({
      status: "success",
      message: "Problem created successfully",
      data: problem,
    });
  } catch (error) {
    logger.error(`Error creating problem: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error creating problem",
      error: error.message,
    });
  }
};

// Update problem
exports.updateProblem = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check if problem exists and user is authorized (author or admin)
    const existingProblem = await Problem.findById(req.params.problemId);
    if (!existingProblem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
    }

    // Check authorization (author or elevated role from auth token)
    const isAuthor = existingProblem.author.toString() === user._id.toString();
    const role = decodedToken.role;
    const isAdmin =
      role === "admin" || role === "instructor" || role === "teacher" || role === "support_teacher" || role === "manager";
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized to update this problem",
      });
    }

    // Update problem
    const problem = await Problem.findByIdAndUpdate(
      req.params.problemId,
      {
        ...req.body,
        updatedAt: new Date()
      },
      { new: true }
    ).populate("author", "username firstName lastName");

    return res.status(200).json({
      status: "success",
      message: "Problem updated successfully",
      data: problem,
    });
  } catch (error) {
    logger.error(`Error updating problem: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating problem",
      error: error.message,
    });
  }
};

// Delete problem
exports.deleteProblem = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check if problem exists and user is authorized
    const existingProblem = await Problem.findById(req.params.problemId);
    if (!existingProblem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
    }

    // Check authorization (author or elevated role from auth token)
    const isAuthor = existingProblem.author.toString() === user._id.toString();
    const role = decodedToken.role;
    const isAdmin =
      role === "admin" || role === "instructor" || role === "teacher" || role === "support_teacher" || role === "manager";
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized to delete this problem",
      });
    }

    await Problem.findByIdAndDelete(req.params.problemId);

    return res.status(200).json({
      status: "success",
      message: "Problem deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting problem: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error deleting problem",
      error: error.message,
    });
  }
};

// Get all problems with filtering and search
exports.getAllProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Filter by rank
    if (req.query.rank) {
      filter.rank = req.query.rank;
    }

    // Filter by supported languages
    if (req.query.language) {
      filter.supportedLanguages = { $in: [req.query.language] };
    }

    // Filter by tutorial mode
    if (req.query.tutorial !== undefined) {
      filter.isInteractiveTutorial = req.query.tutorial === 'true';
    }

    // Search in title and description
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'title':
          sortOption = { title: 1 };
          break;
        case 'rank':
          // Custom rank sorting: S, A, B, C, D
          sortOption = { rank: 1 };
          break;
        case 'difficulty':
          // Map ranks to difficulty numbers for sorting
          sortOption = { rank: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const totalProblems = await Problem.countDocuments(filter);
    const problems = await Problem.find(filter)
      .populate("author", "username firstName lastName")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      status: "success",
      data: {
        problems,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalProblems / limit),
          totalProblems,
          hasNextPage: page < Math.ceil(totalProblems / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          rank: req.query.rank,
          language: req.query.language,
          tutorial: req.query.tutorial,
          search: req.query.search,
          sort: req.query.sort
        }
      },
    });
  } catch (error) {
    logger.error("Error getting problems:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get problems",
      error: error.message,
    });
  }
};

// Get problem by ID
exports.getProblemById = async (req, res) => {
  try {
    const { problemId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid problem ID format",
      });
    }

    const problem = await Problem.findById(problemId)
      .populate("author", "username firstName lastName email");

    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
    }

    // Add view count (optional)
    // await Problem.findByIdAndUpdate(problemId, { $inc: { views: 1 } });

    return res.status(200).json({
      status: "success",
      data: problem,
    });
  } catch (error) {
    logger.error(`Error getting problem by ID: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error retrieving problem",
      error: error.message,
    });
  }
};

// Get problem with all test cases for submission (authenticated users only)
exports.getProblemForSubmission = async (req, res) => {
  try {
    const { problemId } = req.params;

    // Check authentication
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required to access test cases",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid problem ID format",
      });
    }

    const problem = await Problem.findById(problemId)
      .populate("author", "username firstName lastName email");

    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
    }

    // Return problem with ALL test cases (including hidden ones) for authenticated users
    return res.status(200).json({
      status: "success",
      data: {
        _id: problem._id,
        title: problem.title,
        rank: problem.rank,
        description: problem.description,
        testCases: problem.testCases, // Include ALL test cases including hidden
        supportedLanguages: problem.supportedLanguages,
        languageTemplates: problem.languageTemplates,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        author: problem.author,
        createdAt: problem.createdAt,
        updatedAt: problem.updatedAt
      },
    });
  } catch (error) {
    logger.error(`Error getting problem for submission: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error retrieving problem for submission",
      error: error.message,
    });
  }
};

// Get problem statistics
exports.getProblemStats = async (req, res) => {
  try {
    // Aggregate statistics
    const stats = await Problem.aggregate([
      {
        $group: {
          _id: "$rank",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const totalProblems = await Problem.countDocuments();
    const tutorialProblems = await Problem.countDocuments({ isInteractiveTutorial: true });

    // Count by supported languages
    const languageStats = await Problem.aggregate([
      { $unwind: "$supportedLanguages" },
      {
        $group: {
          _id: "$supportedLanguages",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent problems (last 10)
    const recentProblems = await Problem.find()
      .populate("author", "username firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title rank createdAt author");

    return res.status(200).json({
      status: "success",
      data: {
        totalProblems,
        tutorialProblems,
        regularProblems: totalProblems - tutorialProblems,
        byRank: stats,
        byLanguage: languageStats,
        recentProblems
      },
    });
  } catch (error) {
    logger.error(`Error getting problem stats: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error retrieving problem statistics",
      error: error.message,
    });
  }
};

// Simple test endpoint
exports.testDatabase = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };

    const problemCount = await Problem.countDocuments();
    
    return res.status(200).json({
      status: "success",
      data: {
        database: dbStates[dbStatus],
        problemCount: problemCount,
        mongooseVersion: mongoose.version
      }
    });
  } catch (error) {
    logger.error(`Database test error: ${error.message}`);
    return res.status(500).json({
      status: "error", 
      message: "Database test failed",
      error: error.message
    });
  }
};

// Submit problem solution
exports.submitProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { code, language } = req.body;

    // Validate inputs
    if (!code || !language) {
      return res.status(400).json({
        status: "error",
        message: "Code and language are required",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid problem ID format",
      });
    }

    // Get problem with all test cases
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
    }

    // Check if language is supported
    if (!problem.supportedLanguages.includes(language)) {
      return res.status(400).json({
        status: "error",
        message: `Language ${language} is not supported for this problem`,
        supportedLanguages: problem.supportedLanguages,
      });
    }

    // Run code against all test cases (including hidden ones)
    const submissionResults = [];
    let passedTestCases = 0;
    let totalTestCases = problem.testCases.length;

    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      
      try {
        // Call processing service
        const processingServiceUrl = process.env.PROCESSING_SERVICE_URL || 'http://processing-service:3003';
        console.log(`Calling processing service: ${processingServiceUrl}/api/process/submit`);
        
        const processingResponse = await fetch(
          `${processingServiceUrl}/api/process/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mainCode: code,
              language: language,
              inputData: testCase.input,
              expectedOutput: testCase.output,
              problemId: problemId,
            }),
          }
        );

        console.log(`Processing service HTTP status: ${processingResponse.status}`);
        
        if (!processingResponse.ok) {
          const errorText = await processingResponse.text();
          throw new Error(`Processing service returned ${processingResponse.status}: ${errorText}`);
        }

        const processingData = await processingResponse.json();
        console.log(`Processing service response:`, processingData);

        const testResult = {
          testCaseIndex: i + 1,
          passed: processingData.result?.isCorrect || false,
          input: testCase.isHidden ? "[Hidden]" : testCase.input,
          expectedOutput: testCase.isHidden ? "[Hidden]" : testCase.output,
          actualOutput: testCase.isHidden ? "[Hidden]" : processingData.result?.actualOutput || "",
          executionTime: processingData.result?.executionTime || 0,
          isHidden: testCase.isHidden,
          error: processingData.status !== "success" ? processingData.message : null,
        };

        if (testResult.passed) {
          passedTestCases++;
        }

        submissionResults.push(testResult);

      } catch (error) {
        // If processing service call fails
        console.error(`Processing service call failed for test case ${i + 1}:`, error.message);
        submissionResults.push({
          testCaseIndex: i + 1,
          passed: false,
          input: testCase.isHidden ? "[Hidden]" : testCase.input,
          expectedOutput: testCase.isHidden ? "[Hidden]" : testCase.output,
          actualOutput: "",
          executionTime: 0,
          isHidden: testCase.isHidden,
          error: `Failed to execute test case: ${error.message}`,
        });
      }
    }

    // Calculate score and status
    const score = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;
    const status = passedTestCases === totalTestCases ? "accepted" : "partial";

    // Get user info if authenticated (optional)
    let userId = null;
    try {
      const decodedToken = decodeToken(req.headers.authorization);
      if (decodedToken) {
        const user = await User.findOne({ username: decodedToken.username });
        userId = user?._id;
      }
    } catch (err) {
      // Continue without user info if token is invalid
    }

    // Prepare submission result
    const submissionResult = {
      problemId: problemId,
      userId: userId,
      language: language,
      code: code,
      status: status,
      score: score,
      passedTestCases: passedTestCases,
      totalTestCases: totalTestCases,
      testResults: submissionResults,
      submittedAt: new Date(),
    };

    // TODO: Optionally save submission to database for history tracking
    // const submission = new Submission(submissionResult);
    // await submission.save();

    return res.status(200).json({
      status: "success",
      message: `Submission completed: ${passedTestCases}/${totalTestCases} test cases passed`,
      data: submissionResult,
    });

  } catch (error) {
    logger.error(`Error submitting problem: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error processing submission",
      error: error.message,
    });
  }
}; 