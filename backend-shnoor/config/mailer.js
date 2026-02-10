// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // MUST be false
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false, // IMPORTANT on Render
//   },
//   connectionTimeout: 10000,
// });
// export default transporter;

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
export const sendMail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: "LMS-SHNOOR@lms.shnoor.com", 
      to,
      subject,
      html,
    });
    return response;
  } catch (error) {
    console.error("Resend Email Error:", error);
    throw error;
  }
};