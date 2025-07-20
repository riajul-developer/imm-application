import mongoose from 'mongoose'

export interface IBasic {
  fullName: string
  phone: string
  email: string
  dateOfBirth: Date
  educationLevel: string,
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

export interface IFile {
  name: string;
  url: string;
}

export interface IWorkInfo {
  employeeId: string;
  projectName: string;
  branch: string;
  shift: string;
  reference?: string;
}

export interface IEducationFiles {
  sscCertFile: IFile;
  lastCertFile: IFile;
}
export interface INdaFiles {
  firstPageFile: IFile;
  secondPageFile: IFile;
}

export interface IAgreementFiles {
  firstPageFile: IFile;
  secondPageFile: IFile;
}

export interface IUserProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  basic: IBasic
  identity: IIdentity
  emergencyContact: IEmergencyContact
  address: IAddress
  other: IOther
  cvFile: IFile
  workInfo: IWorkInfo
  educationFiles: IEducationFiles
  testimonialFile: IFile
  myVerifiedFile: IFile
  commitmentFile: IFile
  ndaFiles: INdaFiles
  agreementFiles: IAgreementFiles
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
      educationLevel: { type: String },
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
    workInfo: {
      employeeId: { type: String },
      projectName: { type: String },
      branch: { type: String },
      shift: { type: String },
      reference: { type: String },
    },
    educationFiles: {
      sscCertFile: {
        name: { type: String },
        url: { type: String }
      },
      lastCertFile: {
        name: { type: String },
        url: { type: String }
      }
    },
    testimonialFile: {
      name: { type: String },
      url: { type: String }
    },
    myVerifiedFile: {
      name: { type: String },
      url: { type: String }
    },
    commitmentFile: {
      name: { type: String },
      url: { type: String }
    },
    ndaFiles: {
      firstPageFile: {
        name: { type: String },
        url: { type: String }
      },
      secondPageFile: {
        name: { type: String },
        url: { type: String }
      }
    },
    agreementFiles: {
      firstPageFile: {
        name: { type: String },
        url: { type: String }
      },
      secondPageFile: {
        name: { type: String },
        url: { type: String }
      }
    },
  },
  {
    timestamps: true
  }
)

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema)
