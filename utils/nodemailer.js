const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ClassTalk OTP Code",
    text: `Your OTP is ${otp}. It expires in 5 minutes. Please do not share this code with anyone.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendOTP;
