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

const sendPasswordResetEmail = async (to, resetToken) => {
  if (!transporter) {
    await setupTransporter();
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"PetBuddy Admin" <no-reply@petbuddy.com>',
    to,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the following link to reset your password: ${resetLink} \n\nThis link will expire in 30 minutes.`,
    html: `<p>You requested a password reset.</p><p>Click the following link to reset your password:</p><a href="${resetLink}">${resetLink}</a><p>This link will expire in 30 minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);

  if (info.messageId && !process.env.SMTP_HOST) {
    logger.info(
      `Preview URL for Reset Password Email: ${nodemailer.getTestMessageUrl(info)}`,
    );
  }

  return info;
};

module.exports = {
  sendPasswordResetEmail,
};
