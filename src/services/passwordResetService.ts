import { cloudKitService, CloudKitRecord } from './cloudkitService';
import { RESEND_CONFIG, EMAIL_TEMPLATES } from '../config/resend';
import { CLOUDKIT_FIELDS } from '../config/cloudkit';

export class PasswordResetService {
  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting password reset for token:', token.substring(0, 8) + '...');

      // 1. Verify token in CloudKit
      const user = await this.getUserByResetToken(token);
      if (!user) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      // 2. Check if token is expired
      const tokenExpiry = user.fields[CLOUDKIT_FIELDS.TOKEN_EXPIRY]?.value;
      if (this.isTokenExpired(tokenExpiry)) {
        return { success: false, message: 'Reset token has expired. Please request a new one.' };
      }

      // 3. Hash new password using same algorithm as iOS app
      const hashedPassword = await cloudKitService.hashPassword(newPassword);

      // 4. Update user password in CloudKit
      const updateSuccess = await cloudKitService.updateUserPassword(user, hashedPassword);
      if (!updateSuccess) {
        return { success: false, message: 'Failed to update password. Please try again.' };
      }

      console.log('Password reset successful for user:', user.fields.email?.value);
      return { success: true, message: 'Password reset successfully!' };

    } catch (error) {
      console.error('Password reset failed:', error);
      return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
  }

  /**
   * Get user by reset token from CloudKit
   */
  private async getUserByResetToken(token: string): Promise<CloudKitRecord | null> {
    try {
      return await cloudKitService.findUserByResetToken(token);
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      return null;
    }
  }

  /**
   * Check if reset token is expired
   */
  private isTokenExpired(tokenExpiry: string | number | Date | null): boolean {
    if (!tokenExpiry) return true;
    
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    
    return now > expiryDate;
  }

  /**
   * Validate reset token (check if exists and not expired)
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; message: string }> {
    try {
      const user = await this.getUserByResetToken(token);
      
      if (!user) {
        return { valid: false, message: 'Invalid reset token' };
      }

      const tokenExpiry = user.fields[CLOUDKIT_FIELDS.TOKEN_EXPIRY]?.value;
      if (this.isTokenExpired(tokenExpiry)) {
        return { valid: false, message: 'Reset token has expired' };
      }

      return { valid: true, message: 'Token is valid' };

    } catch (error) {
      console.error('Error validating reset token:', error);
      return { valid: false, message: 'Failed to validate token' };
    }
  }

  /**
   * Send password reset email (for future backend integration)
   * This would typically be called from your backend server
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const resetLink = `https://tuneboxed.com/reset-password?token=${resetToken}`;
      
      const emailData = {
        from: RESEND_CONFIG.fromEmail,
        to: email,
        subject: EMAIL_TEMPLATES.PASSWORD_RESET.subject,
        html: EMAIL_TEMPLATES.PASSWORD_RESET.getHtml(resetLink),
        text: EMAIL_TEMPLATES.PASSWORD_RESET.getText(resetLink)
      };

      const response = await fetch(RESEND_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Password reset email sent:', result.id);
        return { success: true, message: 'Password reset email sent successfully' };
      } else {
        const error = await response.text();
        console.error('Failed to send email:', error);
        return { success: false, message: 'Failed to send password reset email' };
      }

    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, message: 'Failed to send password reset email' };
    }
  }

  /**
   * Generate a secure reset token
   */
  generateResetToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get token expiry date (1 hour from now)
   */
  getTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry
    return expiry;
  }
}

export const passwordResetService = new PasswordResetService(); 