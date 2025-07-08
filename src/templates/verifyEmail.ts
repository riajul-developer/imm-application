export interface VerifyTemplateData {
  verificationLink: string;
  expiryTime?: string;
  companyName?: string;
}

export const verifyTemplate = (data: VerifyTemplateData) => ({
  subject: 'Verify Your Email Address',
  text: `
  Thank you for signing up! Please verify your email address by clicking the link below:

  ${data.verificationLink}

  This link will expire in ${data.expiryTime || '24 hours'}.

  If you didn't create an account, please ignore this email.

  Best regards,
  ${data.companyName || 'The Team'}
    `,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 30px 15px;
            min-height: 100vh;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
          }
          
          .email-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: #DC2626;
          }
          
          .header {
            background: #DC2626;
            padding: 25px 30px;
            text-align: center;
            color: white;
            position: relative;
          }

          .header h1 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          
          .header p {
            font-size: 14px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 40px 35px;
          }
          
          .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          .verification-box {
            background: #fef2f2;
            border: 2px solid #DC2626;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
            position: relative;
          }
          
          .verification-box::before {
            content: '🔐';
            font-size: 30px;
            position: absolute;
            top: -28px;
            left: 50%;
            transform: translateX(-50%);
            padding: 0 10px;
          }
          
          .verification-text {
            color: #991b1b;
            font-size: 14px;
            margin-bottom: 20px;
            line-height: 1.5;
          }
          
          .verify-button {
            display: inline-block;
            background: #DC2626;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
            position: relative;
            overflow: hidden;
          }
          
          .verify-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .verify-button:hover::before {
            left: 100%;
          }
          
          .verify-button:hover {
            background: #B91C1C;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4);
          }
          
          .security-notice {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 18px;
            margin: 25px 0;
            border-radius: 6px;
          }
          
          .security-notice h3 {
            color: #92400e;
            font-size: 14px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            font-weight: 600;
          }
          
          .security-notice h3::before {
            content: '⚠️';
            margin-right: 6px;
          }
          
          .security-notice p {
            color: #78350f;
            font-size: 13px;
            line-height: 1.4;
            margin: 4px 0;
          }
          
          .footer {
            background: #f8fafc;
            padding: 25px 35px;
            text-align: center;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
            margin: 8px 0;
            font-size: 13px;
          }
          
          .footer .company-name {
            font-weight: 600;
            color: #DC2626;
            font-size: 14px;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 15px 10px;
            }
            
            .header {
              padding: 20px 15px;
            }
            
            .header h1 {
              font-size: 18px;
            }
            
            .content,
            .footer {
              padding: 25px 20px;
            }
            
            .verification-box {
              padding: 20px 15px;
            }
            
            .verify-button {
              display: block;
              margin: 15px 0;
              padding: 10px 25px;
              font-size: 13px;
            }
            
            .greeting {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Email Verification</h1>
            <p>Please verify your email address to continue</p>
          </div>
          
          <div class="content">            
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 18px;">
              Thank you for signing up with ${data.companyName || 'The Team'}! To complete your registration and secure your account, please verify your email address.
            </p>
            
            <div class="verification-box">
              <div class="verification-text">
                <strong>Click the button below to verify your email:</strong>
              </div>
              <a href="${data.verificationLink}" class="verify-button">
                Verify Email Address
              </a>
            </div>
            
            <div class="security-notice">
              <h3>Important Security Information</h3>
              <p>• This verification link will expire in ${data.expiryTime || '24 hours'}</p>
              <p>• If you didn't create an account or reset auth, please ignore this</p>
              <p>• For security reasons, this link can only be used once</p>
              <p>• If you're having trouble, copy and paste this link: <br><small style="word-break: break-all; color: #DC2626;">${data.verificationLink}</small></p>
            </div>
            
            <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 25px;">
              Need help? Contact our support team - we're here to assist you!
            </p>
          </div>
          
          <div class="footer">
            <p class="company-name">${data.companyName || 'The Team'}</p>
            <p>© 2025 All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
});