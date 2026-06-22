const Application = require("../model/application");
const Company = require("../model/company");
const Interview = require("../model/interview");
const Job = require("../model/job");
const Notification = require("../model/notification");
const User = require("../model/user");
const httpCodes = require("../utils/httpCode");
const { notificationEmail } = require("../utils/sendEmail");
const {
  companySchema,
  jobSchema,
  interviewSchema,
  notificationSchema,
} = require("../validation/companyValidation");
const mongoose = require("mongoose");

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

      const employeerID = req.user.id;

      const existingCompany = await Company.findOne({ employeerID });

      if (existingCompany) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "You have already created a company",
        });
      }

      const companyData = new Company({
        employeerID,
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

      const employeerID = req.user.id;

      const existingJob = await Job.findOne({
        employeerID,
        title,
      });

      if (existingJob) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Job is already exist",
        });
      }

      const jobData = new Job({
        employeerID,
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

  // Create Notification
  async createNotification(req, res) {
    try {
      const { error, value } = notificationSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { userID, subject, message } = value;

      const company = await Company.findOne({
        employeerID: req.user.id,
      });

      if (!company) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Company not found",
        });
      }

      const data = new Notification({
        userID,
        companyID: company._id,
        subject,
        message,
      });

      await data.save();

      const emailData = await Notification.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(data._id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userID",
            foreignField: "_id",
            as: "candidate",
          },
        },
        {
          $unwind: "$candidate",
        },
        {
          $lookup: {
            from: "companies",
            localField: "companyID",
            foreignField: "_id",
            as: "company",
          },
        },
        {
          $unwind: "$company",
        },
        {
          $project: {
            email: "$candidate.email",
            candidateName: "$candidate.name",
            companyName: "$company.companyName",
            subject: 1,
            message: 1,
          },
        },
      ]);

      if (emailData.length === 0) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Candidate or company data not found",
        });
      }

      await notificationEmail(emailData[0]);

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

  // Show All Employeers and Companies
  async showAllCompanies(req, res) {
    try {
      const data = await Company.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "employeerID",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            "user.password": 0,
            "user.refreshToken": 0,
            "user.resetPassword": 0,
          },
        },
      ]);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All Company Details",
        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show company as per employeer
  async showCompanyAsPerEmployeer(req, res) {
    try {
      const data = await Company.aggregate([
        {
          $match: {
            employeerID: new mongoose.Types.ObjectId(req.user.id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "employeerID",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            "user.password": 0,
            "user.refreshToken": 0,
            "user.resetPassword": 0,
          },
        },
      ]);

      if (data.length === 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "No company created for this employeer",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Company Details As Per Employeer",
        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Employeers who do not created any companies
  async noCompaniesEmployeer(req, res) {
    try {
      const data = await User.aggregate([
        { $match: { role: "employeer" } },
        {
          $lookup: {
            from: "companies",
            localField: "_id",
            foreignField: "employeerID",
            as: "company",
          },
        },
        {
          $match: {
            company: [],
          },
        },
      ]);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Employeers who do not have companies",
        data: {
          total: data.length,
          data,
        },
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
