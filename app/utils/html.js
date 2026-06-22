// OTP Template
const otpTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>
  <body style="margin:0;padding:40px 20px;background:#f4f4f4;font-family:Arial,sans-serif;">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 2px 10px rgba(0,0,0,0.08);
    ">

      <div style="
        background:#1f2937;
        padding:30px;
        text-align:center;
      ">
        <h1 style="
          color:#ffffff;
          margin:0;
          font-size:28px;
        ">
          Email Verification
        </h1>
      </div>

      <div style="padding:40px 30px;">

        <h2 style="
          color:#333333;
          margin-top:0;
        ">
          Hello ${name},
        </h2>

        <p style="
          font-size:16px;
          line-height:1.8;
          color:#555555;
        ">
          Thank you for registering. To complete your account verification,
          please use the OTP below.
        </p>

        <div style="
          text-align:center;
          margin:35px 0;
        ">
          <div style="
            display:inline-block;
            padding:15px 35px;
            background:#f3f4f6;
            border-radius:8px;
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            color:#1f2937;
          ">
            ${otp}
          </div>
        </div>

        <div style="
          background:#f9fafb;
          border-left:4px solid #1f2937;
          padding:15px;
          border-radius:4px;
          margin:25px 0;
        ">
          <p style="
            margin:0;
            color:#555555;
            line-height:1.6;
          ">
            This OTP is valid for <strong>10 minutes</strong>.
            Do not share it with anyone.
          </p>
        </div>

        <p style="
          font-size:16px;
          line-height:1.8;
          color:#555555;
        ">
          If you did not request this verification, please ignore this email.
        </p>

        <p style="
          margin-top:30px;
          color:#333333;
        ">
          Regards,<br>
          <strong>Your Company Name</strong>
        </p>

      </div>

      <div style="
        text-align:center;
        padding:20px;
        background:#f9fafb;
        color:#6b7280;
        font-size:13px;
      ">
        © 2026 Your Company Name. All rights reserved.
      </div>

    </div>

  </body>
  </html>
  `;
};

// Verified confirmation message Template
const userDetails = (name, email, role) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Account Verified</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
      
      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:10px;padding:40px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">

        <h2 style="text-align:center;color:#28a745;margin-top:0;">
          Account Verified Successfully
        </h2>

        <p>Hello <strong>${name}</strong>,</p>

        <p>
          Congratulations! Your account has been verified successfully.
          Below are your account details:
        </p>

        <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:25px 0;">

          <p style="margin:12px 0;">
            <strong>Full Name:</strong> ${name}
          </p>

          <p style="margin:12px 0;">
            <strong>Email:</strong> ${email}
          </p>

          <p style="margin:12px 0;">
            <strong>Role:</strong> ${role}
          </p>

        </div>

        <p>
          You can now log in and access your account.
        </p>

        <p style="margin-top:30px;">
          Regards,<br>
          <strong>Your Company Name</strong>
        </p>

      </div>

    </body>
    </html>
  `;
};

// Reset Password  Template
const resetPasswordTemplate = (name, resetLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Reset Password</title>
  </head>
  <body style="margin:0;padding:40px 20px;background:#f4f4f4;font-family:Arial,sans-serif;">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 2px 10px rgba(0,0,0,0.08);
    ">

      <div style="
        background:#dc2626;
        padding:30px;
        text-align:center;
      ">
        <h1 style="
          color:#ffffff;
          margin:0;
          font-size:28px;
        ">
          Reset Password
        </h1>
      </div>

      <div style="padding:40px 30px;">

        <h2 style="
          color:#333333;
          margin-top:0;
        ">
          Hello ${name},
        </h2>

        <p style="
          font-size:16px;
          line-height:1.8;
          color:#555555;
        ">
          We received a request to reset your account password.
          Click the button below to create a new password.
        </p>

        <div style="
          text-align:center;
          margin:35px 0;
        ">
          <a
            href="${resetLink}"
            style="
              display:inline-block;
              background:#dc2626;
              color:#ffffff;
              text-decoration:none;
              padding:14px 32px;
              border-radius:8px;
              font-size:16px;
              font-weight:bold;
            "
          >
            Reset Password
          </a>
        </div>

        <div style="
          background:#f9fafb;
          border-left:4px solid #dc2626;
          padding:15px;
          border-radius:4px;
          margin:25px 0;
        ">
          <p style="
            margin:0;
            color:#555555;
            line-height:1.6;
          ">
            This reset link is valid for
            <strong>15 minutes</strong>.
          </p>
        </div>
     
        <p style="
          font-size:16px;
          line-height:1.8;
          color:#555555;
        ">
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <p style="
          margin-top:30px;
          color:#333333;
        ">
          Regards,<br>
          <strong>Your Company Name</strong>
        </p>

      </div>

      <div style="
        text-align:center;
        padding:20px;
        background:#f9fafb;
        color:#6b7280;
        font-size:13px;
      ">
        © 2026 Your Company Name. All rights reserved.
      </div>

    </div>

  </body>
  </html>
  `;
};

// Notification Template
const notificationTemplate = (candidateName, companyName, subject, message) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:40px 20px;background:#f4f4f4;font-family:Arial,sans-serif;">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 2px 10px rgba(0,0,0,0.08);
    ">

      <div style="
        background:#2563eb;
        padding:30px;
        text-align:center;
      ">
        <h1 style="
          color:#ffffff;
          margin:0;
          font-size:28px;
        ">
          Candidate Notification
        </h1>
      </div>

      <div style="padding:40px 30px;">

        <h2 style="color:#333;">
          Hello ${candidateName},
        </h2>

        <p style="
          color:#555;
          font-size:16px;
          line-height:1.8;
        ">
          We have an important update regarding your application.
        </p>

        <div style="
          background:#f8fafc;
          border-left:4px solid #2563eb;
          padding:20px;
          margin:25px 0;
          border-radius:4px;
        ">
          <h3 style="margin-top:0;color:#111827;">
            ${subject}
          </h3>

          <p style="
            color:#4b5563;
            line-height:1.8;
            margin-bottom:0;
          ">
            ${message}
          </p>
        </div>

        <p style="
          color:#555;
          line-height:1.8;
        ">
          If you have any questions, please contact our recruitment team.
        </p>

        <p style="margin-top:30px;">
          Regards,<br>
          <strong>${companyName}</strong>
        </p>

      </div>

      <div style="
        text-align:center;
        padding:20px;
        background:#f9fafb;
        color:#6b7280;
        font-size:13px;
      ">
        © 2026 ${companyName}. All rights reserved.
      </div>

    </div>

  </body>
  </html>
  `;
};

// Selected Template
const interviewSelectedTemplate = (candidateName, companyName, jobTitle) => {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family:Arial;background:#f4f4f4;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:10px;">

      <h2 style="color:#16a34a;">
        Congratulations ${candidateName}!
      </h2>

      <p>
        We are pleased to inform you that you have been shortlisted
        for the next stage of the recruitment process.
      </p>

      <p>
        <strong>Position:</strong> ${jobTitle}
      </p>

      <p>
        Our recruitment team will contact you shortly regarding the
        interview schedule and further instructions.
      </p>

      <p>
        We look forward to speaking with you.
      </p>

      <br>

      <p>
        Regards,<br>
        <strong>${companyName}</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};

// Rejected Template
const applicationRejectedTemplate = (candidateName, companyName, jobTitle) => {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family:Arial;background:#f4f4f4;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:10px;">

      <h2 style="color:#dc2626;">
        Application Update
      </h2>

      <p>
        Hello ${candidateName},
      </p>

      <p>
        Thank you for your interest in the
        <strong>${jobTitle}</strong> position.
      </p>

      <p>
        After careful review, we have decided to move forward with
        other candidates whose qualifications more closely match
        our current requirements.
      </p>

      <p>
        We appreciate the time and effort you invested in your application.
      </p>

      <p>
        We wish you success in your future career endeavors.
      </p>

      <br>

      <p>
        Regards,<br>
        <strong>${companyName}</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};

module.exports = {
  otpTemplate,
  userDetails,
  resetPasswordTemplate,
  notificationTemplate,
  interviewSelectedTemplate,
  applicationRejectedTemplate,
};
