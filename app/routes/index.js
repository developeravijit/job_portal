const express = require("express");
const user = require("./authRouter");
const company = require("./companyRouter");
const dashboard = require("./dashboardRoutes/dashboardRouter");
const admin = require("./adminDashboardRoutes/adminRouter");
const employer = require("./dashboardRoutes/employerRouter");

const router = express.Router();

const cloudinary = require("../config/cloudinary");
const dashboardController = require("../controller/dashboardController/dashboardController");
const authCheck = require("../middleware/dashboardMiddleware/dashboardAuthCheck");
const candidate = require("./userCandidateRouter");
const candidateRoute = require("./dashboardRoutes/candidateRouter");

/* ==========================================API Router============================================= */

// User API
router.use("/api/v1/auth", user);

// Company API
router.use("/api/v1/employer", company);

// Job Application API
router.use("/api/v1/candidate", candidate);

/* ====================================================EJS Pages Router=================================== */

// Landing Page
router.get("/", dashboardController.landingPage);

// Dashboard EJS
router.use("/job-portal", dashboard);

// employer Dashboard Pages EJS
router.use("/employer/dashboard", employer);

// Candidate Dashboard Pages EJS
router.use("/candidate", candidateRoute);

// Admin Dashboard EJS
router.use("/admin/dashboard", admin);

module.exports = router;
