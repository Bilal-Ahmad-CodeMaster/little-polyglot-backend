// utils/sendOtpEmail.js
import nodemailer from "nodemailer";

// SMTP-based transport. Works with any provider (Gmail, Outlook, custom SMTP,
// etc.) — just point the env vars at the right host/port/credentials.
// For Gmail specifically: EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=465,
// EMAIL_SECURE=true, EMAIL_USER=your@gmail.com, EMAIL_PASS=<16-char App Password>
// (Gmail requires an "App Password", not your normal account password —
// generate one at https://myaccount.google.com/apppasswords, which needs
// 2-Step Verification enabled on the account.)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE !== "false", // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  const msg = {
    to,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    subject: "Your One-Time Password (OTP)",
    text: `Your OTP is: ${otp}`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
  };

  try {
    await transporter.sendMail(msg);
    console.log(`OTP sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error?.message || error);
    return false;
  }
};

export default sendOtpEmail;
