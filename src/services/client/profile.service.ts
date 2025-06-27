import mongoose from 'mongoose'
import { UserProfile, IUserProfile, IIdentity, IBasic, IEmergencyContact, IAddress, IOther, ICvFile } from '../../models/profile.model'

type BasicInfoPayload = {
  userId: string
  basic: {
    fullName: string
    phone: string
    email: string
    profilePicFile?: { name: string; url: string }
  }
}

type IdentityPayload = {
  userId: string
  identity: {
    number: string
    docFiles: {type: string, side?: string, name: string; url: string }[]
  }
}

type EducationPayload = {
  userId: string
  education: {
    degree: string
    cgpaOrGpa: number
    passingYear: number
    certificateFiles: { name: string; url: string }[]
  }[]
}
export interface EmergencyContactPayload {
 userId: string;
 emergencyContact: {
   name: string;
   phone: string;
 }
}

export interface AddressPayload {
  userId: mongoose.Types.ObjectId;
  address: IAddress;
}

export interface OtherPayload {
  userId: mongoose.Types.ObjectId;
  other: IOther;
}

export interface CvFilePayload {
  userId: mongoose.Types.ObjectId;
  cvFile: ICvFile;
}

export async function upsertBasicInfo(payload: BasicInfoPayload): Promise<IBasic> {
  const { userId, basic } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { basic } },
    { upsert: true, new: true }
  )

  return profile.basic
}

export async function upsertIdentity(payload: IdentityPayload): Promise<IIdentity> {
  const { userId, identity } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { identity } },
    { upsert: true, new: true }
  )

  return profile.identity
}

export async function upsertEmergencyContact(payload: EmergencyContactPayload): Promise<IEmergencyContact> {
  const { userId, emergencyContact } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { emergencyContact } },
    { upsert: true, new: true }
  )
  
  return profile.emergencyContact
}

export async function upsertAddress(payload: AddressPayload): Promise<IAddress> {
  const { userId, address } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { address } },
    { upsert: true, new: true }
  )
  
  return profile.address
}

export async function upsertOther(payload: OtherPayload): Promise<IOther> {
  const { userId, other } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { other } },
    { upsert: true, new: true }
  )
  
  return profile.other
}

export async function upsertCvFile(payload: CvFilePayload): Promise<ICvFile> {
  const { userId, cvFile } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { cvFile } },
    { upsert: true, new: true }
  )
  
  return profile.cvFile
}

export async function upsertEducation(payload: EducationPayload): Promise<IUserProfile> {
  const { userId, education } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { education } },
    { upsert: true, new: true }
  )

  return profile
}

export async function getUserProfile(userId: string): Promise<IUserProfile | null> {
  const profile = await UserProfile.findOne({ userId })
  return profile
}