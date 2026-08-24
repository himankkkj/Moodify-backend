import nodemailer from "nodemailer";
import config from "../config/config.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: config.GOOGLE_USER_EMAIL,
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    refreshToken: config.GOOGLE_REFRESH_TOKEN,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to take messages");
  }
});

//send email function

export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `"Moodify" <${config.GOOGLE_USER_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
