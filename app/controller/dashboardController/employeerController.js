const Company = require("../../model/company");
const Job = require("../../model/job");
const Application = require("../../model/application");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCode");
const paginate = require("express-paginate");
const {
  companySchema,
  jobSchema,
} = require("../../validation/companyValidation");
const { default: mongoose } = require("mongoose");
const { selectedEmail, rejectedEmail } = require("../../utils/sendEmail");

class employeerController {
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
      const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
      const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;

      req.query.limit = limit;
      req.query.page = page;

      const [jobs, itemCount] = await Promise.all([
        Job.find({ employeerID: req.user.id })
          .limit(limit)
          .skip(req.skip)
          .lean(),
        Job.countDocuments({ employeerID: req.user.id }),
      ]);

      const pageCount = Math.max(1, Math.ceil(itemCount / limit));

      return res.render("allJobs", {
        jobs,
        pageCount,
        itemCount,
        pages: paginate.getArrayPages(req)(3, pageCount, page),
        currentPage: page,
        limit,
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

      const employeerID = new mongoose.Types.ObjectId(req.user.id);

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
              "job.employeerID": employeerID,
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
              "job.employeerID": employeerID,
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

      const employeerID = req.user.id;

      const existingCompany = await Company.findOne({ employeerID });

      if (existingCompany) {
        return res.render("createCompany", {
          error: "You have already created your company",
          success: null,
        });
      }

      const data = new Company({
        employeerID,
        companyName,
        website,
        industry,
      });

      await data.save();

      return res.redirect("/employeer/myCompany");
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
        employeerID: req.user.id,
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

      return res.redirect("/employeer/myCompany");
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

      const employeerID = req.user.id;

      const company = await Company.findOne({ employeerID });

      if (!company) {
        return res.render("createJob", {
          error: "Kindly create your company profile first",
          success: null,
        });
      }

      const existingJob = await Job.findOne({
        employeerID,
        title,
      });

      if (existingJob) {
        return res.render("createJob", {
          error: "Job already exist",
          success: null,
        });
      }

      const data = new Job({
        employeerID,
        title,
        description,
        skills,
        salary,
        location,
      });

      await data.save();

      return res.redirect("/employeer/jobs");
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

      return res.redirect("/employeer/jobs");
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
            localField: "job.employeerID",
            foreignField: "employeerID",
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
        return res.redirect("/employeer/applicants");
      }

      const emailData = applicationData[0];

      if (status === "selected") {
        await selectedEmail(emailData);
      }

      if (status === "rejected") {
        await rejectedEmail(emailData);
      }

      return res.redirect("/employeer/applicants");
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }
}

module.exports = new employeerController();
