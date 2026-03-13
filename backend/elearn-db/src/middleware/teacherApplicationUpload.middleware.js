const multer = require("multer");
const path = require("path");
const logger = require("../config/logger");

// Configure storage (same uploads dir)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../uploads");
    logger.info(`Using upload directory: ${uploadsDir}`);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    logger.info(`Generated filename: ${filename}`);
    cb(null, filename);
  },
});

// Allow images for ID cards and PDF for CV
const fileFilter = (req, file, cb) => {
  logger.info(
    `Received file: ${file.originalname}, mimetype: ${file.mimetype}`
  );
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed."),
      false
    );
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});


