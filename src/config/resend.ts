// Resend Email Service Configuration
export const RESEND_CONFIG = {
  apiKey: 're_6WgWyJqG_JCBVgYfiStYJZr2bju7oer5v',
  fromEmail: 'noreply@tuneboxed.com',
  apiEndpoint: 'https://api.resend.com/emails'
};

// Email templates
export const EMAIL_TEMPLATES = {
  PASSWORD_RESET: {
    subject: 'Reset Your TuneBoxed Password',
    getHtml: (resetLink: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your TuneBoxed Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #667eea; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 12px; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 14px 28px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎵 TuneBoxed</div>
          </div>
          
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your TuneBoxed password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
          </div>
          
          <div class="footer">
            <p>© 2024 TuneBoxed. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (resetLink: string) => `
      TuneBoxed Password Reset
      
      We received a request to reset your TuneBoxed password.
      
      Click this link to reset your password: ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, you can safely ignore this email.
      
      © 2024 TuneBoxed
    `
  }
}; 