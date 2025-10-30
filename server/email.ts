/**
 * Email service for sending verification and password reset emails
 * Supports multiple providers: SendGrid, AWS SES, SMTP
 * Gracefully degrades to console logging when not configured
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

class ConsoleEmailService implements EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('\n=== EMAIL (Console Mode) ===');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text || options.html}`);
    console.log('============================\n');
    return true;
  }
}

class SmtpEmailService implements EmailService {
  private transporter: any;

  constructor() {
    const nodemailer = require('nodemailer');
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via SMTP:', error);
      return false;
    }
  }
}

let emailService: EmailService;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  console.log('✅ Email service initialized with SMTP');
  emailService = new SmtpEmailService();
} else {
  console.warn('⚠️ Email service not configured. Emails will be logged to console.');
  console.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable email sending.');
  emailService = new ConsoleEmailService();
}

/**
 * Send verification email with token
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering with GATE And Tech! Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" class="button">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Verify Your Email Address

Thank you for registering with GATE And Tech! Please verify your email address by visiting:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
  `;

  return emailService.sendEmail({
    to: email,
    subject: 'Verify Your Email - GATE And Tech',
    html,
    text,
  });
}

/**
 * Send password reset email with token
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .warning { 
          background-color: #FEF3C7; 
          border-left: 4px solid #F59E0B; 
          padding: 12px; 
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password for your GATE And Tech account. Click the button below to reset it:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for security reasons.
        </div>
        <div class="footer">
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your Password

We received a request to reset your password for your GATE And Tech account. Visit this link to reset it:

${resetUrl}

⚠️ This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.
  `;

  return emailService.sendEmail({
    to: email,
    subject: 'Reset Your Password - GATE And Tech',
    html,
    text,
  });
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const dashboardUrl = `${process.env.APP_URL || 'http://localhost:5000'}/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background-color: #4F46E5; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .feature { margin: 15px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to GATE And Tech, ${name}! 🎉</h2>
        <p>Your email has been verified successfully. You're all set to start your GATE preparation journey!</p>
        
        <h3>What's Next?</h3>
        <div class="feature">✅ Take mock tests that mimic the actual GATE exam</div>
        <div class="feature">✅ Practice from our comprehensive question bank</div>
        <div class="feature">✅ Track your performance with detailed analytics</div>
        <div class="feature">✅ Join discussions with fellow aspirants</div>
        
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
        
        <div class="footer">
          <p>Good luck with your preparation!</p>
          <p>Team GATE And Tech</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to GATE And Tech, ${name}! 🎉

Your email has been verified successfully. You're all set to start your GATE preparation journey!

What's Next?
✅ Take mock tests that mimic the actual GATE exam
✅ Practice from our comprehensive question bank
✅ Track your performance with detailed analytics
✅ Join discussions with fellow aspirants

Visit your dashboard: ${dashboardUrl}

Good luck with your preparation!
Team GATE And Tech
  `;

  return emailService.sendEmail({
    to: email,
    subject: 'Welcome to GATE And Tech! 🎉',
    html,
    text,
  });
}
