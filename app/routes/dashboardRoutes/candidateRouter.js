const express = require("express");
const candidateController = require("../../controller/dashboardController/candidateController");
const authCheck = require("../../middleware/dashboardMiddleware/dashboardAuthCheck");
const permission = require("../../middleware/dashboardMiddleware/dashboardPermission");
const uploadResume = require("../../middleware/resumeUpload");
const uploadImage = require("../../middleware/imageUpload,js");

const candidate = express.Router();

// Profile Page
candidate.get(
  "/profile",
  authCheck,
  permission("user"),
  candidateController.profilePage,
);

// Profile Update
candidate.get(
  "/profile/update",
  authCheck,
  permission("user"),
  candidateController.updateProfilePage,
);
candidate.post(
  "/profile/update",
  authCheck,
  permission("user"),
  uploadImage.single("avatar"),
  candidateController.updateProfile,
);

// Apply Job
candidate.post(
  "/apply/job/:jobID",
  authCheck,
  permission("user"),
  uploadResume.single("resume"),
  candidateController.applyJob,
);

// Save JOb
candidate.post(
  "/save-job/:jobID",
  authCheck,
  permission("user"),
  candidateController.saveJob,
);
candidate.get(
  "/saved/jobs",
  authCheck,
  permission("user"),
  candidateController.saveJobPage,
);

module.exports = candidate;
