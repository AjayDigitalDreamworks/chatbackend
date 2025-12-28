const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Test SMTP (Render logs me dikhega)
transporter.verify((err) => {
  if (err) console.error("SMTP ERROR:", err);
  else console.log("SMTP READY");
});

async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ClassTalk OTP Code",
    text: `Your OTP is ${otp}. It expires in 5 minutes. Please do not share this code with anyone.`,
  });
}

module.exports = sendOTP;
