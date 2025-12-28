const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
});

// OPTIONAL but recommended
transporter.verify((err) => {
  if (err) console.error("SMTP ERROR:", err);
  else console.log("SMTP READY");
});

const sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"ClassTalk" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "ClassTalk OTP Code",
      html: `
        <h2>Your OTP</h2>
        <p><b>${otp}</b></p>
        <p>Expires in 5 minutes. Do not share this code.</p>
      `,
    });
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("OTP send failed:", error);
  }
};

module.exports = sendOTP;
