import nodemailer from 'nodemailer';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

// Initialize email transporter
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  logger.warn('SMTP credentials not configured. Email functionality will be disabled.');
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    logger.warn('Email service not configured. Skipping email send.', { to: options.to });
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info('Email sent successfully', { 
      to: options.to,
      messageId: info.messageId 
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send email', { 
      to: options.to,
      error: error.message 
    });
    return false;
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const subject = 'Local Vendor AI - Email Verification';
  const text = `Your Local Vendor AI verification code is: ${code}. This code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Your Local Vendor AI verification code is:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">This code will expire in 10 minutes.</p>
      <p style="color: #666;">If you didn't request this verification, please ignore this email.</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

export async function sendMFAEmail(email: string, code: string): Promise<boolean> {
  const subject = 'Local Vendor AI - Login Verification';
  const text = `Your Local Vendor AI login verification code is: ${code}. This code will expire in 5 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Login Verification</h2>
      <p>Your Local Vendor AI login verification code is:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
        ${code}
      </div>
      <p style="color: #666;">This code will expire in 5 minutes.</p>
      <p style="color: #666;">If you didn't request this login, please secure your account immediately.</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Local Vendor AI - Password Reset';
  const text = `You requested a password reset. Click the following link to reset your password: ${resetUrl}. This link will expire in 1 hour.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset</h2>
      <p>You requested a password reset for your Local Vendor AI account.</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="color: #666;">This link will expire in 1 hour.</p>
      <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}