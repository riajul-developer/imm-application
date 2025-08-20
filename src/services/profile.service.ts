import mongoose from 'mongoose'
import { UserProfile, IUserProfile, IIdentity, IBasic, IEmergencyContact, IAddress, IOther, IFile, IWorkInfo, IEducationFiles, INdaFiles, IAgreementFiles } from '../models/profile.model'
import { Application } from '../models/application.model'

type BasicInfoPayload = {
  userId: mongoose.Types.ObjectId;
  basic: IBasic
}

type IdentityPayload = {
  userId: mongoose.Types.ObjectId;
  identity: IIdentity
}
export interface EmergencyContactPayload {
 userId: mongoose.Types.ObjectId;
 emergencyContact: IEmergencyContact
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
  cvFile: IFile;
}
export interface WorkInfoPayload {
  userId: mongoose.Types.ObjectId;
  workInfo: IWorkInfo;
}
export interface  EducationFilesPayload {
  userId: mongoose.Types.ObjectId
  educationFiles: {
    sscCertFile?: IFile
    lastCertFile?: IFile
  }
}

export interface TestimonialFilePayload {
  userId: mongoose.Types.ObjectId;
  testimonialFile: IFile;
}

export interface MyVerifiedFilePayload {
  userId: mongoose.Types.ObjectId;
  myVerifiedFile: IFile;
}

export interface CommitmentFilePayload {
  userId: mongoose.Types.ObjectId;
  commitmentFile: IFile;
}

export interface  NdaFilesPayload {
  userId: mongoose.Types.ObjectId
  ndaFiles: {
    firstPageFile?: IFile
    secondPageFile?: IFile
  }
}

export interface  AgreementFilesPayload {
  userId: mongoose.Types.ObjectId
  agreementFiles: {
    firstPageFile?: IFile
    secondPageFile?: IFile
  }
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

export async function upsertCvFile(payload: CvFilePayload): Promise<IFile> {
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

export async function upsertEducationFiles(payload: EducationFilesPayload): Promise<IEducationFiles> {
  const { userId, educationFiles } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { educationFiles } },
    { upsert: true, new: true }
  )

  return profile.educationFiles
}

export async function upsertTestimonialFile(payload: TestimonialFilePayload): Promise<IFile> {
  const { userId, testimonialFile } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { testimonialFile } },
    { upsert: true, new: true }
  )
  
  return profile.testimonialFile
}

export async function upsertMyVerifiedFile(payload: MyVerifiedFilePayload): Promise<IFile> {
  const { userId, myVerifiedFile } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { myVerifiedFile } },
    { upsert: true, new: true }
  )
  
  return profile.myVerifiedFile
}

export async function upsertCommitmentFile(payload: CommitmentFilePayload): Promise<IFile> {
  const { userId, commitmentFile } = payload
  
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { commitmentFile } },
    { upsert: true, new: true }
  )
  
  return profile.commitmentFile
}

export async function upsertNdaFiles(payload: NdaFilesPayload): Promise<INdaFiles> {
  const { userId, ndaFiles } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { ndaFiles } },
    { upsert: true, new: true }
  )

  return profile.ndaFiles
}

export async function upsertAgreementFiles(payload: AgreementFilesPayload): Promise<IAgreementFiles> {
  const { userId, agreementFiles } = payload

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { agreementFiles } },
    { upsert: true, new: true }
  )

  return profile.agreementFiles
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
                    profile.basic?.educationLevel &&
                    profile.basic?.gender &&
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
                      profile.other?.mothersName 

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

  const applicationStatus = await Application.findOne({
    userId,
    status: { $in: ['selected', 'under-review', 'submitted'] },
  });

  if (!applicationStatus) return false

  const workInfoValid = profile.workInfo?.employeeId &&
    profile.workInfo?.projectName &&
    profile.workInfo?.branch &&
    profile.workInfo?.shift &&
    profile.workInfo?.reference

  const educationValid = profile.educationFiles?.sscCertFile

  const testimonialValid = profile.testimonialFile

  const myVerifiedValid = profile.myVerifiedFile

  const commitmentValid = profile.commitmentFile

  const ndaValid = profile.ndaFiles

  const agreementValid = profile.agreementFiles

  const allValid = Boolean(
    workInfoValid &&
    educationValid &&
    testimonialValid &&
    ndaValid &&
    agreementValid
  )

  return !allValid
}
