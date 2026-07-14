const nodemailer = require("nodemailer");

let cachedTransporter = null;

const getGmailUser = () => process.env.GMAIL_USER;

const getGmailAppPassword = () => process.env.GMAIL_APP_PASSWORD;

const getMailFrom = () => process.env.MAIL_FROM || getGmailUser();

const getMailTransport = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = getGmailUser();
  const pass = getGmailAppPassword();
  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set to send email");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
};

module.exports = { getMailTransport, getMailFrom };
