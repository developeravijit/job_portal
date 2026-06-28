const Application = require("../../model/application");
const Company = require("../../model/company");
const Job = require("../../model/job");
const Notification = require("../../model/notification");
const Otp = require("../../model/otp");
const SaveJob = require("../../model/saveJob");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCode");
const {
  otpEmail,
  userEmail,
  resetPasswordEmail,
} = require("../../utils/sendEmail");
const {
  resetPasswordToken,
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/token");
const {
  registerSchema,
  verifySchema,
  newPasswordSchema,
  loginSchema,
} = require("../../validation/userValidation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class dashboardController {
  // Landing Page
  async landingPage(req, res) {
    try {
      const jobs = await Job.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: "companies",
            localField: "employerID",
            foreignField: "employerID",
            as: "company",
          },
        },
        {
          $unwind: {
            path: "$company",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      const statistics = await Job.aggregate([
        {
          $facet: {
            totalJobs: [
              {
                $count: "count",
              },
            ],

            totalCompanies: [
              {
                $lookup: {
                  from: "companies",
                  localField: "employerID",
                  foreignField: "employerID",
                  as: "company",
                },
              },
              {
                $unwind: "$company",
              },
              {
                $group: {
                  _id: "$company._id",
                },
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ]);

      res.render("landingPage", {
        jobs,
        totalJobs: statistics[0].totalJobs[0]?.count || 0,
        totalCompanies: statistics[0].totalCompanies[0]?.count || 0,
      });
    } catch (error) {
      return res.status(500).render("500", {
        error: error.message,
      });
    }
  }

  // User Register Page
  async userRegisterPage(req, res) {
    res.render("userRegister", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // employer Register Page
  async employerRegisterPage(req, res) {
    res.render("employerRegister", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Verify Page
  async verifyPage(req, res) {
    res.render("verify", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Login Page
  async loginPage(req, res) {
    res.render("login", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Forgot Password Page
  async forgotPasswordPage(req, res) {
    res.render("forgotPassword", {
      error: null,
      success: null,
      oldData: {},
    });
  }

  // Reset Password Page
  async resetPasswordPage(req, res) {
    try {
      const { token } = req.params;

      const data = await User.findOne({ resetPassword: token });

      if (!data) {
        return res.render("forgotPassword", {
          error: "Invalid or expired reset link",
          success: null,
          oldData: {},
        });
      }

      return res.render("resetPassword", {
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

  // User Register
  async userRegister(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("userRegister", {
          error: error.details[0].message,
          oldData: req.body,
          success: null,
        });
      }

      const { name, email, password, confirmPassword, phone } = value;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        if (!existingUser.isVerified) {
          return res.render("verify", {
            email: existingUser.email,
            error: "User already exist kindly verify your account",
            success: null,
          });
        }

        return res.render("login", {
          error: "User already exist",
          success: null,
          oldData: {
            email: existingUser.email,
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
        role: "user",
      });

      const data = await userData.save();

      await otpEmail(data);

      return res.render("verify", {
        email: data.email,
        role: data.role,
        error: null,
        success: "User created kindly verify your email",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // employer Register
  async employerRegister(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("employerRegister", {
          error: error.details[0].message,
          oldData: req.body,
        });
      }

      const { name, email, password, confirmPassword, phone } = value;

      const existingemployer = await User.findOne({ email });

      if (existingemployer) {
        if (!existingemployer.isVerified) {
          return res.render("verify", {
            email: existingemployer.email,
            error: "User already exist kindly verify your account",
            success: null,
          });
        }

        return res.render("login", {
          error: "User already exist",
          success: null,
          oldData: {
            email: existingemployer.email,
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
        role: "employer",
      });

      const data = await userData.save();

      await otpEmail(data);

      return res.render("verify", {
        email: data.email,
        role: data.role,
        error: null,
        success: "employer created kindly verify your email",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Verify User/employer
  async verifyUser(req, res) {
    try {
      const { error, value } = verifySchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("register", {
          email: req.body.email,
          error: error.details[0].message,
          oldData: req.body,
        });
      }

      const { email, otp } = value;

      const data = await User.findOne({ email });

      if (!data) {
        return res.render("verify", {
          email,
          error: "User not found",
          success: null,
        });
      }

      if (data.isVerified) {
        return res.redirect("/job-portal/login", {
          error: "User is already verified kindly login",
          success: null,
        });
      }

      const verifyUser = await Otp.findOne({
        userID: data._id,
        otp,
      });

      if (!verifyUser) {
        return res.render("verify", {
          email,
          error: "Invalid OTP",
          success: null,
        });
      }

      data.isVerified = true;

      const result = await data.save();

      await userEmail(result);

      await Otp.deleteMany({
        userID: data._id,
      });

      return res.redirect("/job-portal/login");
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
        return res.render("verify", {
          email,
          error: "User not found",
          success: null,
        });
      }

      if (data.isVerified) {
        return res.render("login", {
          error: "User already verified",
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
        return res.render("verify", {
          email,
          error: "You did not send another otp until previous one expire",
          success: null,
        });
      }

      await otpEmail(data);

      return res.render("verify", {
        email,
        error: null,
        success: "New otp sent successfully",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Forgot Password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const data = await User.findOne({ email });

      if (!data) {
        return res.render("forgotPassword", {
          error: "User not found",
          success: null,
          oldData: {
            email,
          },
        });
      }

      if (!data.status) {
        return res.render("forgotPassword", {
          error: "User not active",
          success: null,
          oldData: {
            email,
          },
        });
      }

      if (data.role === "admin") {
        return res.render("forgotPassword", {
          error: "Admin password reset is not available",
          success: null,
          oldData: {
            email,
          },
        });
      }

      const resetPassToken = resetPasswordToken(data);

      data.resetPassword = resetPassToken;
      await data.save();

      const resetPasswordLink = `${req.protocol}://${req.get("host")}/job-portal/reset-password/${resetPassToken}`;

      await resetPasswordEmail(data, resetPasswordLink);

      return res.render("forgotPassword", {
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

  // Reset Password
  async resetPassword(req, res) {
    try {
      const { token } = req.params;

      const { error, value } = newPasswordSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("userRegister", {
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
        return res.render("forgotPassword", {
          token,
          error: "Reset password link has expired kindly sent again",
          success: null,
        });
      }

      const isOld = await bcrypt.compare(password, data.password);

      if (isOld) {
        return res.render("resetPassword", {
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

      return res.redirect("/job-portal/login");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  // Login To Dashboard
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const messages = error.details.map((item) => item.message);

        return res.render("login", {
          error: error.details[0].message,
          oldData: req.body,
        });
      }

      const { email, password } = value;

      const data = await User.findOne({ email });

      if (!data) {
        return res.render("login", {
          error: "Invalid email id",
          success: null,
          oldData: req.body,
        });
      }

      if (!data.isVerified) {
        return res.render("login", {
          error:
            data.role === "employer"
              ? "employer not verified"
              : "User not verified",
          success: null,
          oldData: req.body,
        });
      }

      if (!data.status) {
        return res.render("login", {
          error:
            data.role === "employer"
              ? "employer not active"
              : "User not active",
          success: null,
          oldData: req.body,
        });
      }

      const isMatch = await bcrypt.compare(password, data.password);

      if (!isMatch) {
        return res.render("login", {
          error: "Invalid Password",
          success: null,
          oldData: req.body,
        });
      }

      const accessToken = generateAccessToken(data);
      const refreshToken = generateRefreshToken(data);

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

      if (data.role === "user") {
        return res.redirect("/candidate/home");
      }

      if (data.role === "employer") {
        return res.redirect("/employer/dashboard/home");
      }
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
      const user = await User.findById(req.user.id);

      if (!user) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.redirect("/job-portal/login");
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      user.refreshToken = null;
      await user.save();

      return res.redirect("/job-portal/login");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }
}

module.exports = new dashboardController();
