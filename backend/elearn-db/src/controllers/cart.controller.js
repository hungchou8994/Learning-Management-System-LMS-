const Cart = require("../models/Cart");
const Course = require("../models/Course");
const logger = require("../config/logger");
const { decodeToken } = require("../utils/jwt.utils");

/**
 * Update user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateCart = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const { action, courseId } = req.body;

    let cart = await Cart.findOne({ username });
    if (!cart) {
      cart = new Cart({ username, course_ids: [] });
    }

    if (action === "add") {
      if (!cart.course_ids.includes(courseId)) {
        cart.course_ids.push(courseId);
      }
    } else if (action === "remove") {
      cart.course_ids = cart.course_ids.filter((id) => id !== courseId);
    }

    cart.updatedAt = new Date();
    await cart.save();

    return res.status(200).json({
      status: "success",
      message: "Cart updated successfully",
      data: {
        username: cart.username,
        course_ids: cart.course_ids,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error updating cart: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error updating cart",
      error: error.message,
    });
  }
};

/**
 * Delete user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteCart = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    await Cart.findOneAndDelete({ username });

    return res.status(200).json({
      status: "success",
      message: "Cart cleared successfully",
    });
  } catch (error) {
    logger.error(`Error deleting cart: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error deleting cart",
      error: error.message,
    });
  }
};

/**
 * Get user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCart = async (req, res) => {
  try {
    const decodedToken = decodeToken(req.headers.authorization);
    if (!decodedToken) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or missing token",
      });
    }

    const username = decodedToken.username;
    const cart = await Cart.findOne({ username });
    if (!cart) {
      return res.status(200).json({
        status: "success",
        data: {
          username,
          courses: [],
          total: 0,
          updatedAt: new Date(),
        },
      });
    }

    const courses = await Course.find({ _id: { $in: cart.course_ids } });
    const total = courses.reduce((sum, course) => sum + course.salePrice, 0);

    return res.status(200).json({
      status: "success",
      data: {
        username: cart.username,
        courses: courses.map((course) => ({
          id: course._id,
          name: course.name,
          shortDescription: course.shortDescription,
          originalPrice: course.originalPrice,
          salePrice: course.salePrice,
          thumbnail: course.thumbnail,
        })),
        total,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error getting cart: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Error getting cart",
      error: error.message,
    });
  }
};
