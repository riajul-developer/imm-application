import mongoose from 'mongoose'
import { UserProfile, IUserProfile, IIdentity, IBasic, IEmergencyContact, IAddress, IOther, ICvFile, IWorkInfo, IEducation, ITestimonial, IMyVerified, ICommitmentNote } from '../models/profile.model'
import { Application } from '../models/application.model'

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
    certificateFile: { name: string; url: string }
  }
}

type TestimonialPayload = {
  userId: string
  testimonial: {
    title: string
    testimonialFile: { name: string; url: string }
  }
}

type MyVerifiedPayload = {
  userId: string
  myVerified: {
    title: string
    myVerifiedFile: { name: string; url: string }
  }
}

type CommitmentNotePayload = {
  userId: string
  commitmentNote: {
    title: string
    commitmentFile: { name: string; url: string }
  }
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

export interface WorkInfoPayload {
  userId: mongoose.Types.ObjectId;
  workInfo: IWorkInfo;
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

export async function upsertWorkInfo(payload: WorkInfoPayload): Promise<IWorkInfo> {
  const { userId, workInfo } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { workInfo } },
    { upsert: true, new: true }
  )
  
  return profile.workInfo
}


export async function upsertEducation(payload: EducationPayload): Promise<IEducation> {
  const { userId, education } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { education } },
    { upsert: true, new: true }
  )

  return profile.education
}

export async function upsertTestimonial(payload: TestimonialPayload): Promise<ITestimonial> {
  const { userId, testimonial } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { testimonial } },
    { upsert: true, new: true }
  )

  return profile.testimonial
}

export async function upsertMyVerified(payload: MyVerifiedPayload): Promise<IMyVerified> {
  const { userId, myVerified } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { myVerified } },
    { upsert: true, new: true }
  )

  return profile.myVerified
}

export async function upsertCommitmentNote(payload: CommitmentNotePayload): Promise<ICommitmentNote> {
  const { userId, commitmentNote } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { commitmentNote } },
    { upsert: true, new: true }
  )

  return profile.commitmentNote
}

export async function getUserProfile(userId: string): Promise<IUserProfile | null> {
  const profile = await UserProfile.findOne({ userId })
  return profile
}

export async function checkCanApply(userId: string): Promise<boolean> {
    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return false;
    }

    const hasBasicInfo = profile.basic?.fullName && 
                      profile.basic?.dateOfBirth && 
                      profile.basic?.phone &&
                      profile.basic?.profilePicFile?.name &&
                      profile.basic?.profilePicFile?.url;

    const hasIdentity = profile.identity?.number && 
                      profile.identity?.docFiles?.length >= 1; 

    const hasEmergencyContact = profile.emergencyContact?.name && 
                      profile.emergencyContact?.phone;

    const hasPresentAddress = profile.address?.present?.district && 
                      profile.address?.present?.upazila && 
                      profile.address?.present?.street;

    const hasPermanentAddress = profile.address?.permanent?.district && 
                      profile.address?.permanent?.upazila && 
                      profile.address?.permanent?.street;

    const hasOtherInfo = profile.other?.fathersName && 
                        profile.other?.mothersName && 
                        profile.other?.religion && 
                        profile.other?.gender && 
                        profile.other?.maritalStatus;

    const hasCvFile = profile.cvFile?.name && profile.cvFile?.url;

    const isProfileComplete = Boolean(
      hasBasicInfo &&
      hasIdentity &&
      hasEmergencyContact &&
      hasPresentAddress &&
      hasPermanentAddress &&
      hasOtherInfo &&
      hasCvFile
    );

    if (!isProfileComplete) return false;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentApplication = await Application.findOne({
      userId,
      submittedAt: { $gte: twentyFourHoursAgo }
    });

    if (recentApplication) {
      return false;
    }

  return true;
}

export async function needAdditionalInfo(userId: string): Promise<boolean> {
  const profile = await UserProfile.findOne({ userId })

  if (!profile) return false;

  const approvedApplication = await Application.findOne({ userId, status: 'approved' })
  if (!approvedApplication) return false

  const workInfoValid = profile.workInfo?.employeeId &&
    profile.workInfo?.projectName &&
    profile.workInfo?.branch &&
    profile.workInfo?.shift &&
    profile.workInfo?.reference

  const educationValid = profile.education?.degree &&
    profile.education?.cgpaOrGpa !== undefined &&
    profile.education?.passingYear &&
    profile.education?.certificateFile?.name &&
    profile.education?.certificateFile?.url

  const testimonialValid = profile.testimonial?.title &&
    profile.testimonial?.testimonialFile?.name &&
    profile.testimonial?.testimonialFile?.url

  const myVerifiedValid = profile.myVerified?.title &&
    profile.myVerified?.myVerifiedFile?.name &&
    profile.myVerified?.myVerifiedFile?.url

  const commitmentNoteValid = profile.commitmentNote?.title &&
    profile.commitmentNote?.commitmentFile?.name &&
    profile.commitmentNote?.commitmentFile?.url

  const allValid = Boolean(
    workInfoValid &&
    educationValid &&
    testimonialValid &&
    myVerifiedValid &&
    commitmentNoteValid
  )

  return !allValid
}
