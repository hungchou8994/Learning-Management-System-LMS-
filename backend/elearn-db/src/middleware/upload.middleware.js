const multer = require("multer");
const path = require("path");
const logger = require("../config/logger");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use relative path to uploads directory
    const uploadsDir = path.join(__dirname, "../uploads");
    logger.info(`Using upload directory: ${uploadsDir}`);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);
    logger.info(`Generated filename: ${filename}`);
    cb(null, filename);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  logger.info(
    `Received file: ${file.originalname}, mimetype: ${file.mimetype}`
  );
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    logger.info(`File type ${file.mimetype} is allowed`);
    cb(null, true);
  } else {
    logger.error(`Invalid file type: ${file.mimetype}`);
    cb(
      new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."),
      false
    );
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
