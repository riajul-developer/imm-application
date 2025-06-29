import mongoose from 'mongoose'

export interface IBasic {
  fullName: string
  phone: string
  email: string
  dateOfBirth: Date
  profilePicFile: { name: string; url: string }
}


export interface IIdentity {
  number: string;
  docFiles: Array<{
    type: string;
    side?: string;
    name: string;
    url: string;
  }>;
}

export interface IAddress {
  present: {
    district: string;
    upazila: string;
    street: string;
  }
  permanent: {
    district: string;
    upazila: string;
    street: string;
  }
}

export interface IEmergencyContact {
  name: string;
  phone: string;
}

export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface IOther {
  fathersName: string;
  mothersName: string;
  religion: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
}

export interface ICvFile {
  name: string;
  url: string;
}
export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  basic: IBasic
  identity: IIdentity
  emergencyContact: IEmergencyContact
  address: IAddress
  other: IOther
  cvFile: ICvFile
  education: {
    degree: string
    cgpaOrGpa?: number 
    passingYear: number
    certificateFiles: { name: string; url: string }[]
  }[]
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
      number: { type: String },
      docFiles: [
        {
          type: { type: String },
          side: { type: String },
          name: { type: String },
          url: { type: String }
        }
      ]
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String }
    },
    address: {
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
      religion: { type: String },
      gender: {
        type: String,
        enum: ['male', 'female', 'other']
      },
      maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed']
      }
    },
    cvFile: {
      name: { type: String },
      url: { type: String }
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
  },
  {
    timestamps: true
  }
)

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema)
