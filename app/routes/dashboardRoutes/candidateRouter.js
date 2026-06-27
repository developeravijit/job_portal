const express = require("express");
const candidateController = require("../../controller/dashboardController/candidateController");
const authCheck = require("../../middleware/dashboardMiddleware/dashboardAuthCheck");
const permission = require("../../middleware/dashboardMiddleware/dashboardPermission");
const uploadResume = require("../../middleware/resumeUpload");
const uploadImage = require("../../middleware/imageUpload,js");

const candidateRoute = express.Router();

// Home Page
candidateRoute.get(
  "/home",
  authCheck,
  permission("user"),
  candidateController.userHomePage,
);

// Profile Page
candidateRoute.get(
  "/profile",
  authCheck,
  permission("user"),
  candidateController.profilePage,
);

// Profile Update
candidateRoute.get(
  "/profile/update",
  authCheck,
  permission("user"),
  candidateController.updateProfilePage,
);
candidateRoute.post(
  "/profile/update",
  authCheck,
  permission("user"),
  uploadImage.single("avatar"),
  candidateController.updateProfile,
);

// Apply Job
candidateRoute.post(
  "/apply/job/:jobID",
  authCheck,
  permission("user"),
  uploadResume.single("resume"),
  candidateController.applyJob,
);

// Save JOb
candidateRoute.post(
  "/save-job/:jobID",
  authCheck,
  permission("user"),
  candidateController.saveJob,
);
candidateRoute.get(
  "/saved/jobs",
  authCheck,
  permission("user"),
  candidateController.saveJobPage,
);

module.exports = candidateRoute;
