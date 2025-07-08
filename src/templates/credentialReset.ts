
export const verifyTemplate = (data: VerifyTemplateData) => ({
  subject: 'Verify Your Email Address',
  text: `
Hello ${data.recipientName},

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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px 15px;
          min-height: 100vh;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          position: relative;
        }
        
        .email-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
          background-size: 300% 300%;
          animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
          position: relative;
        }
        
        .header::before {
          content: '✉️';
          font-size: 60px;
          opacity: 0.2;
          position: absolute;
          top: 20px;
          left: 30px;
        }
        
        .company-logo {
          max-width: 120px;
          margin-bottom: 20px;
          filter: brightness(0) invert(1);
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 50px 40px;
        }
        
        .greeting {
          font-size: 20px;
          color: #1f2937;
          margin-bottom: 25px;
          font-weight: 600;
        }
        
        .verification-box {
          background: linear-gradient(145deg, #f0fdf4, #dcfce7);
          border: 2px solid #10b981;
          border-radius: 15px;
          padding: 35px;
          text-align: center;
          margin: 30px 0;
          position: relative;
        }
        
        .verification-box::before {
          content: '🔐';
          font-size: 40px;
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 0 15px;
        }
        
        .verification-text {
          color: #065f46;
          font-size: 16px;
          margin-bottom: 25px;
          line-height: 1.6;
        }
        
        .verify-button {
          display: inline-block;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 18px 40px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
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
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
        }
        
        .security-notice {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 30px 0;
          border-radius: 8px;
        }
        
        .security-notice h3 {
          color: #92400e;
          font-size: 16px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        
        .security-notice h3::before {
          content: '⚠️';
          margin-right: 8px;
        }
        
        .security-notice p {
          color: #78350f;
          font-size: 14px;
          line-height: 1.5;
          margin: 5px 0;
        }
        
        .footer {
          background: #f8fafc;
          padding: 30px 40px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
          margin: 10px 0;
          font-size: 14px;
        }
        
        .footer .company-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 15px 10px;
          }
          
          .header,
          .content,
          .footer {
            padding: 25px 20px;
          }
          
          .verification-box {
            padding: 25px 20px;
          }
          
          .verify-button {
            display: block;
            margin: 20px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${data.companyLogo ? `<img src="${data.companyLogo}" alt="Company Logo" class="company-logo">` : ''}
          <h1>Email Verification</h1>
          <p>Please verify your email address to continue</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${data.recipientName}! 👋
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for signing up with ${data.companyName || 'us'}! To complete your registration and secure your account, please verify your email address.
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
            <p>• If you didn't create an account, please ignore this email</p>
            <p>• For security reasons, this link can only be used once</p>
            <p>• If you're having trouble, copy and paste this link: <br><small style="word-break: break-all;">${data.verificationLink}</small></p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
            Need help? Contact our support team - we're here to assist you!
          </p>
        </div>
        
        <div class="footer">
          <p class="company-name">${data.companyName || 'Your Company'}</p>
          <p>© 2025 All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
});

// templates/credentialReset.ts

export interface CredentialResetTemplateData {
  recipientName: string;
  resetLink: string;
  companyName?: string;
  companyLogo?: string;
  expiryTime?: string;
  requestTime?: string;
  userIP?: string;
}

export const CredentialResetTemplate = (data: CredentialResetTemplateData) => ({
  subject: 'Password Reset Request',
  text: `
Hello ${data.recipientName},

We received a request to reset your password for your account.

Click the link below to reset your password:
${data.resetLink}

This link will expire in ${data.expiryTime || '1 hour'}.

If you didn't request this password reset, please ignore this email or contact our support team.

Request Details:
- Time: ${data.requestTime || new Date().toLocaleString()}
- IP Address: ${data.userIP || 'Not available'}

Best regards,
${data.companyName || 'The Team'}
  `,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          padding: 30px 15px;
          min-height: 100vh;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          position: relative;
        }
        
        .email-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #ef4444, #f87171, #fca5a5);
          background-size: 300% 300%;
          animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .header {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
          position: relative;
        }
        
        .header::before {
          content: '🔒';
          font-size: 60px;
          opacity: 0.2;
          position: absolute;
          top: 20px;
          right: 30px;
        }
        
        .company-logo {
          max-width: 120px;
          margin-bottom: 20px;
          filter: brightness(0) invert(1);
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 50px 40px;
        }
        
        .greeting {
          font-size: 20px;
          color: #1f2937;
          margin-bottom: 25px;
          font-weight: 600;
        }
        
        .reset-box {
          background: linear-gradient(145deg, #fef2f2, #fecaca);
          border: 2px solid #ef4444;
          border-radius: 15px;
          padding: 35px;
          text-align: center;
          margin: 30px 0;
          position: relative;
        }
        
        .reset-box::before {
          content: '🔑';
          font-size: 40px;
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 0 15px;
        }
        
        .reset-text {
          color: #991b1b;
          font-size: 16px;
          margin-bottom: 25px;
          line-height: 1.6;
        }
        
        .reset-button {
          display: inline-block;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 18px 40px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .reset-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .reset-button:hover::before {
          left: 100%;
        }
        
        .reset-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4);
        }
        
        .security-info {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
        }
        
        .security-info h3 {
          color: #0369a1;
          font-size: 16px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }
        
        .security-info h3::before {
          content: '🛡️';
          margin-right: 8px;
        }
        
        .info-grid {
          display: grid;
          gap: 10px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          color: #0c4a6e;
          font-size: 14px;
          padding: 8px 0;
          border-bottom: 1px solid #bae6fd;
        }
        
        .info-item:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 600;
        }
        
        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 30px 0;
          border-radius: 8px;
        }
        
        .warning-box h3 {
          color: #92400e;
          font-size: 16px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }
        
        .warning-box h3::before {
          content: '⚠️';
          margin-right: 8px;
        }
        
        .warning-box p {
          color: #78350f;
          font-size: 14px;
          line-height: 1.5;
          margin: 5px 0;
        }
        
        .footer {
          background: #f8fafc;
          padding: 30px 40px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
          margin: 10px 0;
          font-size: 14px;
        }
        
        .footer .company-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 15px 10px;
          }
          
          .header,
          .content,
          .footer {
            padding: 25px 20px;
          }
          
          .reset-box {
            padding: 25px 20px;
          }
          
          .reset-button {
            display: block;
            margin: 20px 0;
          }
          
          .info-item {
            flex-direction: column;
            gap: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${data.companyLogo ? `<img src="${data.companyLogo}" alt="Company Logo" class="company-logo">` : ''}
          <h1>Password Reset</h1>
          <p>Secure password reset request</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${data.recipientName}! 🔐
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset the password for your account. If this was you, click the button below to create a new password.
          </p>
          
          <div class="reset-box">
            <div class="reset-text">
              <strong>Click the button below to reset your password:</strong>
            </div>
            <a href="${data.resetLink}" class="reset-button">
              Reset Password
            </a>
          </div>
          
          <div class="security-info">
            <h3>Request Details</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Request Time:</span>
                <span>${data.requestTime || new Date().toLocaleString()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">IP Address:</span>
                <span>${data.userIP || 'Not available'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Link Expires:</span>
                <span>${data.expiryTime || '1 hour'}</span>
              </div>
            </div>
          </div>
          
          <div class="warning-box">
            <h3>Important Security Notice</h3>
            <p>• This password reset link will expire in ${data.expiryTime || '1 hour'}</p>
            <p>• If you didn't request this reset, please ignore this email</p>
            <p>• For security reasons, this link can only be used once</p>
            <p>• If you continue to receive these emails, contact our support team immediately</p>
            <p>• Link: <small style="word-break: break-all;">${data.resetLink}</small></p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
            If you're having trouble clicking the button, copy and paste the URL into your web browser.
          </p>
        </div>
        
        <div class="footer">
          <p class="company-name">${data.companyName || 'Your Company'}</p>
          <p>© 2025 All rights reserved.</p>
          <p>This is an automated security message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
});
