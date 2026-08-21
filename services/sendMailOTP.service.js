// utils/sendOtpEmail.js
import sendMail from "./mailer.service.js";

const sendOtpEmail = async (to, otp) => {
  return sendMail({
    to,
    subject: "Your One-Time Password (OTP)",
    text: `Your OTP is: ${otp}`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
  });
};

export default sendOtpEmail;
