const nodemailer = require("nodemailer");
require("dotenv").config();

function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    // Validate email credentials are set
    if (!process.env.MY_EMAIL || !process.env.MY_PASSWORD) {
      console.error("Email credentials missing from .env file");
      return reject(new Error("Email service not configured. Please set MY_EMAIL and MY_PASSWORD in backend .env file."));
    }

    // Validate recipient email
    if (!recipient_email) {
      return reject(new Error("Recipient email is required."));
    }

    // Validate OTP
    if (!OTP) {
      return reject(new Error("OTP is required."));
    }

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const mail_configs = {
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "PASSWORD RECOVERY",
      html: `<!DOCTYPE html>
  <html lang="en" >
  <head>
    <meta charset="UTF-8">
    <title>Password Recovery</title>
    
  
  </head>
  <body>
  <!-- partial:index.partial.html -->
  <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Mauli Dairy</a>
      </div>
      <p style="font-size:1.1em">Hi,</p>
      <p>OTP is valid for 1 minutes</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
      <p style="font-size:0.9em;">Regards,<br />Mauli Dairy</p>
      <hr style="border:none;border-top:1px solid #eee" />
    </div>
  </div>
  <!-- partial -->
  </body>
  </html>`,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.error("Email sending error:", error);
        console.error("Error code:", error.code);
        console.error("Error response:", error.response);
        console.error("Error command:", error.command);
        
        // Provide more specific error messages
        let errorMessage = "An error has occurred while sending email.";
        
        if (error.code === "EAUTH" || error.code === "EENVELOPE") {
          errorMessage = "Email authentication failed. Please check MY_EMAIL and MY_PASSWORD in backend .env file. Make sure you're using Gmail App Password, not regular password.";
        } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
          errorMessage = "Failed to connect to email server. Please check your internet connection and firewall settings.";
        } else if (error.responseCode === 550 || error.code === "EENVELOPE") {
          errorMessage = "Invalid recipient email address or email format.";
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        return reject(new Error(errorMessage));
      }
      console.log("Email sent successfully:", info.messageId);
      return resolve({ message: "Email sent successfully" });
    });
  });
}

module.exports = { sendEmail };
