const transporter = require("../config/transporter");
const Otp = require("../model/otp");
const {
  otpTemplate,
  userDetails,
  resetPasswordTemplate,
  notificationTemplate,
  interviewSelectedTemplate,
  applicationRejectedTemplate,
} = require("./html");

// Verification OTP Email
const otpEmail = async (user) => {
  try {
    if (user.isVerified) {
      throw new Error("User already verified");
    }
    const otp = Math.floor(100000 + Math.random() * 900000);

    const data = new Otp({
      userID: user._id,
      otp,
    });

    await data.save();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Your verification code",
      html: otpTemplate(user.name, otp),
    });

    return otp;
  } catch (error) {
    console.log(error.message);
  }
};

// Verified User/Employeer/Admin Email
const userEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "User authentication details",
      html: userDetails(user.name, user.email, user.role),
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Reset Password Email
const resetPasswordEmail = async (user, link) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "User authentication details",
      html: resetPasswordTemplate(user.name, link),
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Custom Notification Email
const notificationEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: user.subject,
      html: notificationTemplate(
        user.candidateName,
        user.companyName,
        user.subject,
        user.message,
      ),
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Candidate Selected Email
const selectedEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Interview Shortlisted",
      html: interviewSelectedTemplate(
        user.candidateName,
        user.companyName,
        user.jobTitle,
      ),
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Candidate Rejected Email
const rejectedEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Application Status Update",
      html: applicationRejectedTemplate(
        user.candidateName,
        user.companyName,
        user.jobTitle,
      ),
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  otpEmail,
  userEmail,
  resetPasswordEmail,
  notificationEmail,
  selectedEmail,
  rejectedEmail,
};
