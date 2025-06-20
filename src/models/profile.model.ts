import mongoose from 'mongoose'

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  basic: {
    fullName: string
    phone: string
    email: string
    dateOfBirth: Date
    profilePicFile: { name: string; url: string }
  }
  identity: {
    nidNumber: string
    nidFiles: { name: string; url: string }[]
  }
  education: {
    degree: string
    certificateFiles: { title: string; name: string; url: string }[]
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
      dateOfBirth: { type: Date },
      profilePicFile: {
        name: { type: String },
        url: { type: String }
      },
    },
    identity: {
      nidNumber: { type: String },
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
        certificateFiles: [
          {
            title: { type: String },
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
