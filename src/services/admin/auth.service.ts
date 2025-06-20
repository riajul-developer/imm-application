import { Admin } from '../../models/admin.model'

export async function loginAdmin(email: string, password: string, request: any) {
  const admin = await Admin.findOne({ email })
  if (!admin || !(await admin.comparePassword(password))) {
    throw new Error('Invalid credentials')
  }
  const token = request.server.jwt.sign({ adminId: admin._id, email, role: 'admin' })
  return { success: true, token, message: 'Login successful' }
}