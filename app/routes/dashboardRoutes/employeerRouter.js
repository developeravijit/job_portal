const express = require("express");
const paginate = require("express-paginate");
const employeerController = require("../../controller/dashboardController/employeerController");
const authCheck = require("../../middleware/dashboardMiddleware/dashboardAuthCheck");
const permission = require("../../middleware/dashboardMiddleware/dashboardPermission");

const employeer = express.Router();

// Create Company
employeer.get(
  "/create/company",
  authCheck,
  permission("employeer"),
  employeerController.createCompanyPage,
);
employeer.post(
  "/create/company",
  authCheck,
  permission("employeer"),
  employeerController.createCompany,
);

// Show Company
employeer.get(
  "/myCompany",
  authCheck,
  permission("employeer"),
  employeerController.showCompany,
);

// Edit Company
employeer.get(
  "/edit/company/:id",
  authCheck,
  permission("employeer"),
  employeerController.editCompanyPage,
);
employeer.post(
  "/edit/company/:id",
  authCheck,
  permission("employeer"),
  employeerController.editCompany,
);

// Create Job
employeer.get(
  "/create/job",
  authCheck,
  permission("employeer"),
  employeerController.createJobPage,
);
employeer.post(
  "/create/job",
  authCheck,
  permission("employeer"),
  employeerController.createJob,
);

// Show All Jobs
employeer.get(
  "/jobs",
  authCheck,
  permission("employeer"),
  paginate.middleware(10, 50),
  employeerController.allJobs,
);

// Show All Applicants
employeer.get(
  "/applicants",
  authCheck,
  permission("employeer"),
  employeerController.applicantsPage,
);

// Show Single Job Details Page
employeer.get(
  "/job/:id",
  authCheck,
  permission("employeer"),
  employeerController.jobDetails,
);

// Edit Job
employeer.get(
  "/job/edit/:id",
  authCheck,
  permission("employeer"),
  employeerController.editJobPage,
);
employeer.post(
  "/job/edit/:id",
  authCheck,
  permission("employeer"),
  employeerController.editJob,
);

// Change Status
employeer.post(
  "/application/status/:id",
  authCheck,
  permission("employeer"),
  employeerController.changeStatus,
);

module.exports = employeer;
