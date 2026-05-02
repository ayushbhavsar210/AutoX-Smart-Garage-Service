import nodemailer from "nodemailer";

const sendOtp = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "yourgmail@gmail.com",
      pass: "APP_PASSWORD_HERE"
    }
  });

  await transporter.sendMail({
    from: "AutoX <yourgmail@gmail.com>",
    to: email,
    subject: "AutoX OTP Verification",
    html: `<h2>Your OTP is: ${otp}</h2>`
  });
};

export default sendOtp;