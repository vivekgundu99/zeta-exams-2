const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Send OTP Email
const sendOTP = async (email, otp, purpose = 'registration') => {
  try {
    const subject = purpose === 'registration' 
      ? 'Verify Your Email - Zeta Exams'
      : 'Password Reset OTP - Zeta Exams';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Zeta Exams</h1>
            <p>Your Exam Preparation Partner</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>${purpose === 'registration' ? 'Welcome to Zeta Exams! Please verify your email address to complete your registration.' : 'You have requested to reset your password. Use the OTP below to proceed.'}</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Your OTP is:</p>
              <div class="otp">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
            </div>
            
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Never share this OTP with anyone</li>
              <li>Zeta Exams will never ask for your OTP via phone or email</li>
              <li>This OTP will expire in 10 minutes</li>
            </ul>
            
            <p>If you didn't request this OTP, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2026 Zeta Exams. All rights reserved.</p>
              <p>Need help? Contact us at support@zetaexams.in</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: 'Zeta Exams <noreply@zetaexams.in>',
      to: email,
      subject: subject,
      html: html
    });

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send Subscription Confirmation Email
const sendSubscriptionConfirmation = async (email, userName, plan, duration, expiryDate) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Activated!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Your subscription has been successfully activated. Welcome to the Zeta Exams family!</p>
            
            <div class="plan-box">
              <h3 style="margin-top: 0; color: #667eea;">${plan.toUpperCase()} Plan</h3>
              <p><strong>Duration:</strong> ${duration}</p>
              <p><strong>Valid Until:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN')}</p>
            </div>
            
            <p>You now have access to all ${plan} plan features. Start your preparation journey today!</p>
            
            <div class="footer">
              <p>© 2026 Zeta Exams. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: 'Zeta Exams <noreply@zetaexams.in>',
      to: email,
      subject: 'Subscription Activated - Zeta Exams',
      html: html
    });

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTP,
  sendSubscriptionConfirmation
};