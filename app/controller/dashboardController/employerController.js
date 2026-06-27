const Company = require("../../model/company");
const Job = require("../../model/job");
const Application = require("../../model/application");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCode");
const paginate = require("express-paginate");
const {
  companySchema,
  jobSchema,
  notificationSchema,
} = require("../../validation/companyValidation");
const mongoose = require("mongoose");
const {
  selectedEmail,
  rejectedEmail,
  notificationEmail,
} = require("../../utils/sendEmail");
const Notification = require("../../model/notification");

class employerController {
  // employer Home Page
  async employerHomePage(req, res) {
    try {
      const user = await User.findById(req.user.id);

      const totalJobs = await Job.countDocuments({
        employerID: req.user.id,
      });

      const company = await Company.findOne(
        { employerID: req.user.id },
        { companyName: 1 },
      ).lean();

      const employerJobs = await Job.find(
        { employerID: req.user.id },
        { _id: 1 },
      );

      const jobIds = employerJobs.map((job) => job._id);

      const totalApplicants = await Application.countDocuments({
        jobID: { $in: jobIds },
      });

      const selectedCandidates = await Application.countDocuments({
        jobID: { $in: jobIds },
        status: "selected",
      });

      const reviewingCandidates = await Application.countDocuments({
        jobID: { $in: jobIds },
        status: "reviewing",
      });

      const recentApplicants = await Application.aggregate([
        {
          $match: {
            jobID: { $in: jobIds },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "candidateID",
            foreignField: "_id",
            as: "candidate",
          },
        },
        {
          $unwind: "$candidate",
        },
        {
          $lookup: {
            from: "jobs",
            localField: "jobID",
            foreignField: "_id",
            as: "job",
          },
        },
        {
          $unwind: "$job",
        },
        {
          $project: {
            candidateName: "$candidate.name",
            jobTitle: "$job.title",
            status: 1,
            createdAt: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 5,
        },
      ]);

      res.render("employerHome", {
        user,
        companyName: company?.companyName || "No Company Created",
        totalJobs,
        totalApplicants,
        selectedCandidates,
        reviewingCandidates,
        recentApplicants,
      });
    } catch (error) {
      return res.status(500).render("500", {
        error: error.message,
      });
    }
  }

  // Create Company Page
  async createCompanyPage(req, res) {
    res.render("createCompany", {
      error: null,
      success: null,
    });
  }

  // Edit Company Page
  async editCompanyPage(req, res) {
    try {
      const { id } = req.params;

      const company = await Company.findById(id);

      if (!company) {
        return res.render("myCompany", {
          company: [],
          error: "Company not found",
          success: null,
        });
      }

      return res.render("editCompany", {
        company,
        error: null,
        success: null,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Show All Jobs Page
  async allJobs(req, res) {
    try {
      const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 4;
      const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const matchStage = {
        employerID: new mongoose.Types.ObjectId(req.user.id),
        status: true,
      };

      if (search) {
        const regex = new RegExp(search, "i");

        matchStage.$or = [
          { title: regex },
          { skills: regex },
          { location: regex },
          { description: regex },
        ];
      }

      const result = await Job.aggregate([
        {
          $match: matchStage,
        },
        {
          $facet: {
            jobs: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const jobs = result[0].jobs;
      const itemCount = result[0].totalCount[0]?.count || 0;
      const pageCount = Math.max(1, Math.ceil(itemCount / limit));

      return res.render("allJobs", {
        jobs,
        pageCount,
        itemCount,
        pages: paginate.getArrayPages(req)(4, pageCount, page),
        currentPage: page,
        limit,
        search,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Single Job Page
  async jobDetails(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findById(id);

      if (!job) {
        return res.status(httpCodes.not_found).render("500", {
          error: "Job not found",
        });
      }

      return res.render("jobDetails", {
        job,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Show All Applicants Page
  async applicantsPage(req, res) {
    try {
      const limit = 5;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const employerID = new mongoose.Types.ObjectId(req.user.id);

      const [applications, totalData] = await Promise.all([
        Application.aggregate([
          {
            $lookup: {
              from: "jobs",
              localField: "jobID",
              foreignField: "_id",
              as: "job",
            },
          },
          {
            $unwind: "$job",
          },
          {
            $match: {
              "job.employerID": employerID,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "candidateID",
              foreignField: "_id",
              as: "candidate",
            },
          },
          {
            $unwind: "$candidate",
          },
          {
            $project: {
              _id: 1,
              applicationID: "$_id",
              candidateID: "$candidate._id",
              status: 1,
              createdAt: 1,
              resume: 1,
              public_id: 1,

              candidateName: "$candidate.name",
              candidateEmail: "$candidate.email",
              candidatePhone: "$candidate.phone",

              jobTitle: "$job.title",
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ]),

        Application.aggregate([
          {
            $lookup: {
              from: "jobs",
              localField: "jobID",
              foreignField: "_id",
              as: "job",
            },
          },
          {
            $unwind: "$job",
          },
          {
            $match: {
              "job.employerID": employerID,
            },
          },
          {
            $count: "total",
          },
        ]),
      ]);

      const itemCount = totalData[0]?.total || 0;
      const pageCount = Math.ceil(itemCount / limit);

      return res.render("applicants", {
        applications,
        hasApplicants: applications.length > 0,
        currentPage: page,
        pageCount,
        req,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Create Job Page
  async createJobPage(req, res) {
    res.render("createJob", {
      error: null,
      success: null,
    });
  }

  // Edit Job Page
  async editJobPage(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findById(id);

      if (!job) {
        return res.render("allJobs", {
          jobs: [],
          error: "Job not found",
          success: null,
        });
      }

      return res.render("editJob", {
        job,
        error: null,
        success: null,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Deleted Job Page
  async deletedJobsPage(req, res) {
    try {
      const jobs = await Job.find({
        employerID: req.user.id,
        status: false,
      }).lean();

      return res.render("deletedJobs", {
        jobs,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Restore Job
  async restoreJob(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findOne({
        _id: id,
        status: false,
      });

      if (!job) {
        return res.status(httpCodes.not_found).render("500", {
          error: "Job not found to restore",
        });
      }

      const restoreJob = await Job.findByIdAndUpdate(
        id,
        { status: true },
        { new: true, runValidators: true },
      );

      return res.redirect("/employer/dashboard/deleted/jobs");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Create Company
  async createCompany(req, res) {
    try {
      const { error, value } = companySchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("createCompany", {
          error: error.details[0].message,
          success: null,
        });
      }

      const { companyName, website, industry } = value;
      console.log(req.user);
      console.log(req.user.id);

      const employerID = req.user.id;

      const existingCompany = await Company.findOne({ employerID });

      if (existingCompany) {
        return res.render("createCompany", {
          error: "You have already created your company",
          success: null,
        });
      }

      const data = new Company({
        employerID,
        companyName,
        website,
        industry,
      });

      await data.save();

      return res.redirect("/employer/dashboard/myCompany");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Show Company
  async showCompany(req, res) {
    try {
      const data = await Company.find({
        employerID: req.user.id,
      });

      if (!data || data.length === 0) {
        return res.render("myCompany", {
          company: [],
          error: "Kindly create your company",
          success: null,
        });
      }

      return res.render("myCompany", {
        company: data,
        error: null,
        success: null,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Edit Company
  async editCompany(req, res) {
    try {
      const { id } = req.params;

      const updateData = await Company.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updateData) {
        return res.render("myCompany", {
          company: [],
          error: "Company not found",
          success: null,
        });
      }

      return res.redirect("/employer/dashboard/myCompany");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Create Job
  async createJob(req, res) {
    try {
      const { error, value } = jobSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("createJob", {
          error: error.details[0].message,
          success: null,
        });
      }
      const { title, description, skills, salary, location } = value;

      const employerID = req.user.id;

      const company = await Company.findOne({ employerID });

      if (!company) {
        return res.render("createJob", {
          error: "Kindly create your company profile first",
          success: null,
        });
      }

      const existingJob = await Job.findOne({
        employerID,
        title,
      });

      if (existingJob) {
        return res.render("createJob", {
          error: "Job already exist",
          success: null,
        });
      }

      const data = new Job({
        employerID,
        title,
        description,
        skills,
        salary,
        location,
      });

      await data.save();

      return res.redirect("/employer/dashboard/jobs");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Edit Job
  async editJob(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = jobSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const job = await Job.findById(id);

        return res.render("editJob", {
          job,
          error: error.details[0].message,
          success: null,
        });
      }

      const { title, description, skills, salary, location } = value;

      const updateData = await Job.findByIdAndUpdate(
        id,
        {
          title,
          description,
          skills,
          salary,
          location,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updateData) {
        return res.render("editJob", {
          job: {},
          error: "Job not found",
          success: null,
        });
      }

      return res.redirect("/employer/dashboard/jobs");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Delete Job
  async deleteJob(req, res) {
    try {
      const { id } = req.params;
      const job = await Job.findOne({
        _id: id,
        status: true,
      });

      if (!job) {
        return res.status(httpCodes.not_found).render("500", {
          error: "Job not found to delete",
        });
      }

      const deleteJob = await Job.findByIdAndUpdate(
        id,
        { status: false },
        { new: true, runValidators: true },
      );

      return res.redirect("/employer/dashboard/jobs");
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Change Applicant Status
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, redirectTo } = req.body;

      await Application.findByIdAndUpdate(id, { status }, { new: true });

      const applicationData = await Application.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "candidateID",
            foreignField: "_id",
            as: "candidate",
          },
        },
        {
          $unwind: "$candidate",
        },
        {
          $lookup: {
            from: "jobs",
            localField: "jobID",
            foreignField: "_id",
            as: "job",
          },
        },
        {
          $unwind: "$job",
        },
        {
          $lookup: {
            from: "companies",
            localField: "job.employerID",
            foreignField: "employerID",
            as: "company",
          },
        },
        {
          $unwind: "$company",
        },
        {
          $project: {
            candidateName: "$candidate.name",
            email: "$candidate.email",
            companyName: "$company.companyName",
            jobTitle: "$job.title",
          },
        },
      ]);

      if (!applicationData.length) {
        return res.redirect("/employer/dashboard/applicants");
      }

      const emailData = applicationData[0];

      if (status === "selected") {
        await selectedEmail(emailData);
      }

      if (status === "rejected") {
        await rejectedEmail(emailData);
      }

      return res.redirect(redirectTo || "/employer/dashboard/applicants");
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Notification Page
  async notificationPage(req, res) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(httpCodes.not_found).render("500", {
          error: "User not found to send notification",
        });
      }

      return res.render("notification", {
        user,
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Send Notification
  async sendNotification(req, res) {
    try {
      const { error, value } = notificationSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.status(httpCodes.bad_request).render("500", {
          error: error.details[0].message,
        });
      }

      const user = await User.findById(req.params.id);

      const { subject, message } = value;

      const company = await Company.findOne({
        employerID: req.user.id,
      });

      if (!user || !company) {
        return res.status(httpCodes.not_found).render("500", {
          error: "No data found",
        });
      }

      const data = new Notification({
        userID: user._id,
        companyID: company._id,
        subject,
        message,
      });

      await data.save();

      await notificationEmail({
        email: user.email,
        candidateName: user.name,
        companyName: company.companyName,
        employerName: req.user.name,
        subject,
        message,
      });

      return res.redirect("/employer/dashboard/applicants");
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }
}

module.exports = new employerController();
