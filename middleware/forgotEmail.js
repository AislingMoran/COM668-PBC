const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Portadown Boat Club" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

    await transporter.sendEmail(mailOptions);
};

module.exports = sendEmail;