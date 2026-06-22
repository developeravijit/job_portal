const User = require("../model/user");
const httpCodes = require("../utils/httpCode");
const bcrypt = require("bcrypt");
const Otp = require("../model/otp");
const {
  registerSchema,
  verifySchema,
  loginSchema,
  newPasswordSchema,
} = require("../validation/userValidation");
const {
  otpEmail,
  userEmail,
  resetPasswordEmail,
} = require("../utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  resetPasswordToken,
} = require("../utils/token");
const jwt = require("jsonwebtoken");

class userController {
  // Register
  async register(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { name, email, password, confirmPassword, phone, role } = value;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User already exist",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userData = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
      });

      const result = await userData.save();

      const data = result.toObject();

      await otpEmail(data);

      delete data.password;

      return res.status(httpCodes.created).json({
        success: true,
        message:
          data.role === "employeer"
            ? "Employeer register successfully"
            : data.role === "admin"
              ? "Admin register successfully"
              : "User register successfully",

        data: data,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Email Verify
  async verifyUser(req, res) {
    try {
      const { error, value } = verifySchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { email, otp } = value;

      const data = await User.findOne({ email });

      if (!data) {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "Email is not valid",
        });
      }

      if (data.isVerified) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User already verified",
        });
      }

      const verifyUser = await Otp.findOne({
        userID: data._id,
        otp,
      });

      if (!verifyUser) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "OTP is not valid",
        });
      }

      data.isVerified = true;

      const result = await data.save();

      await userEmail(result);

      await Otp.deleteMany({
        userID: data._id,
      });

      return res.status(httpCodes.ok).json({
        success: true,
        message:
          data.role === "employeer"
            ? "Employeer verified successfully"
            : data.role == "admin"
              ? "Admin verified successfully"
              : "User verified successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Rsend OTP
  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      const data = await User.findOne({ email });

      if (!data) {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "Email is not valid",
        });
      }

      if (data.isVerified) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User already verified",
        });
      }

      const existingOTP = await Otp.findOne({
        userID: data._id,
      });

      if (existingOTP) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "New otp will send after 10 minutes",
        });
      }

      await otpEmail(data);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "OTP resend successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { email, password } = value;

      const userData = await User.findOne({ email });

      if (!userData) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid email id",
        });
      }

      if (!userData.isVerified) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message:
            userData.role === "admin"
              ? "Admin is not verified"
              : userData.role === "employeer"
                ? "Employeer is not verified"
                : "User is not verified",
        });
      }

      if (!userData.status) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message:
            userData.role === "admin"
              ? "Admin is not active"
              : userData.role === "employeer"
                ? "Employeer is not active"
                : "User is not active",
        });
      }

      const isMatch = await bcrypt.compare(password, userData.password);

      if (!isMatch) {
        return res.status(httpCodes.forbidden).json({
          success: false,
          message: "Invalid credential",
        });
      }

      const accessToken = generateAccessToken(userData);
      const refreshToken = generateRefreshToken(userData);

      userData.refreshToken = refreshToken;

      const result = await userData.save();

      const data = result.toObject();
      delete data.password;
      delete data.refreshToken;

      return res.status(httpCodes.ok).json({
        success: true,
        message:
          data.role === "admin"
            ? "Admin login successfully"
            : data.role === "employeer"
              ? "Employeer login successfully"
              : "User login successfully",

        data: {
          data: data,
          token: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // New Access Token
  async newToken(req, res) {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const data = await User.findById(decoded.id);

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User not found",
        });
      }

      if (data.refreshToken !== refreshToken) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid token",
        });
      }

      const newAccessToken = generateAccessToken(data);

      return res.status(httpCodes.created).json({
        success: true,
        message: "New accesstoken created successfully",
        accessToken: newAccessToken,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Forgot Password Link
  async resetPasswordLink(req, res) {
    try {
      const { email } = req.body;

      const data = await User.findOne({ email });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Invalid email address",
        });
      }

      if (!data.isVerified) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message:
            data.role === "admin"
              ? "Admin is not verified"
              : data.role === "employeer"
                ? "Employeer is not verified"
                : "User is not verified",
        });
      }

      if (!data.status) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message:
            data.role === "admin"
              ? "Admin is not active"
              : data.role === "employeer"
                ? "Employeer is not active"
                : "User is not active",
        });
      }

      const resetPassToken = resetPasswordToken(data);

      data.resetPassword = resetPassToken;

      await data.save();

      const resetPasswordLink = `${req.protocol}://${req.get("host")}/api/v1/user/reset-password/${resetPassToken}`;

      await resetPasswordEmail(data, resetPasswordLink);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Reset Password link sent to your register email id",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Reset Password
  async resetPassword(req, res) {
    try {
      const { token } = req.params;

      const { error, value } = newPasswordSchema.validate(req.body);

      if (error) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { password, confirmPassword } = value;

      const decoded = jwt.verify(token, process.env.JWT_RESET_PASSWORD);

      const data = await User.findOne({
        _id: decoded.id,
        resetPassword: token,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Reset password link expired",
        });
      }

      const isOld = await bcrypt.compare(password, data.password);

      if (isOld) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "You can not use previous password",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      data.password = hashedPassword;
      data.resetPassword = null;

      await data.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show All Users
  async showUser(req, res) {
    try {
      const data = await User.find({
        role: "user",
        status: true,
        isVerified: true,
      }).select("-password");

      if (!data || data.length === 0) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All active users list",
        data: {
          TotalUsers: data.length,
          data,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        messsage: error.message,
      });
    }
  }

  // Show All Employeers
  async showEmployeer(req, res) {
    try {
      const data = await User.find({
        role: "employeer",
        status: true,
        isVerified: true,
      }).select("-password");

      if (!data || data.length === 0) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Employeer not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All active employeers list",
        data: {
          TotalUsers: data.length,
          data,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        messsage: error.message,
      });
    }
  }

  // Show All Admins
  async showAdmin(req, res) {
    try {
      const data = await User.find({
        role: "admin",
        status: true,
        isVerified: true,
      }).select("-password");

      if (!data || data.length === 0) {
        return res.status(httpCodes.not_found).json({
          success: false,
          message: "Employeer not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All active admin list",
        data: {
          TotalUsers: data.length,
          data,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        messsage: error.message,
      });
    }
  }

  // Update All User
  async updateUser(req, res) {
    try {
      const { id } = req.params;

      const userData = req.body;

      const dataById = await User.findOne({
        _id: id,
        role: "user",
        status: true,
        isVerified: true,
      });

      if (!dataById) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User not found",
        });
      }

      const updateData = await User.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken");

      return res.status(httpCodes.ok).json({
        success: true,
        message: "User data updated successfully",
        data: updateData,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update All Employeer
  async updateEmployeer(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const dataById = await User.findOne({
        _id: id,
        role: "employeer",
        status: true,
        isVerified: true,
      });

      if (!dataById) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Employeer not found",
        });
      }

      const updateEmployeer = await User.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken");

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Employeer data updated successfully",
        data: updateEmployeer,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update All Admin
  async updateAdmin(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const dataById = await User.findOne({
        _id: id,
        role: "admin",
        status: true,
        isVerified: true,
      });

      if (!dataById) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Admin not found",
        });
      }

      const updateAdmin = await User.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken");

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Admin data updated successfully",
        data: updateAdmin,
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Inactive User
  async inactiveUser(req, res) {
    try {
      const { id } = req.params;

      const data = await User.findOne({
        _id: id,
        role: "user",
        status: true,
        isVerified: true,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User not found",
        });
      }

      const inactiveUser = await User.findByIdAndUpdate(
        id,
        { status: false },
        { new: true, runValidators: true },
      );

      return res.status(httpCodes.ok).json({
        success: true,
        message: "User inactive successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Inactive Users
  async showInactiveUsers(req, res) {
    try {
      const data = await User.find({
        role: "user",
        status: false,
      });

      if (!data || data.length === 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Inactive Users not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All inactive user list",
        data: {
          totalUsers: data.length,
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

  // Restore Inactive User
  async restoreUser(req, res) {
    try {
      const { id } = req.params;

      const data = await User.findOne({
        _id: id,
        role: "user",
        status: false,
        isVerified: true,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User not found",
        });
      }

      const inactiveUser = await User.findByIdAndUpdate(
        id,
        { status: true },
        { new: true, runValidators: true },
      );

      return res.status(httpCodes.ok).json({
        success: true,
        message: "User active successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Inactive Employeer
  async inactiveEmployeer(req, res) {
    try {
      const { id } = req.params;

      const data = await User.findOne({
        _id: id,
        role: "employeer",
        status: true,
        isVerified: true,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Employeer not found",
        });
      }

      const inactiveEmployeer = await User.findByIdAndUpdate(
        id,
        { status: false },
        { new: true, runValidators: true },
      );

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Employeer inactive successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Inactive Employeers
  async showInactiveEmployeers(req, res) {
    try {
      const data = await User.find({
        role: "employeer",
        status: false,
      });

      if (!data || data.length === 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Inactive Employeers not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All inactive employeers list",
        data: {
          totalUsers: data.length,
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

  // Restore Inactive Employeer
  async restoreEmployeer(req, res) {
    try {
      const { id } = req.params;

      const data = await User.findOne({
        _id: id,
        role: "employeer",
        status: false,
        isVerified: true,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Employeer not found",
        });
      }

      const inactiveEmployeer = await User.findByIdAndUpdate(
        id,
        { status: true },
        { new: true, runValidators: true },
      );

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Employeer active successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Companies for all employeers
  async employeerCompanies(req, res) {
    try {
      const data = await User.aggregate([
        {
          $match: { role: "employeer" },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            role: 1,
          },
        },
        {
          $lookup: {
            from: "companies",
            localField: "_id",
            foreignField: "employeerID",
            as: "company",
          },
        },
      ]);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Company Details for employeers",
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

module.exports = new userController();
