import { User } from '../../models/user.model'
import { sendSMS } from '../../utils/sms.util'

export async function sendOtp(phoneNumber: string) {
  // const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otp = 123456
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await User.findOneAndUpdate(
    { phoneNumber },
    { otp, otpExpiry },
    { upsert: true, new: true }
  )

  // await sendSMS(phoneNumber, `Your OTP is: ${otp}. Valid for 10 minutes.`)
}

export async function verifyOtp(phoneNumber: string, otp: string, request: any) {
  const user = await User.findOne({ phoneNumber })

  if (
    !user ||
    user.otp !== otp ||
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {
    throw new Error('Invalid or expired OTP')
  }

  user.isVerified = true
  user.otp = undefined
  user.otpExpiry = undefined
  await user.save()

  return request.server.jwt.sign({ userId: user._id, phoneNumber })
}