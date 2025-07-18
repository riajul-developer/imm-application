import nodemailer from 'nodemailer'
import { verifyTemplate, VerifyTemplateData } from '../templates/verifyEmail';

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    })
    return true
  } catch (error) {
    throw new Error('Failed to send email')
  }
}

export async function sendVerifyEmail(to: string, data: VerifyTemplateData) {
  const template = verifyTemplate(data);
  return sendEmail(to, template.subject, template.text, template.html);
}
