const Submission = require("../models/Submission");
const User = require("../models/User");
const Problem = require("../models/Problem");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");
const mongoose = require("mongoose");

// Create/Save a submission
exports.createSubmission = async (req, res) => {
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

    const {
      problemId,
      language,
      code,
      status,
      score,
      passedTestCases,
      totalTestCases,
      testResults,
      totalExecutionTime,
      memoryUsed
    } = req.body;

    // Validate required fields
    if (!problemId || !language || !code || !status || score === undefined || 
        passedTestCases === undefined || totalTestCases === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid problem ID format",
      });
    }

    // Check if problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
    }

    // Create submission
    const submission = new Submission({
      problemId,
      userId: user._id,
      language,
      code,
      status,
      score,
      passedTestCases,
      totalTestCases,
      testResults: testResults || [],
      totalExecutionTime: totalExecutionTime || 0,
      memoryUsed: memoryUsed || 0,
      submittedAt: new Date()
    });

    await submission.save();

    // Populate problem info for response
    await submission.populate("problemId", "title rank");

    return res.status(201).json({
      status: "success",
      message: "Submission saved successfully",
      data: submission,
    });

  } catch (error) {
    logger.error(`Error creating submission: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error saving submission",
      error: error.message,
    });
  }
};

// Get user's submission history
exports.getUserSubmissions = async (req, res) => {
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

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const filter = { userId: user._id };
    
    if (req.query.problemId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.problemId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid problem ID format",
        });
      }
      filter.problemId = req.query.problemId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.language) {
      filter.language = req.query.language;
    }

    // Sort options
    let sortOption = { submittedAt: -1 }; // Default: newest first
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'oldest':
          sortOption = { submittedAt: 1 };
          break;
        case 'score':
          sortOption = { score: -1, submittedAt: -1 };
          break;
        case 'status':
          sortOption = { status: 1, submittedAt: -1 };
          break;
        default:
          sortOption = { submittedAt: -1 };
      }
    }

    const totalSubmissions = await Submission.countDocuments(filter);
    const submissions = await Submission.find(filter)
      .populate("problemId", "title rank")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select("-code -testResults"); // Don't return code and detailed test results for list view

    return res.status(200).json({
      status: "success",
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSubmissions / limit),
          totalSubmissions,
          hasNextPage: page < Math.ceil(totalSubmissions / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          problemId: req.query.problemId,
          status: req.query.status,
          language: req.query.language,
          sort: req.query.sort
        }
      },
    });

  } catch (error) {
    logger.error(`Error getting user submissions: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error retrieving submissions",
      error: error.message,
    });
  }
};

// Get submission detail by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { submissionId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid submission ID format",
      });
    }

    // Find the user by username to get their ObjectId
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const submission = await Submission.findOne({
      _id: submissionId,
      userId: user._id // Ensure user can only see their own submissions
    }).populate("problemId", "title rank description");

    if (!submission) {
      return res.status(404).json({
        status: "error",
        message: "Submission not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: submission,
    });

  } catch (error) {
    logger.error(`Error getting submission: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error retrieving submission",
      error: error.message,
    });
  }
};

// Get submission statistics for user
exports.getUserSubmissionStats = async (req, res) => {
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

    // Aggregate statistics
    const stats = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] }
          },
          averageScore: { $avg: "$score" },
          maxScore: { $max: "$score" },
          languages: { $addToSet: "$language" }
        }
      }
    ]);

    // Status breakdown
    const statusStats = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent submissions (last 10)
    const recentSubmissions = await Submission.find({ userId: user._id })
      .populate("problemId", "title rank")
      .sort({ submittedAt: -1 })
      .limit(10)
      .select("problemId status score submittedAt");

    // Problems solved (unique accepted problems)
    const solvedProblems = await Submission.aggregate([
      { 
        $match: { 
          userId: user._id, 
          status: "accepted" 
        } 
      },
      {
        $group: {
          _id: "$problemId"
        }
      },
      {
        $count: "uniqueProblems"
      }
    ]);

    const result = {
      totalSubmissions: stats[0]?.totalSubmissions || 0,
      acceptedSubmissions: stats[0]?.acceptedSubmissions || 0,
      averageScore: Math.round(stats[0]?.averageScore || 0),
      maxScore: stats[0]?.maxScore || 0,
      languages: stats[0]?.languages || [],
      problemsSolved: solvedProblems[0]?.uniqueProblems || 0,
      statusBreakdown: statusStats,
      recentSubmissions
    };

    return res.status(200).json({
      status: "success",
      data: result,
    });

  } catch (error) {
    logger.error(`Error getting submission stats: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error retrieving submission statistics",
      error: error.message,
    });
  }
}; 