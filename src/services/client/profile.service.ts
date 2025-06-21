import { UserProfile, IUserProfile } from '../../models/profile.model'

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
    nidNumber: string
    dateOfBirth: string
    nidFiles: { name: string; url: string }[]
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

export async function upsertBasicInfo(payload: BasicInfoPayload): Promise<IUserProfile> {
  const { userId, basic } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { basic } },
    { upsert: true, new: true }
  )

  return profile
}

export async function upsertIdentity(payload: IdentityPayload): Promise<IUserProfile> {
  const { userId, identity } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { identity } },
    { upsert: true, new: true }
  )

  return profile
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