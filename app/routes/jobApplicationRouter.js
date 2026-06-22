const express = require("express");
const authCheck = require("../middleware/authCheck");
const permission = require("../middleware/permission");
const uploadResume = require("../middleware/resumeUpload");
const userJobApplicationController = require("../controller/userJobApplicationController");

const jobApplication = express.Router();

// Submit Job Application
jobApplication.post(
  "/apply-job/:jobID",
  authCheck,
  permission("user"),
  uploadResume.single("resume"),
  userJobApplicationController.createJobApplication,
);

// Show Jobs
jobApplication.get(
  "/all-jobs",
  authCheck,
  permission("user"),
  userJobApplicationController.findJob,
);

// Save Jobs
jobApplication.post(
  "/save-job/:jobID",
  authCheck,
  permission("user"),
  userJobApplicationController.saveJob,
);

// Show Employeer Notifications
jobApplication.get(
  "/show-notification",
  authCheck,
  permission("user"),
  userJobApplicationController.showNotification,
);

// Read Notification
jobApplication.patch(
  "/read-notification/:notificationID",
  authCheck,
  permission("user"),
  userJobApplicationController.readNotification,
);

module.exports = jobApplication;
