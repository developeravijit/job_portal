const Joi = require("joi");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const alphabetRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).pattern(alphabetRegex).required().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 30 characters",
    "string.pattern.base": "Name cannot contain numbers or special characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().trim().required().messages({
    "string.email": "Please enter a valid email address",
    "string.empty": "Email is required",
  }),

  password: Joi.string().pattern(passwordRegex).required().messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number and special character",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Password and confirm password must match",
    "any.required": "Confirm password is required",
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be exactly 10 digits",
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
    }),

  role: Joi.string()
    .valid("user", "employer", "admin")
    .default("user")
    .messages({
      "any.only": "Role must their",
    }),
});

const verifySchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    "string.email": "Please enter a valid email address",
    "string.empty": "Email is required",
  }),

  otp: Joi.string().length(6).required().messages({
    "string.length": "OTP must be 6 digits",
    "any.required": "OTP is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    "string.email": "Please enter a valid email address",
    "string.empty": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const newPasswordSchema = Joi.object({
  password: Joi.string().pattern(passwordRegex).required().messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number and special character",
    "any.required": "Password is required",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Password and confirm password must match",
    "any.required": "Confirm password is required",
  }),
});

module.exports = {
  registerSchema,
  verifySchema,
  loginSchema,
  newPasswordSchema,
};
