const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");

// Update cart (add/remove courses)
router.put("/", cartController.updateCart);

// Delete cart
router.delete("/", cartController.deleteCart);

// Get cart
router.get("/", cartController.getCart);

module.exports = router;
