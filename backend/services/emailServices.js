// backend/services/emailServices.js

const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT = 587,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

let transporter;

if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER
      ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        }
      : undefined,
  });
} else {
  console.warn('SMTP credentials are not configured. Emails will not be sent.');
}

const sendVerificationCode = async (email, otpCode, username = '') => {
  if (!transporter) {
    console.log(`[DEV] OTP for ${email}: ${otpCode}`);
    return;
  }

  const mailOptions = {
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'Verify your account',
    text: `
Hello ${username || 'gamer'},

Your verification code is: ${otpCode}

This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.

If you did not request this code, please ignore this email.

Best regards,
Game Shopping Team
`.trim(),
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationCode,
};

