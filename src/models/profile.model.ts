import mongoose from 'mongoose'

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  basic: {
    fullName: string
    phone: string
    email: string
    profilePicFile: { name: string; url: string }
  }
  identity: {
    nidNumber: string
    dateOfBirth: Date
    nidFiles: { name: string; url: string }[]
  }
  education: {
    degree: string
    cgpaOrGpa?: number 
    passingYear: number
    certificateFiles: { name: string; url: string }[]
  }[]
  emergencyContact: {
    name: string
    phone: string
  }
  address: {
    isSameAddress: boolean
    present: {
      district: string
      upazila: string
      street: string
    }
    permanent: {
      district: string
      upazila: string
      street: string
    }
  }
  other: {
    fathersName: string
    mothersName: string
    religion: string
  }
  createdAt: Date
  updatedAt: Date
}

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    basic: {
      fullName: { type: String },
      phone: { type: String },
      email: { type: String },
      profilePicFile: {
        name: { type: String },
        url: { type: String }
      },
    },
    identity: {
      nidNumber: { type: String },
      dateOfBirth: { type: Date },
      nidFiles: [
        {
          name: { type: String },
          url: { type: String }
        }
      ]
    },
    education: [
      {
        degree: { type: String },
        cgpaOrGpa: { 
          type: Number,
          min: 0,
          max: 5.0 
        },
        passingYear: { 
          type: Number,
          min: 1950, 
          max: new Date().getFullYear() + 1 
        },
        certificateFiles: [
          {
            name: { type: String },
            url: { type: String }
          }
        ]
      }
    ],
    emergencyContact: {
      name: { type: String },
      phone: { type: String }
    },
    address: {
      isSameAddress: { type: Boolean },
      present: {
        district: { type: String },
        upazila: { type: String },
        street: { type: String }
      },
      permanent: {
        district: { type: String },
        upazila: { type: String },
        street: { type: String }
      }
    },
    other: {
      fathersName: { type: String },
      mothersName: { type: String },
      religion: { type: String }
    }
  },
  {
    timestamps: true
  }
)

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema)
