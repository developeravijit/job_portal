const Joi = require("joi");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const now = new Date();
now.setHours(0, 0, 0, 0);

const companySchema = Joi.object({
  companyName: Joi.string().min(2).max(50).required().messages({
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name cannot exceed 50 characters",
    "any.required": "Company Name is required",
  }),

  website: Joi.string().trim().messages({
    "string.empty": "Website is required",
  }),

  industry: Joi.string().messages({
    "string.empty": "Industry is required",
  }),
});

const jobSchema = Joi.object({
  title: Joi.string().min(3).max(50).required().messages({
    "string.min": "Job title must be at least 3 characters",
    "string.max": "Job title cannot exceed 50 characters",
    "any.required": "Job title is required",
  }),

  description: Joi.string().min(10).required().messages({
    "string.min": "Job description must be at least 10 characters",
    "any.required": "Job description is required",
  }),

  skills: Joi.string().messages({
    "string.empty": "Skills are required",
  }),

  salary: Joi.string().messages({
    "string.empty": "salary is required",
  }),

  location: Joi.string().messages({
    "string.empty": "location is required",
  }),
});

const interviewSchema = Joi.object({
  date: Joi.date().min(now).required().messages({
    "date.min": "Interview date cannot be the past date",
    "any.required": "Interview Date is required",
  }),

  time: Joi.string().pattern(timeRegex).required().messages({
    "string.empty": "Time is required",
    "string.pattern.base": "Time must be in HH:mm format",
  }),

  meetingLink: Joi.string().uri().messages({
    "string.empty": "Time is required",
    "string.uri": "Meeting link must be a valid URL",
  }),
});

const notificationSchema = Joi.object({
  subject: Joi.string().min(3).max(100).required().messages({
    "string.min": "Notification subject must be at least 3 characters",
    "string.max": "Notification subject cannot exceed 100 characters",
    "any.required": "Notification subject is required",
  }),

  message: Joi.string().min(3).max(5000).required().messages({
    "string.min": "Notification message must be at least 3 characters",
    "string.max": "Notification message cannot exceed 5000 characters",
    "any.required": "Notification message is required",
  }),
});

module.exports = {
  companySchema,
  jobSchema,
  interviewSchema,
  notificationSchema,
};
