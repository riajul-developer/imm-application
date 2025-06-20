import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profile'
import { applicationRoutes } from './routes/application'
import { adminRoutes } from './routes/admin'

dotenv.config()

const fastify = Fastify({ logger: true })

// Register plugins
fastify.register(cors, {
  origin: true
})

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/application-form')
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(profileRoutes, { prefix: '/api/profile' })
fastify.register(applicationRoutes, { prefix: '/api/application' })
fastify.register(adminRoutes, { prefix: '/api/admin' })

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
  try {
    await connectDB()
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()