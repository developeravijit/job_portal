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
const cloudinary = require(".././config/cloudinary");
const fileCleaner = require("../utils/fileCleaner");

class authController {
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
          data.role === "employer"
            ? "employer register successfully"
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
          data.role === "employer"
            ? "employer verified successfully"
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
              : userData.role === "employer"
                ? "employer is not verified"
                : "User is not verified",
        });
      }

      if (!userData.status) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message:
            userData.role === "admin"
              ? "Admin is not active"
              : userData.role === "employer"
                ? "employer is not active"
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

      const data = result.toObject();
      delete data.password;
      delete data.refreshToken;

      return res.status(httpCodes.ok).json({
        success: true,
        message:
          data.role === "admin"
            ? "Admin login successfully"
            : data.role === "employer"
              ? "employer login successfully"
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

  // Logout
  async logout(req, res) {
    try {
      const data = await User.findById(req.user.id);

      if (!data) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.status(httpCodes.not_found).json({
          success: false,
          message:
            data.role === "admin"
              ? "Admin not found"
              : data.role === "employer"
                ? "Employer not found"
                : "User not found",
        });
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      data.refreshToken = null;
      await data.save();

      return res.status(httpCodes.ok).json({
        success: true,
        message:
          data.role === "admin"
            ? "Admin logout successfully"
            : data.role === "employer"
              ? "Employer logout successfully"
              : "User logout successfully",
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
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const refreshToken = authHeader.split(" ")[1];

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
              : data.role === "employer"
                ? "employer is not verified"
                : "User is not verified",
        });
      }

      if (!data.status) {
        return res.status(httpCodes.unauthorized).json({
          success: false,
          message:
            data.role === "admin"
              ? "Admin is not active"
              : data.role === "employer"
                ? "employer is not active"
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

  // Show All Candidates
  async showUser(req, res) {
    try {
      const limit = Number(req.query.limit) || 6;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const admin = await User.findById(req.user.id).select(
        "-password -refreshToken",
      );

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
          $project: {
            password: 0,
            refreshToken: 0,
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

      const totalPages = Math.max(1, Math.ceil(totalCandidates / limit));

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All candidates list",
        data: {
          admin,
          candidates,
          totalCandidates,
          currentPage: page,
          totalPages,
          search,
        },
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        messsage: error.message,
      });
    }
  }

  // Show All employers
  async showemployer(req, res) {
    try {
      const limit = Number(req.query.limit) || 6;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const admin = await User.findById(req.user.id).select(
        "-password -refreshToken",
      );

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

      const totalEmployer = await User.countDocuments(match);

      const employers = await User.aggregate([
        {
          $match: match,
        },
        {
          $project: {
            password: 0,
            refreshToken: 0,
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

      const totalPages = Math.max(1, Math.ceil(totalEmployer / limit));

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All employers list",
        data: {
          admin,
          employers,
          totalEmployer,
          currentPage: page,
          totalPages,
          search,
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
          message: "employer not found",
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

  // Update All Candidate
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
        fileCleaner(req.file);
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "User not found",
        });
      }

      if (req.file) {
        if (dataById.public_id) {
          await cloudinary.uploader.destroy(dataById.public_id);
        }
        userData.avatar = req.file.path;
        userData.public_id = req.file.filename;
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
      fileCleaner(req.file);
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update All employer
  async updateemployer(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const dataById = await User.findOne({
        _id: id,
        role: "employer",
        status: true,
        isVerified: true,
      });

      if (!dataById) {
        fileCleaner(req.file);
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "employer not found",
        });
      }

      if (req.file) {
        if (dataById.public_id) {
          await cloudinary.uploader.destroy(dataById.public_id);
        }
        userData.avatar = req.file.path;
        userData.public_id = req.file.filename;
      }

      const updateemployer = await User.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken");

      return res.status(httpCodes.ok).json({
        success: true,
        message: "employer data updated successfully",
        data: updateemployer,
      });
    } catch (error) {
      fileCleaner(req.file);
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
        fileCleaner(req.file);
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Admin not found",
        });
      }

      if (req.file) {
        if (dataById.public_id) {
          await cloudinary.uploader.destroy(dataById.public_id);
        }
        userData.avatar = req.file.path;
        userData.public_id = req.file.filename;
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

  // Inactive employer
  async inactiveemployer(req, res) {
    try {
      const { id } = req.params;

      const data = await User.findOne({
        _id: id,
        role: "employer",
        status: true,
        isVerified: true,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "employer not found",
        });
      }

      const inactiveemployer = await User.findByIdAndUpdate(
        id,
        { status: false },
        { new: true, runValidators: true },
      );

      return res.status(httpCodes.ok).json({
        success: true,
        message: "employer inactive successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Inactive employers
  async showInactiveemployers(req, res) {
    try {
      const data = await User.find({
        role: "employer",
        status: false,
      });

      if (!data || data.length === 0) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "Inactive employers not found",
        });
      }

      return res.status(httpCodes.ok).json({
        success: true,
        message: "All inactive employers list",
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

  // Restore Inactive employer
  async restoreemployer(req, res) {
    try {
      const { id } = req.params;

      const data = await User.findOne({
        _id: id,
        role: "employer",
        status: false,
        isVerified: true,
      });

      if (!data) {
        return res.status(httpCodes.bad_request).json({
          success: false,
          message: "employer not found",
        });
      }

      const inactiveemployer = await User.findByIdAndUpdate(
        id,
        { status: true },
        { new: true, runValidators: true },
      );

      return res.status(httpCodes.ok).json({
        success: true,
        message: "employer active successfully",
      });
    } catch (error) {
      return res.status(httpCodes.server_error).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Show Companies for all employers
  async employerCompanies(req, res) {
    try {
      const data = await User.aggregate([
        {
          $match: { role: "employer" },
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
            foreignField: "employerID",
            as: "company",
          },
        },
      ]);

      return res.status(httpCodes.ok).json({
        success: true,
        message: "Company Details for employers",
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

module.exports = new authController();
