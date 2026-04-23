// services/emailService.js
import nodemailer from "nodemailer";

export const sendEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.NODEMAILER_KEY,
      },
    });

    const mailOptions = {
      from: `"Buddy App" <${process.env.MY_EMAIL}>`, // ✅ hides raw gmail
      to: email,
      subject: "Verify your email - OTP Code",
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
        <div style="max-width:500px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
          
          <div style="background:#000; padding:20px; text-align:center;">
            <h1 style="color:white; margin:0;">Buddy</h1>
          </div>

          <div style="padding:30px; text-align:center;">
            <h2 style="margin-bottom:10px;">Verify your email</h2>
            <p style="color:#666; font-size:14px;">
              Use the OTP below to complete your verification
            </p>

            <div style="
              font-size:32px;
              letter-spacing:8px;
              font-weight:bold;
              margin:25px 0;
              color:#000;
            ">
              ${otp}
            </div>

            <p style="color:#999; font-size:13px;">
              This OTP is valid for 5 minutes.
            </p>

            <p style="color:#999; font-size:12px; margin-top:30px;">
              If you didn’t request this, you can safely ignore this email.
            </p>
          </div>

          <div style="background:#f7f7f7; padding:15px; text-align:center; font-size:12px; color:#888;">
            © ${new Date().getFullYear()} Buddy App. All rights reserved.
          </div>

        </div>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Email Error:", error.message);
    throw new Error("Email sending failed");
  }
};