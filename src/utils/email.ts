import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`Email to ${to}: ${subject} - ${text}`) // For development
      return
    }
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text
    })
  } catch (error) {
    console.error('Email sending error:', error)
  }
}