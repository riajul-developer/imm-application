import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import mongoose from 'mongoose'
import fastifyStatic from '@fastify/static'
import { join } from 'path'
import dotenv from 'dotenv'
import adminRoutes from './routes/admin.route'
import clientRoutes from './routes/client.route'

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

fastify.register(fastifyStatic, {
  root: join(process.cwd(), 'uploads'),
  prefix: '/uploads/', 
})

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

mongoose.set('toJSON', { 
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
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
fastify.register(clientRoutes, { prefix: '/api' })
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
    console.log('Server running on port : 3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()