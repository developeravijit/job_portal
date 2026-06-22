const Otp = require("../../model/otp");
const User = require("../../model/user");
const httpCodes = require("../../utils/httpCode");
const {
  userEmail,
  otpEmail,
  resetPasswordEmail,
} = require("../../utils/sendEmail");
const { resetPasswordToken } = require("../../utils/token");
const {
  registerSchema,
  verifySchema,
  newPasswordSchema,
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

      const resetPassToken = resetPasswordToken(data);

      data.resetPassword = resetPassToken;
      await data.save();

      const resetPasswordLink = `${req.protocol}://${req.get("host")}/admin/reset-password/${resetPassToken}`;

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

      return res.redirect("/admin/login-page");
    } catch (error) {
      console.log(error.message);
      return res.status(httpCodes.server_error).render("500", {
        error: error.message,
      });
    }
  }

  
}

module.exports = new adminController();
