// utils/sendOtpEmail.js

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SEND_GRID_EMAIL_API);

const sendOtpEmail = async (to, otp) => {
     const msg = {
        to,
        from: "bilalahmadking2003170@gmail.com", // Use a verified sender email
        subject: "Your One-Time Password (OTP)",
        text: `Your OTP is: ${otp}`,
        html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    };

    try {
        await sgMail.send(msg);
        console.log(`OTP sent to ${to}`);
        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};

export default sendOtpEmail;
