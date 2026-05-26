const nodemailer = require("nodemailer");
const logger = require("./logger");

// Nodemailer setup with Ethereal (mock SMTP for development)
let transporter;

const setupTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Use real SMTP if configured
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    logger.info(
      `Initialized Ethereal mock email transport with user: ${testAccount.user}`,
    );
  }
};

setupTransporter();

const sendPasswordResetOTP = async (to, otp) => {
  if (!transporter) {
    await setupTransporter();
  }

  const mailOptions = {
    from: '"PetBuddy Admin" <no-reply@petbuddy.com>',
    to,
    subject: "Password Reset OTP",
    text: `You requested a password reset. Your 6-digit OTP is: ${otp}\n\nThis OTP will expire in 30 minutes.`,
    html: `<p>You requested a password reset.</p><p>Your 6-digit OTP is: <strong>${otp}</strong></p><p>This OTP will expire in 30 minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);

  if (info.messageId && !process.env.SMTP_HOST) {
    logger.info(
      `Preview URL for Reset Password Email: ${nodemailer.getTestMessageUrl(info)}`,
    );
  }

  return info;
};

const sendSignupOTP = async (to, otp) => {
  if (!transporter) {
    await setupTransporter();
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Verify Your Email for PetBuddy",
    text: `Welcome to PetBuddy! Your 6-digit email verification OTP is: ${otp}\n\nThis OTP will expire in 30 minutes.`,
    html: `<p>Welcome to PetBuddy!</p><p>Your 6-digit email verification OTP is: <strong>${otp}</strong></p><p>This OTP will expire in 30 minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);

  if (info.messageId && !process.env.SMTP_HOST) {
    logger.info(
      `Preview URL for Signup Verification Email: ${nodemailer.getTestMessageUrl(info)}`,
    );
  }

  return info;
};

module.exports = {
  sendPasswordResetOTP,
  sendSignupOTP,
};
