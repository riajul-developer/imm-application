import mongoose from 'mongoose'

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  fullName: string
  dateOfBirth: Date
  phoneNumber: string
  educationalQualifications: string
  nationalIdCard: string
  fatherName: string
  motherName: string
  presentAddress: {
    village: string
    postOffice: string
    policeStation: string
    district: string
  }
  permanentAddress: {
    village: string
    postOffice: string
    policeStation: string
    district: string
  }
  emailAddress: string
  religion: string
  emergencyContact: {
    name: string
    phoneNumber: string
  }
  documents: {
    cv?: string
    nidOrBirthCertificate?: string
    educationCertificate?: string
    testimonial?: string
  }
  createdAt: Date
  updatedAt: Date
}

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  phoneNumber: { type: String, required: true },
  educationalQualifications: { type: String, required: true },
  nationalIdCard: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  presentAddress: {
    village: { type: String, required: true },
    postOffice: { type: String, required: true },
    policeStation: { type: String, required: true },
    district: { type: String, required: true }
  },
  permanentAddress: {
    village: { type: String, required: true },
    postOffice: { type: String, required: true },
    policeStation: { type: String, required: true },
    district: { type: String, required: true }
  },
  emailAddress: { type: String, required: true },
  religion: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },
  documents: {
    cv: String,
    nidOrBirthCertificate: String,
    educationCertificate: String,
    testimonial: String
  }
}, {
  timestamps: true
})

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema)
