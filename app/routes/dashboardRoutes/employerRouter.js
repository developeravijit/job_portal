const express = require("express");
const paginate = require("express-paginate");
const employerController = require("../../controller/dashboardController/employerController");
const authCheck = require("../../middleware/dashboardMiddleware/dashboardAuthCheck");
const permission = require("../../middleware/dashboardMiddleware/dashboardPermission");

const employer = express.Router();

// Home Page
employer.get(
  "/home",
  authCheck,
  permission("employer"),
  employerController.employerHomePage,
);

// Create Company
employer.get(
  "/create/company",
  authCheck,
  permission("employer"),
  employerController.createCompanyPage,
);
employer.post(
  "/create/company",
  authCheck,
  permission("employer"),
  employerController.createCompany,
);

// Show Company
employer.get(
  "/myCompany",
  authCheck,
  permission("employer"),
  employerController.showCompany,
);

// Edit Company
employer.get(
  "/edit/company/:id",
  authCheck,
  permission("employer"),
  employerController.editCompanyPage,
);
employer.post(
  "/edit/company/:id",
  authCheck,
  permission("employer"),
  employerController.editCompany,
);

// Create Job
employer.get(
  "/create/job",
  authCheck,
  permission("employer"),
  employerController.createJobPage,
);
employer.post(
  "/create/job",
  authCheck,
  permission("employer"),
  employerController.createJob,
);

// Show All Jobs
employer.get(
  "/jobs",
  authCheck,
  permission("employer"),
  paginate.middleware(10, 50),
  employerController.allJobs,
);

// Show All Applicants
employer.get(
  "/applicants",
  authCheck,
  permission("employer"),
  employerController.applicantsPage,
);

// Show Single Job Details Page
employer.get(
  "/job/:id",
  authCheck,
  permission("employer"),
  employerController.jobDetails,
);

// Edit Job
employer.get(
  "/job/edit/:id",
  authCheck,
  permission("employer"),
  employerController.editJobPage,
);
employer.post(
  "/job/edit/:id",
  authCheck,
  permission("employer"),
  employerController.editJob,
);

// Delete Job
employer.post(
  "/job/delete/:id",
  authCheck,
  permission("employer"),
  employerController.deleteJob,
);
employer.get(
  "/deleted/jobs",
  authCheck,
  permission("employer"),
  employerController.deletedJobsPage,
);

// Restore Job
employer.post(
  "/restore-job/:id",
  authCheck,
  permission("employer"),
  employerController.restoreJob,
);

// Change Status
employer.post(
  "/application/status/:id",
  authCheck,
  permission("employer"),
  employerController.changeStatus,
);

// Notification
employer.get(
  "/notification/:id",
  authCheck,
  permission("employer"),
  employerController.notificationPage,
);
employer.post(
  "/send-notification/:id",
  authCheck,
  permission("employer"),
  employerController.sendNotification,
);

module.exports = employer;
