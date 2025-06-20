import { UserProfile, IUserProfile } from '../../models/profile.model'

type BasicInfoPayload = {
  userId: string
  basic: {
    fullName: string
    phone: string
    email: string
    dateOfBirth: Date
    profilePicFile?: { name: string; url: string }
  }
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
export async function getUserProfile(userId: string): Promise<IUserProfile | null> {
  const profile = await UserProfile.findOne({ userId })
  return profile
}