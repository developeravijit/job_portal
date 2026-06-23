const express = require("express");
const user = require("./userRouter");
const company = require("./companyRouter");
const dashboard = require("./dashboardRoutes/dashboardRouter");
const admin = require("./adminDashboardRoutes/adminRouter");
const jobApplication = require("./jobApplicationRouter");
const employeer = require("./dashboardRoutes/employeerRouter");
const candidate = require("./dashboardRoutes/candidateRouter");

const router = express.Router();

const cloudinary = require("../config/cloudinary");
const dashboardController = require("../controller/dashboardController/dashboardController");

// Landing Page
router.get("/", dashboardController.landingPage);

// User API
router.use("/api/v1/user", user);

// Company API
router.use("/api/v1/company", company);

// Job Application API
router.use("/api/application", jobApplication);

// Dashboard EJS
router.use("/dashboard", dashboard);

// Employeer Dashboard Pages EJS
router.use("/employeer", employeer);

// Candidate Dashboard Pages EJS
router.use("/candidate", candidate);

// Admin Dashboard EJS
router.use("/admin", admin);

module.exports = router;
