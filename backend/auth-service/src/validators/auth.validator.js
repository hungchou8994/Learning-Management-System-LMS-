const Joi = require("joi");

const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required().messages({
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
      "any.required": "Username is required",
    }),

    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    password: Joi.string()
      .min(8)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
      }),

    role: Joi.string()
      .valid(
        "admin",
        "teacher",
        "student",
        "recruiter",
        "parent",
        "accountant",
        "manager"
      )
      .default("student")
      .messages({
        "any.only": "Invalid role specified",
      }),
  });

  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().messages({
      "any.required": "Username is required",
    }),

    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  });

  return schema.validate(data);
};

const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
      .required()
      .messages({
        "string.min": "New password must be at least 8 characters long",
        "string.pattern.base":
          "New password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "New password is required",
      }),
  });

  return schema.validate(data);
};

const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  });

  return schema.validate(data);
};

const validateForgotPassword = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().messages({
      "any.required": "Username is required",
    }),
  });

  return schema.validate(data);
};

const validateResetPassword = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().messages({
      "any.required": "Username is required",
    }),
    otp: Joi.string().length(6).required().messages({
      "string.length": "OTP must be exactly 6 digits",
      "any.required": "OTP is required",
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
      .required()
      .messages({
        "string.min": "New password must be at least 8 characters long",
        "string.pattern.base":
          "New password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "New password is required",
      }),
  });

  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateForgotPassword,
  validateResetPassword,
};
