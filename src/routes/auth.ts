import { FastifyInstance } from 'fastify'
import { User } from '../models/User'
import { sendOtpSchema, verifyOtpSchema } from '../schemas/validation'
import { sendSMS } from '../utils/sms'

export async function authRoutes(fastify: FastifyInstance) {
  // Send OTP
  fastify.post('/send-otp', async (request, reply) => {
    try {
      const { phoneNumber } = sendOtpSchema.parse(request.body)
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      
      await User.findOneAndUpdate(
        { phoneNumber },
        { otp, otpExpiry },
        { upsert: true, new: true }
      )
      
      // Send SMS
      await sendSMS(phoneNumber, `Your OTP is: ${otp}. Valid for 10 minutes.`)
      
      return { success: true, message: 'OTP sent successfully' }
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : String(error) })
    }
  })
  
  // Verify OTP
  fastify.post('/verify-otp', async (request, reply) => {
    try {
      const { phoneNumber, otp } = verifyOtpSchema.parse(request.body)
      
      const user = await User.findOne({ phoneNumber })
      if (
        !user ||
        user.otp !== otp ||
        !user.otpExpiry ||
        user.otpExpiry < new Date()
      ) {
        return reply.status(400).send({ error: 'Invalid or expired OTP' })
      }
      
      user.isVerified = true
      user.otp = undefined
      user.otpExpiry = undefined
      await user.save()
      
      const token = fastify.jwt.sign({ userId: user._id, phoneNumber })
      
      return { success: true, token, message: 'OTP verified successfully' }
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : String(error) })
    }
  })
}