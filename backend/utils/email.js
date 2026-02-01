// backend/utils/email.js - WITH SUBSCRIPTION CONFIRMATION
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
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              
              <table role="presentation" style="width: 600px; border-collapse: collapse; 
                     background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             padding: 40px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">🎯 Zeta Exams</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your Exam Preparation Partner</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px; background-color: #f9fafb;">
                    
                    <h2 style="color: #333; margin-top: 0;">Hello!</h2>
                    <p style="color: #666; line-height: 1.6; font-size: 16px;">
                      ${purpose === 'registration' 
                        ? 'Welcome to Zeta Exams! Please verify your email address to complete your registration.' 
                        : 'You have requested to reset your password. Use the OTP below to proceed.'}
                    </p>
                    
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="background: white; border: 2px dashed #667eea; 
                                   padding: 30px; text-align: center; border-radius: 8px;">
                          <p style="margin: 0; color: #666; font-size: 14px;">Your OTP is:</p>
                          <div style="font-size: 36px; font-weight: bold; color: #667eea; 
                                      letter-spacing: 10px; margin: 15px 0;">${otp}</div>
                          <p style="margin: 0; color: #999; font-size: 13px;">Valid for 10 minutes</p>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background: #fff; padding: 20px; border-left: 4px solid #667eea; 
                               border-radius: 4px; margin: 20px 0;">
                      <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">
                        🔒 Security Tips:
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                        <li>Never share this OTP with anyone</li>
                        <li>Zeta Exams will never ask for your OTP via phone or email</li>
                        <li>This OTP will expire in 10 minutes</li>
                      </ul>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                      If you didn't request this OTP, please ignore this email or contact our support team.
                    </p>
                    
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #f4f4f4; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                      © 2026 Zeta Exams. All rights reserved.
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                      Need help? Contact us at 
                      <a href="mailto:support@zetaexams.in" 
                         style="color: #667eea; text-decoration: none;">support@zetaexams.in</a>
                    </p>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Zeta Exams - ${subject}

Hello!

${purpose === 'registration' 
  ? 'Welcome to Zeta Exams! Please verify your email address to complete your registration.' 
  : 'You have requested to reset your password. Use the OTP below to proceed.'}

Your OTP is: ${otp}

This OTP is valid for 10 minutes.

Security Tips:
- Never share this OTP with anyone
- Zeta Exams will never ask for your OTP via phone or email
- This OTP will expire in 10 minutes

If you didn't request this OTP, please ignore this email.

© 2026 Zeta Exams. All rights reserved.
Need help? Contact us at support@zetaexams.in
    `;

    const data = await resend.emails.send({
      from: 'Zeta Exams <hello@zetaexams.in>',
      to: email,
      subject: subject,
      html: html,
      text: text,
      reply_to: 'support@zetaexams.in',
      headers: {
        'X-Entity-Ref-ID': `otp-${Date.now()}`,
      }
    });

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// 🔥 NEW: Send subscription confirmation email
const sendSubscriptionConfirmation = async (email, name, plan, duration, endDate) => {
  try {
    const planNames = {
      silver: 'Silver Plan',
      gold: 'Gold Plan'
    };
    
    const durationNames = {
      '1month': '1 Month',
      '6months': '6 Months',
      '1year': '1 Year'
    };
    
    const subject = `🎉 Subscription Activated - ${planNames[plan]}`;
    
    const formattedEndDate = new Date(endDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              
              <table role="presentation" style="width: 600px; border-collapse: collapse; 
                     background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             padding: 40px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">Your subscription is now active</p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    
                    <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
                    <p style="color: #666; line-height: 1.6; font-size: 16px;">
                      Thank you for subscribing to Zeta Exams! Your ${planNames[plan]} subscription has been successfully activated.
                    </p>
                    
                    <table role="presentation" style="width: 100%; margin: 30px 0; background: #f9fafb; border-radius: 8px; padding: 20px;">
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 15px 0; color: #667eea;">Subscription Details</h3>
                          <table style="width: 100%;">
                            <tr>
                              <td style="padding: 8px 0; color: #666;">Plan:</td>
                              <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: right;">${planNames[plan]}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #666;">Duration:</td>
                              <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: right;">${durationNames[duration]}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #666;">Valid Until:</td>
                              <td style="padding: 8px 0; font-weight: bold; color: #333; text-align: right;">${formattedEndDate}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background: ${plan === 'gold' ? '#FFF9E6' : '#F3F4F6'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin: 0 0 15px 0; color: #333;">✨ Your Benefits</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                        ${plan === 'gold' ? `
                          <li>5000 Questions per day (Almost Unlimited)</li>
                          <li>50 Chapter Tests per day</li>
                          <li>Unlimited Formulas & Flashcards</li>
                          <li>8 Mock Tests per day</li>
                          <li>Advanced Analytics & Reports</li>
                        ` : `
                          <li>200 Questions per day</li>
                          <li>10 Chapter Tests per day</li>
                          <li>1 Support Ticket per day</li>
                        `}
                      </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://zetaexams.in/dashboard" 
                         style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Start Learning Now
                      </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
                      Need help? We're here for you at 
                      <a href="mailto:support@zetaexams.in" style="color: #667eea;">support@zetaexams.in</a>
                    </p>
                    
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #f4f4f4; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                      © 2026 Zeta Exams. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    const text = `
Congratulations ${name}!

Your Zeta Exams subscription is now active!

Subscription Details:
- Plan: ${planNames[plan]}
- Duration: ${durationNames[duration]}
- Valid Until: ${formattedEndDate}

Your Benefits:
${plan === 'gold' ? `
- 5000 Questions per day (Almost Unlimited)
- 50 Chapter Tests per day
- Unlimited Formulas & Flashcards
- 8 Mock Tests per day
- Advanced Analytics & Reports
` : `
- 200 Questions per day
- 10 Chapter Tests per day
- 1 Support Ticket per day
`}

Start learning now: https://zetaexams.in/dashboard

Need help? Contact us at support@zetaexams.in

© 2026 Zeta Exams. All rights reserved.
    `;

    const data = await resend.emails.send({
      from: 'Zeta Exams <hello@zetaexams.in>',
      to: email,
      subject: subject,
      html: html,
      text: text,
      reply_to: 'support@zetaexams.in',
      headers: {
        'X-Entity-Ref-ID': `subscription-${Date.now()}`,
      }
    });

    return { success: true, data };
  } catch (error) {
    console.error('Subscription email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTP,
  sendSubscriptionConfirmation
};