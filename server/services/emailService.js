const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Using Gmail's free SMTP (you can also use others like Brevo, SendGrid free tier)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not regular password)
      }
    });
    
    // Alternative: Using Brevo (SendinBlue) - Free 300 emails/day
    // this.transporter = nodemailer.createTransport({
    //   host: 'smtp-relay.brevo.com',
    //   port: 587,
    //   auth: {
    //     user: process.env.BREVO_USER,
    //     pass: process.env.BREVO_API_KEY
    //   }
    // });
  }

  async sendVerificationCode(email, code, name) {
    const mailOptions = {
      from: `"QR My Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - QR My Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; padding: 20px; text-align: center; font-size: 32px; 
                   font-weight: bold; letter-spacing: 5px; color: #667eea; 
                   border: 2px dashed #667eea; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to QR My Pro!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
              <div class="code">${code}</div>
              <p><strong>This code will expire in 15 minutes.</strong></p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QR My Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, resetToken, name) {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"QR My Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - QR My Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; 
                     padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                     margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p><strong>This link will expire in 30 minutes.</strong></p>
              <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QR My Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();