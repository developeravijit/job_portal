const Application = require("../model/application");
const Company = require("../model/company");
const Interview = require("../model/interview");
const Job = require("../model/job");
const Notification = require("../model/notification");
const User = require("../model/user");
const httpCodes = require("../utils/httpCode");
const {
  notificationEmail,
  selectedEmail,
  rejectedEmail,
} = require("../utils/sendEmail");
const {
  companySchema,
  jobSchema,
  interviewSchema,
  notificationSchema,
} = require("../validation/companyValidation");
const mongoose = require("mongoose");
const paginate = require("express-paginate");

class companyController {
  // Create Company
  async createCompany(req, res) {
    try {
      const { error, value } = companySchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { companyName, website, industry } = value;

      const employerID = req.user.id;

      const existingCompany = await Company.findOne({ employerID });

      if (existingCompany) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "You have already created a company",
        });
      }

      const companyData = new Company({
        employerID,
        companyName,
        website,
        industry,
      });

      const data = await companyData.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Company created successfully",
        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
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
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "No company created",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Company Details",
        data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Edit Company Details
  async editCompany(req, res) {
    try {
      const { id } = req.params;

      const updateData = await Company.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updateData) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Company not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Company data updated successfully",
        data: updateData,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Create Job
  async createJob(req, res) {
    try {
      const { error, value } = jobSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { title, description, skills, salary, location } = value;

      const employerID = req.user.id;

      const existingJob = await Job.findOne({
        employerID,
        title,
      });

      if (existingJob) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Job is already exist",
        });
      }

      const jobData = new Job({
        employerID,
        title,
        description,
        skills,
        salary,
        location,
      });

      const data = await jobData.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Job created successfully",
        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Jobs
  async showJobs(req, res) {
    try {
      const limit = Number(req.query.limit) || 6;
      const page = Number(req.query.page) || 1;
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

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All job data",
        data: {
          jobs,
          pageCount,
          itemCount,
          pages: paginate.getArrayPages(req)(4, pageCount, page),
          currentPage: page,
          limit,
          search,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Edit Job
  async editJob(req, res) {
    try {
      const { id } = req.params;

      const updateData = await Job.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updateData) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Job not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Job data updated successfully",
        data: updateData,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Create Interview
  async createInterview(req, res) {
    try {
      const { error, value } = interviewSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { applicationID, date, time, meetingLink } = value;

      const existingMeeting = await Interview.findOne({
        applicationID,
      });

      if (existingMeeting) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Meeting already set with the candidate",
        });
      }

      const application = await Application.findById(applicationID);

      if (!application) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Application not found",
        });
      }

      const data = new Interview({
        applicationID,
        date,
        time,
        meetingLink,
      });

      await data.save();

      return res.status(httpCodes.created).json({
        success: true,
        message: "Meeting link created for candidate",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update Application Status
  async applicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

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
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "No application found",
        });
      }

      const emailData = applicationData[0];

      if (status === "selected") {
        await selectedEmail(emailData);
      }

      if (status === "rejected") {
        await rejectedEmail(emailData);
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: `Application ${status} successfully`,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send Notification
  async sendNotification(req, res) {
    try {
      const { error, value } = notificationSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "User not found",
        });
      }

      const selectedCandidate = await Application.findOne({
        candidateID: user._id,
        status: "selected",
      });

      if (!selectedCandidate) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Only selected candidates can receive this notification",
        });
      }

      const { subject, message } = value;

      const company = await Company.findOne({
        employerID: req.user.id,
      });

      if (!company) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Company not found",
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

      return res.status(httpCodes.created).json({
        success: true,
        message: "Notification message sent to the candidate",
        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new companyController();
