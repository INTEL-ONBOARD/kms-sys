import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTP(email: string, otp: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Registration OTP - Wise East University",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Registration OTP</h2>
        <p>Your One-Time Password for registration is:</p>
        <h1 style="color: #000; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
}

export async function sendLecturerApprovalEmail(email: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Account Approved - Wise East University",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Account Approved</h2>
        <p>Your lecturer account at Wise East University has been approved.</p>
        <p>You can now log in and access your dashboard.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${email}`);
  } catch (error) {
    console.error("Error sending approval email:", error);
    // Don't throw to prevent blocking the approval flow if email fails
  }
}
