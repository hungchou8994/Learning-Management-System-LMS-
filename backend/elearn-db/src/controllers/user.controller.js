const User = require("../models/User");
const mongoose = require("mongoose");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");

function requireDevAndSecretKey(req, res) {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ status: "error", message: "Not found" });
    return false;
  }
  const serverKey = process.env.CENTER_SECRET_KEY;
  if (!serverKey) {
    res
      .status(500)
      .json({ status: "error", message: "Thiếu CENTER_SECRET_KEY trên server." });
    return false;
  }
  const headerKey = req.headers["x-center-secret"];
  if (!headerKey || String(headerKey) !== String(serverKey)) {
    res.status(403).json({ status: "error", message: "Forbidden" });
    return false;
  }
  return true;
}

/**
 * Dev-only: Upsert a minimal user profile by username (used by center-fe /secret)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.upsertUserProfileBySecret = async (req, res) => {
  try {
    if (!requireDevAndSecretKey(req, res)) return;

    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    if (!username) {
      return res.status(400).json({
        status: "error",
        message: "Dữ liệu không hợp lệ (username).",
      });
    }

    const now = new Date();
    const doc = await User.findOneAndUpdate(
      { username },
      {
        $set: { updatedAt: now },
        $setOnInsert: { username, createdAt: now },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: "success",
      data: { username: doc.username, createdAt: doc.createdAt, updatedAt: doc.updatedAt },
    });
  } catch (error) {
    logger.error(`Error upserting user profile by secret: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error creating user profile",
      error: error.message,
    });
  }
};

/**
 * Create a new user (Register)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createUser = async (req, res) => {
  try {
    // Log the authorization header
    logger.info(`Authorization header: ${req.headers.authorization}`);

    // Decode JWT token from Authorization header
    const decodedToken = decodeToken(req.headers.authorization);
    logger.info(`Decoded token: ${JSON.stringify(decodedToken)}`);

    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    // Extract username from decoded token
    const username = decodedToken.username;
    logger.info(`Extracted username from token: ${username}`);

    if (!username) {
      return res.status(401).json({
        status: "error",
        message: "Username not found in token",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "User already exists",
      });
    }

    // Create new user
    const newUser = new User({
      username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address: req.body.address,
      dob: req.body.dob,
      bio: req.body.bio,
      phoneNumber: req.body.phoneNumber,
      avatarUrl: req.body.avatarUrl,
      coverUrl: req.body.coverUrl,
      skill: req.body.skill,
      socialShare: req.body.socialShare ? req.body.socialShare.split(",") : [],
    });

    await newUser.save();

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        username: newUser.username,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error creating user",
      error: error.message,
    });
  }
};

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

/**
 * Get users by usernames (batch) - for admin/manager to get profiles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUsersByUsernames = async (req, res) => {
  try {
    const { usernames } = req.body;

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "usernames array is required",
      });
    }

    const users = await User.find({
      username: { $in: usernames },
    }).select("username firstName lastName phoneNumber avatarUrl bio address dob skill");

    return res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    logger.error(`Error fetching users by usernames: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error fetching users",
      error: error.message,
    });
  }
};

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Search user profiles by name or username (for messenger-fe)
 * Query:
 *  - q: string (required)
 *  - mode: "name" | "username" (optional, default "name")
 *  - limit: number (optional, default 20, max 50)
 */
exports.searchUserProfiles = async (req, res) => {
  try {
    const qRaw = typeof req.query?.q === "string" ? req.query.q : "";
    const q = String(qRaw || "").trim();
    const mode = String(req.query?.mode || "name").trim().toLowerCase();
    const limitRaw = parseInt(String(req.query?.limit || "20"), 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, limitRaw)) : 20;

    if (!q) {
      return res.status(400).json({
        status: "error",
        message: "q is required",
      });
    }

    let filter = {};
    if (mode === "username") {
      const rx = new RegExp(escapeRegex(q), "i");
      filter = { username: rx };
    } else {
      // Name mode: support multi-token search, e.g. "Ngoc Tran" matches firstName/lastName in any order.
      const tokens = q.split(/\s+/).map((t) => t.trim()).filter(Boolean).slice(0, 5);
      const and = tokens.map((t) => {
        const rx = new RegExp(escapeRegex(t), "i");
        return { $or: [{ firstName: rx }, { lastName: rx }] };
      });

      // If the user types a single token, allow matching username too (helps discovery).
      if (tokens.length <= 1) {
        const rx = new RegExp(escapeRegex(q), "i");
        filter = { $or: [{ firstName: rx }, { lastName: rx }, { username: rx }] };
      } else {
        filter = { $and: and };
      }
    }

    const users = await User.find(filter)
      .select("username firstName lastName avatarUrl")
      .limit(limit)
      .sort({ username: 1 });

    return res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    logger.error(`Error searching users: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error searching users",
      error: error.message,
    });
  }
};

/**
 * Get user by username
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

/**
 * Update user information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserInformation = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { firstName, lastName, address, dob, bio, phoneNumber, skill } =
      req.body;

    const $set = { updatedAt: new Date() };
    if (firstName !== undefined) $set.firstName = firstName;
    if (lastName !== undefined) $set.lastName = lastName;
    if (address !== undefined) $set.address = address;
    if (dob !== undefined) $set.dob = dob;
    if (bio !== undefined) $set.bio = bio;
    if (phoneNumber !== undefined) $set.phoneNumber = phoneNumber;
    if (skill !== undefined) $set.skill = skill;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set, $setOnInsert: { username } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User information updated successfully",
      data: {
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        address: updatedUser.address,
        dob: updatedUser.dob,
        bio: updatedUser.bio,
        phoneNumber: updatedUser.phoneNumber,
        skill: updatedUser.skill,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating user information: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating user information",
      error: error.message,
    });
  }
};

/**
 * Update user information by username (for admin/manager)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserInformationByUsername = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    // Check if user is admin or manager
    const requesterRole = decodedToken.role;
    if (requesterRole !== "admin" && requesterRole !== "manager") {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: Only admin and manager can update other users",
      });
    }

    const { username } = req.params;
    const { firstName, lastName, address, dob, bio, phoneNumber, skill } =
      req.body;

    if (!username) {
      return res.status(400).json({
        status: "error",
        message: "Username is required",
      });
    }

    const $set = { updatedAt: new Date() };
    if (firstName !== undefined) $set.firstName = firstName;
    if (lastName !== undefined) $set.lastName = lastName;
    if (address !== undefined) $set.address = address;
    if (dob !== undefined) $set.dob = dob;
    if (bio !== undefined) $set.bio = bio;
    if (phoneNumber !== undefined) $set.phoneNumber = phoneNumber;
    if (skill !== undefined) $set.skill = skill;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set, $setOnInsert: { username } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User information updated successfully",
      data: {
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        address: updatedUser.address,
        dob: updatedUser.dob,
        bio: updatedUser.bio,
        phoneNumber: updatedUser.phoneNumber,
        skill: updatedUser.skill,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating user information by username: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating user information",
      error: error.message,
    });
  }
};

/**
 * Update user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserPassword = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Note: Password update should be handled by Auth service
    return res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error(`Error updating password: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating password",
      error: error.message,
    });
  }
};

/**
 * Update user social share
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserSocialShare = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { socialShare } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        socialShare,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Social share updated successfully",
      data: {
        username: updatedUser.username,
        socialShare: updatedUser.socialShare,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating social share: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating social share",
      error: error.message,
    });
  }
};

/**
 * Update user avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserAvatar = async (req, res) => {
  try {
    logger.info("Starting avatar update process");
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      logger.error("Invalid or missing token");
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    logger.info(`Updating avatar for user: ${username}`);

    if (!req.file) {
      logger.error("No file uploaded");
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    logger.info(
      `File uploaded: ${req.file.originalname}, saved as: ${req.file.filename}`
    );

    // Construct the URL for the uploaded file
    const avatarUrl = `/uploads/${req.file.filename}`;
    logger.info(`Generated avatar URL: ${avatarUrl}`);

    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        avatarUrl,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      logger.error(`User not found: ${username}`);
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    logger.info(`Avatar updated successfully for user: ${username}`);
    return res.status(200).json({
      status: "success",
      message: "Avatar updated successfully",
      data: {
        username: updatedUser.username,
        avatarUrl: updatedUser.avatarUrl,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating avatar: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating avatar",
      error: error.message,
    });
  }
};

/**
 * Update user cover photo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserCover = async (req, res) => {
  try {
    logger.info("Starting cover photo update process");
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      logger.error("Invalid or missing token");
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    logger.info(`Updating cover photo for user: ${username}`);

    if (!req.file) {
      logger.error("No file uploaded");
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    logger.info(
      `File uploaded: ${req.file.originalname}, saved as: ${req.file.filename}`
    );

    // Construct the URL for the uploaded file
    const coverUrl = `/uploads/${req.file.filename}`;
    logger.info(`Generated cover URL: ${coverUrl}`);

    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        coverUrl,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      logger.error(`User not found: ${username}`);
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    logger.info(`Cover photo updated successfully for user: ${username}`);
    return res.status(200).json({
      status: "success",
      message: "Cover photo updated successfully",
      data: {
        username: updatedUser.username,
        coverUrl: updatedUser.coverUrl,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating cover photo: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating cover photo",
      error: error.message,
    });
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
// NOTE: deleteUser is implemented later using req.user from auth middleware.

/**
 * Get user information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUser = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        dob: user.dob,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        skill: user.skill,
        socialShare: user.socialShare,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error getting user: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting user",
      error: error.message,
    });
  }
};

// Get instructor information (public)
exports.getInstructorInfo = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    // Convert string ID to MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(instructorId);

    const instructor = await User.findOne({
      _id: objectId,
    }).select("username firstName lastName avatarUrl bio skill socialShare");

    if (!instructor) {
      return res.status(404).json({
        status: "error",
        message: "Instructor not found",
      });
    }

    // Convert MongoDB document to plain object and add id field
    const instructorData = instructor.toObject();
    instructorData.id = instructorData._id.toString();

    res.json({
      status: "success",
      data: instructorData,
    });
  } catch (error) {
    logger.error("Error getting instructor info:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get instructor information",
    });
  }
};

// Get user information (protected)
exports.getUserInfo = async (req, res) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      data: user,
    });
  } catch (error) {
    logger.error("Error getting user info:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get user information",
    });
  }
};

// Update user password (protected)
exports.updatePassword = async (req, res) => {
  try {
    const username = req.user.username;
    const { currentPassword, newPassword } = req.body;

    // Note: Password update should be handled by Auth service
    res.json({
      status: "success",
      message: "Password update request sent to Auth service",
    });
  } catch (error) {
    logger.error("Error updating password:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update password",
    });
  }
};

// Update social share (protected)
exports.updateSocialShare = async (req, res) => {
  try {
    const username = req.user.username;
    const { socialShare } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { socialShare, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      message: "Social share updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating social share:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update social share",
    });
  }
};

// Update user avatar (protected)
exports.updateUserAvatar = async (req, res) => {
  try {
    const username = req.user.username;
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!avatarUrl) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { avatarUrl, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      message: "Avatar updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating avatar:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update avatar",
    });
  }
};

// Update user cover (protected)
exports.updateUserCover = async (req, res) => {
  try {
    const username = req.user.username;
    const coverUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!coverUrl) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { coverUrl, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      message: "Cover photo updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating cover:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update cover photo",
    });
  }
};

// Delete user (protected)
exports.deleteUser = async (req, res) => {
  try {
    const username = req.user.username;
    const deletedUser = await User.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete user",
    });
  }
};
