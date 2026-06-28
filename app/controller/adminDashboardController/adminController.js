const Company = require("../../model/company");
const Otp = require("../../model/otp");
const User = require("../../model/user");
const {
  adminAccessToken,
  adminRefreshToken,
} = require("../../utils/adminToken");
const httpCodes = require("../../utils/httpCode");
const {
  userEmail,
  otpEmail,
  resetPasswordEmail,
} = require("../../utils/sendEmail");
const {
  registerSchema,
  verifySchema,
  newPasswordSchema,
  loginSchema,
} = require("../../validation/userValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class adminController {
  // Admin Register Page
  async adminRegisterPage(req, res) {
    res.render("adminRegister", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Verify Page
  async adminVerifyPage(req, res) {
    res.render("adminVerify", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Admin Login page
  async adminLoginPage(req, res) {
    res.render("adminLogin", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Admin Forgot Password Page
  async adminForgotPasswordPage(req, res) {
    res.render("adminForgotPassword", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Admin Reset Password Page
  async adminResetPasswordPage(req, res) {
    try {
      const { token } = req.params;

      const data = await User.findOne({
        resetPassword: token,
        role: "admin",
      });

      if (!data) {
        return res.render("adminForgotPassword", {
          error: "Invalid or expired reset link",
          success: null,
          oldData: {},
        });
      }

      return res.render("adminResetPassword", {
        token,
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

  // Admin Register
  async adminRegister(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("adminRegister", {
          error: error.details[0].message,
          oldData: req.body,
          success: null,
        });
      }

      const { name, email, password, confirmPassword, phone } = value;

      const existingAdmin = await User.findOne({ email });

      if (existingAdmin) {
        if (!existingAdmin.isVerified) {
          return res.render("adminVerify", {
            email: existingAdmin.email,
            error: "Admin already exist kindly verify your account",
            success: null,
          });
        }
        return res.render("adminLogin", {
          error: "Admin already exist",
          success: null,
          oldData: {
            email: existingAdmin.email,
          },
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userData = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role: "admin",
      });

      const data = await userData.save();

      await otpEmail(data);

      return res.render("adminVerify", {
        email: data.email,
        role: data.role,
        error: null,
        success: "Admin register successfully",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Admin Login
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("adminLogin", {
          error: error.details[0].message,
          oldData: req.body,
        });
      }

      const { email, password } = value;

      const data = await User.findOne({
        email,
        role: "admin",
      });

      if (!data) {
        return res.render("adminLogin", {
          error: "Invalid email id",
          success: null,
          oldData: req.body,
        });
      }

      const isMatch = await bcrypt.compare(password, data.password);

      if (!isMatch) {
        return res.render("adminLogin", {
          error: "Invalid Password",
          success: null,
          oldData: req.body,
        });
      }

      const accessToken = adminAccessToken(data);
      const refreshToken = adminRefreshToken(data);

      data.refreshToken = refreshToken;

      await data.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect("/admin/dashboard/home");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Verify Admin
  async adminVerify(req, res) {
    try {
      const { error, value } = verifySchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("adminRegister", {
          email: req.body.email,
          error: error.details[0].message,
          oldData: req.body,
        });
      }

      const { email, otp } = value;

      const data = await User.findOne({ email });

      if (!data) {
        return res.render("adminVerify", {
          email,
          error: "Admin not found",
          success: null,
        });
      }

      if (data.isVerified) {
        return res.render("adminLogin", {
          error: "Admin is already verified kindly login",
          success: null,
          oldData: {
            email: req.body?.email || "",
          },
        });
      }

      const verifyAdmin = await Otp.findOne({
        userID: data._id,
        otp,
      });

      if (!verifyAdmin) {
        return res.render("adminVerify", {
          email,
          error: "Invalid OTP",
          success: null,
        });
      }

      const tenMinutes = 10 * 60 * 1000;

      if (Date.now() - verifyAdmin.createdAt.getTime() > tenMinutes) {
        await Otp.deleteOne({ _id: verifyAdmin._id });

        return res.render("adminVerify", {
          email,
          error: "OTP has expired. Please resend OTP.",
          success: null,
        });
      }

      data.isVerified = true;
      const result = await data.save();

      await userEmail(result);

      await Otp.deleteMany({
        userID: data._id,
      });

      return res.render("adminLogin", {
        error: null,
        success: "Admin verified successfully",
        oldData: {
          email: data.email,
        },
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      const data = await User.findOne({ email });

      if (!data) {
        return res.render("adminVerify", {
          email,
          error: "Admin not found",
          success: null,
        });
      }

      if (data.isVerified) {
        return res.render("adminLogin", {
          error: "Admin already verified",
          success: null,
          oldData: {
            email: data.email,
          },
        });
      }

      const existingOTP = await Otp.findOne({
        userID: data._id,
      });

      if (existingOTP) {
        return res.render("adminVerify", {
          email,
          error: "You did not send another otp until previous one expire",
          success: null,
        });
      }

      await otpEmail(data);

      return res.render("adminVerify", {
        email,
        error: null,
        success: "New otp sent to your email id",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Admin Forgot Password
  async adminForgotPassword(req, res) {
    try {
      const { email } = req.body;

      const data = await User.findOne({ email });

      if (!data) {
        return res.render("adminForgotPassword", {
          error: "Admin not found",
          success: null,
          oldData: {
            email,
          },
        });
      }

      if (!data.status) {
        return res.render("adminForgotPassword", {
          error: "User not active",
          success: null,
          oldData: {
            email,
          },
        });
      }

      const resetPassToken = adminResetPasswordToken(data);

      data.resetPassword = resetPassToken;
      await data.save();

      const resetPasswordLink = `${req.protocol}://${req.get("host")}/admin/dashboard/reset-password/${resetPassToken}`;

      await resetPasswordEmail(data, resetPasswordLink);

      return res.render("adminForgotPassword", {
        error: null,
        success: "Password reset link sent to your email",
        oldData: {},
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Admin Reset Password
  async adminResetPassword(req, res) {
    try {
      const { token } = req.params;

      const { error, value } = newPasswordSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("adminRegister", {
          token,
          error: error.details[0].message,
          oldData: req.body,
        });
      }

      const { password, confirmPassword } = value;

      const decoded = jwt.verify(token, process.env.JWT_RESET_PASSWORD);

      const data = await User.findOne({
        _id: decoded.id,
        resetPassword: token,
      });

      if (!data) {
        return res.render("adminForgotPassword", {
          token,
          error: "Reset password link has expired kindly sent again",
          success: null,
        });
      }

      const isOld = await bcrypt.compare(password, data.password);

      if (isOld) {
        return res.render("adminResetPassword", {
          token,
          error: "Password should be different from old Password",
          success: null,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      data.password = hashedPassword;
      data.resetPassword = null;

      await data.save();

      return res.redirect("/admin/dashboard/login");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const data = await User.findById(req.user.id);

      if (!data) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.redirect("/admin/dashboard/login");
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      data.refreshToken = null;
      await data.save();
      return res.redirect("/admin/dashboard/login");
    } catch (error) {
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Admin Home Page
  async homePage(req, res) {
    try {
      const admin = await User.findById(req.user.id);

      if (!admin) {
        return res.status(httpCodes.not_found).render("500", {
          error: "Admin not found",
        });
      }
      const [dashboardData] = await User.aggregate([
        {
          $facet: {
            totalUsers: [
              {
                $match: {
                  role: "user",
                },
              },
              {
                $count: "count",
              },
            ],

            totalEmployers: [
              {
                $match: {
                  role: "employer",
                },
              },
              {
                $count: "count",
              },
            ],

            totalAdmins: [
              {
                $match: {
                  role: "admin",
                },
              },
              {
                $count: "count",
              },
            ],

            totalCompanies: [
              {
                $lookup: {
                  from: "companies",
                  pipeline: [
                    {
                      $count: "count",
                    },
                  ],
                  as: "companies",
                },
              },
              {
                $project: {
                  count: {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$companies.count", 0],
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],

            totalJobs: [
              {
                $lookup: {
                  from: "jobs",
                  pipeline: [
                    {
                      $count: "count",
                    },
                  ],
                  as: "jobs",
                },
              },
              {
                $project: {
                  count: {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$jobs.count", 0],
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],

            activeJobs: [
              {
                $lookup: {
                  from: "jobs",
                  pipeline: [
                    {
                      $match: {
                        status: true,
                      },
                    },
                    {
                      $count: "count",
                    },
                  ],
                  as: "jobs",
                },
              },
              {
                $project: {
                  count: {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$jobs.count", 0],
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],

            totalApplications: [
              {
                $lookup: {
                  from: "applications",
                  pipeline: [
                    {
                      $count: "count",
                    },
                  ],
                  as: "applications",
                },
              },
              {
                $project: {
                  count: {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$applications.count", 0],
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],

            totalInterviews: [
              {
                $lookup: {
                  from: "interviews",
                  pipeline: [
                    {
                      $count: "count",
                    },
                  ],
                  as: "interviews",
                },
              },
              {
                $project: {
                  count: {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$interviews.count", 0],
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],

            unreadNotifications: [
              {
                $lookup: {
                  from: "notifications",
                  pipeline: [
                    {
                      $match: {
                        isRead: false,
                      },
                    },
                    {
                      $count: "count",
                    },
                  ],
                  as: "notifications",
                },
              },
              {
                $project: {
                  count: {
                    $ifNull: [
                      {
                        $arrayElemAt: ["$notifications.count", 0],
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $limit: 1,
              },
            ],
          },
        },
      ]);

      const dashboard = {
        totalUsers: dashboardData.totalUsers[0]?.count || 0,
        totalEmployers: dashboardData.totalEmployers[0]?.count || 0,
        totalAdmins: dashboardData.totalAdmins[0]?.count || 0,
        totalCompanies: dashboardData.totalCompanies[0]?.count || 0,
        totalJobs: dashboardData.totalJobs[0]?.count || 0,
        activeJobs: dashboardData.activeJobs[0]?.count || 0,
        totalApplications: dashboardData.totalApplications[0]?.count || 0,
        totalInterviews: dashboardData.totalInterviews[0]?.count || 0,
        unreadNotifications: dashboardData.unreadNotifications[0]?.count || 0,
      };

      return res.render("adminHome", {
        admin,
        dashboard,
        activePage: "dashboard",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // All Candidates
  async candidates(req, res) {
    try {
      const limit = Number(req.query.limit) || 6;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const admin = await User.findById(req.user.id);

      const match = { role: "user" };

      if (search) {
        match.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const totalCandidates = await User.countDocuments(match);

      const candidates = await User.aggregate([
        {
          $match: match,
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
      ]);

      const totalPages = Math.ceil(totalCandidates / limit);

      return res.render("allCandidate", {
        admin,
        candidates,
        totalCandidates,
        currentPage: page,
        totalPages,
        search,
        activePage: "candidates",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // All Employers
  async employers(req, res) {
    try {
      const limit = Number(req.query.limit) || 6;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const admin = await User.findById(req.user.id);

      const match = { role: "employer" };

      if (search) {
        match.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const totalemployers = await User.countDocuments(match);

      const employers = await User.aggregate([
        {
          $match: match,
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
      ]);

      const totalPages = Math.ceil(totalemployers / limit);

      return res.render("allemployers", {
        admin,
        employers,
        totalemployers,
        currentPage: page,
        totalPages,
        search,
        activePage: "employers",
      });
    } catch (error) {
      console.log(error.message);

      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // All Companies
  async companies(req, res) {
    try {
      const limit = Number(req.query.limit) || 6;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const admin = await User.findById(req.user.id);

      const match = {};

      if (search) {
        match.$or = [
          {
            companyName: {
              $regex: search,
              $options: "i",
            },
          },
          {
            industry: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const totalCompanies = await Company.countDocuments(match);

      const companies = await Company.aggregate([
        {
          $match: match,
        },
        {
          $lookup: {
            from: "users",
            localField: "employerID",
            foreignField: "_id",
            as: "employer",
          },
        },
        {
          $unwind: {
            path: "$employer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "jobs",
            localField: "_id",
            foreignField: "companyID",
            as: "jobs",
          },
        },
        {
          $addFields: {
            totalJobs: {
              $size: "$jobs",
            },
          },
        },
        {
          $project: {
            companyName: 1,
            website: 1,
            industry: 1,
            createdAt: 1,
            totalJobs: 1,
            employerName: "$employer.name",
            employerEmail: "$employer.email",
            employerStatus: "$employer.status",
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
      ]);

      const totalPages = Math.ceil(totalCompanies / limit);

      return res.render("companies", {
        admin,
        companies,
        totalCompanies,
        currentPage: page,
        totalPages,
        search,
        activePage: "companies",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }
}

module.exports = new adminController();
