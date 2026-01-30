import twilio from 'twilio';
import { logger } from './logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
} else {
  logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
}

export interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  if (!twilioClient || !fromNumber) {
    logger.warn('SMS service not configured. Skipping SMS send.', { to: options.to });
    return false;
  }

  try {
    const message = await twilioClient.messages.create({
      body: options.message,
      from: fromNumber,
      to: options.to,
    });

    logger.info('SMS sent successfully', { 
      to: options.to.replace(/(\d{2})(\d{5})(\d{5})/, '$1*****$3'),
      messageId: message.sid 
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send SMS', { 
      to: options.to.replace(/(\d{2})(\d{5})(\d{5})/, '$1*****$3'),
      error: error.message 
    });
    return false;
  }
}

export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  const message = `Your Local Vendor AI verification code is: ${code}. This code will expire in 10 minutes.`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
}

export async function sendMFASMS(phoneNumber: string, code: string): Promise<boolean> {
  const message = `Your Local Vendor AI login verification code is: ${code}. This code will expire in 5 minutes.`;
  
  return sendSMS({
    to: phoneNumber,
    message
  });
}