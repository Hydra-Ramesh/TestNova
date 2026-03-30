import { Resend } from 'resend';

let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.warn('⚠️ RESEND_API_KEY not set — email features disabled');
  }
} catch (err) {
  console.warn('⚠️ Resend init failed:', err.message);
}
const FROM_EMAIL = process.env.EMAIL_FROM || 'TestNova <noreply@testnova.com>';

export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your TestNova account',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">TestNova</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">AI-Powered Exam Platform</p>
          </div>
          <h2 style="font-size: 20px; color: #f1f5f9;">Welcome, ${name}! 🎉</h2>
          <p style="color: #94a3b8; line-height: 1.6;">Please verify your email address to start taking AI-generated mock tests for JEE & NEET.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This link expires in 24 hours. If you didn't create this account, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your TestNova password',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">TestNova</h1>
          </div>
          <h2 style="font-size: 20px; color: #f1f5f9;">Hi ${name},</h2>
          <p style="color: #94a3b8; line-height: 1.6;">You requested a password reset. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};
