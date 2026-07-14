const { getMailTransport, getMailFrom } = require("../config/mail");

const sendVerificationEmail = async (to, code) => {
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  try {
    const transporter = getMailTransport();
    await transporter.sendMail({
      from: `"Glutenia" <${getMailFrom()}>`,
      to,
      subject: "Confirm your Glutenia account",
      text: `Your Glutenia verification code is ${code}. It expires in 15 minutes.`,
      html:
        `<div style="font-family:sans-serif">` +
        `<p>Your Glutenia verification code is:</p>` +
        `<h2 style="letter-spacing:4px">${code}</h2>` +
        `<p>This code expires in 15 minutes.</p></div>`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    return false;
  }
};

module.exports = { sendVerificationEmail };
