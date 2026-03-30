const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email helper function
const sendEmail = async (to, subject, html, text) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"InnoTalk" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

// Email templates
const getEmailTemplate = (type, data = {}) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const templates = {
    verification: {
      subject: 'Verify your InnoTalk account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your InnoTalk account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to InnoTalk!</h1>
              <p>Your Socratic Venture Sandbox</p>
            </div>
            <div class="content">
              <h2>Verify your email address</h2>
              <p>Hi ${data.firstName || 'there'},</p>
              <p>Thank you for signing up for InnoTalk! To complete your registration and start your entrepreneurial journey, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${baseUrl}/verify-email?token=${data.token}" class="button">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p>${baseUrl}/verify-email?token=${data.token}</p>
              <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
              <p>If you didn't create an account with InnoTalk, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 InnoTalk. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to InnoTalk!
        
        Hi ${data.firstName || 'there'},
        
        Thank you for signing up for InnoTalk! To complete your registration, please verify your email address by visiting this link:
        
        ${baseUrl}/verify-email?token=${data.token}
        
        This verification link will expire in 24 hours.
        
        If you didn't create an account with InnoTalk, you can safely ignore this email.
        
        © 2026 InnoTalk. All rights reserved.
      `,
    },
    
    passwordReset: {
      subject: 'Reset your InnoTalk password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your InnoTalk password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>InnoTalk</h1>
              <p>Your Socratic Venture Sandbox</p>
            </div>
            <div class="content">
              <h2>Reset your password</h2>
              <p>Hi ${data.firstName || 'there'},</p>
              <p>We received a request to reset your password for your InnoTalk account. Click the button below to set a new password:</p>
              <div style="text-align: center;">
                <a href="${baseUrl}/reset-password?token=${data.token}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p>${baseUrl}/reset-password?token=${data.token}</p>
              <p><strong>Note:</strong> This password reset link will expire in 10 minutes for security reasons.</p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 InnoTalk. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset your InnoTalk password
        
        Hi ${data.firstName || 'there'},
        
        We received a request to reset your password for your InnoTalk account. Visit this link to set a new password:
        
        ${baseUrl}/reset-password?token=${data.token}
        
        This password reset link will expire in 10 minutes for security reasons.
        
        If you didn't request a password reset, you can safely ignore this email.
        
        © 2026 InnoTalk. All rights reserved.
      `,
    },
    
    welcome: {
      subject: 'Welcome to InnoTalk - Start Your Entrepreneurial Journey!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to InnoTalk</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to InnoTalk!</h1>
              <p>Your Socratic Venture Sandbox</p>
            </div>
            <div class="content">
              <h2>Congratulations, ${data.firstName}!</h2>
              <p>You're now part of the most advanced AI-native platform for transforming entrepreneurial ideas into execution-ready ventures.</p>
              
              <div class="feature">
                <h3>🚀 What awaits you:</h3>
                <ul>
                  <li><strong>8-Phase Socratic Simulation:</strong> Stress-test your idea with AI agents</li>
                  <li><strong>Verified Venture Score (VVS):</strong> Get a certified assessment of your venture readiness</li>
                  <li><strong>Auto-Generated Artifacts:</strong> PRDs, Pitch Decks, and Grant Applications</li>
                  <li><strong>Regulatory Intelligence:</strong> Navigate compliance requirements effortlessly</li>
                  <li><strong>Ecosystem Integration:</strong> Connect with T-Hub, T-Works, and more</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard" class="button">Start Your First Simulation</a>
              </div>
              
              <p>Ready to transform from hobbyist maker to industrial entrepreneur? Your journey starts now!</p>
              
              <p><strong>Pro Tip:</strong> Complete the Market Confrontation phase first to get grounded in real-world market realities.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 InnoTalk. All rights reserved.</p>
              <p>Need help? Reply to this email or visit our help center.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to InnoTalk!
        
        Congratulations, ${data.firstName}!
        
        You're now part of the most advanced AI-native platform for transforming entrepreneurial ideas into execution-ready ventures.
        
        What awaits you:
        - 8-Phase Socratic Simulation: Stress-test your idea with AI agents
        - Verified Venture Score (VVS): Get a certified assessment of your venture readiness
        - Auto-Generated Artifacts: PRDs, Pitch Decks, and Grant Applications
        - Regulatory Intelligence: Navigate compliance requirements effortlessly
        - Ecosystem Integration: Connect with T-Hub, T-Works, and more
        
        Start your journey: ${baseUrl}/dashboard
        
        Ready to transform from hobbyist maker to industrial entrepreneur? Your journey starts now!
        
        Pro Tip: Complete the Market Confrontation phase first to get grounded in real-world market realities.
        
        © 2026 InnoTalk. All rights reserved.
      `,
    },
  };
  
  return templates[type] || null;
};

// Send verification email
const sendVerificationEmail = async (email, token, firstName = '') => {
  const template = getEmailTemplate('verification', { token, firstName });
  if (!template) {
    throw new Error('Email template not found');
  }
  
  return sendEmail(email, template.subject, template.html, template.text);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, firstName = '') => {
  const template = getEmailTemplate('passwordReset', { token, firstName });
  if (!template) {
    throw new Error('Email template not found');
  }
  
  return sendEmail(email, template.subject, template.html, template.text);
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName = '') => {
  const template = getEmailTemplate('welcome', { firstName });
  if (!template) {
    throw new Error('Email template not found');
  }
  
  return sendEmail(email, template.subject, template.html, template.text);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  getEmailTemplate,
};
