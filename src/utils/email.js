import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAILER_USERNAME,
    pass: process.env.MAILER_PASSWORD
  }
});

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmail(to, type, data) {
  const templates = {
    signup: {
      subject: '[Fuxi] - Welcome! Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A90E2;">Welcome to Fuxi!</h1>
          <p>Hi ${data.name},</p>
          <p>Thank you for joining Fuxi - the reactive music therapy platform for dementia care.</p>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${data.otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>Best regards,<br>The Fuxi Team</p>
        </div>
      `
    },
    reset: {
      subject: '[Fuxi] - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A90E2;">Password Reset</h1>
          <p>Hi ${data.name},</p>
          <p>We received a request to reset your password.</p>
          <p>Your reset code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${data.otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The Fuxi Team</p>
        </div>
      `
    }
  };

  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown email template: ${type}`);
  }

  const mailOptions = {
    from: process.env.MAILER_USERNAME,
    to,
    subject: template.subject,
    html: template.html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
