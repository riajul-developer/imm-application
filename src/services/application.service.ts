import { FastifyRequest } from 'fastify';
import { Application, IApplication } from '../models/application.model'
import { UserProfile } from '../models/profile.model'

interface UpdateStatusInput {
  status: 'submitted' | 'under-review' | 'approved' | 'rejected';
  adminNotes?: string;
  rejectionReason?: string;
}

export const createApplication = async (userId: string): Promise<IApplication> => {

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const recentApplication = await Application.findOne({
    userId,
    submittedAt: { $gte: twentyFourHoursAgo }
  }).sort({ submittedAt: -1 })

  if (recentApplication) {
    const nextAllowedTime = new Date(recentApplication.submittedAt.getTime() + 24 * 60 * 60 * 1000)
    const hoursLeft = Math.ceil((nextAllowedTime.getTime() - Date.now()) / (1000 * 60 * 60))
    
    throw new Error(`You can apply again after ${hoursLeft} hours`)
  }

  const application = new Application({
    userId,
    status: 'submitted'
  })

  return await application.save()
}

export const getUserApplications = async (userId: string): Promise<IApplication[] | null> => {
  return await Application.find({ userId })
}

export const checkUserCanCompleteProfile = async (userId: string): Promise<boolean> => {
  const application = await Application.findOne({ userId })
  return application?.status === 'approved'
}

export async function allApplications(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  status?: string,
  appliedFrom?: string,
  appliedTo?: string
) {
  const baseUrl = process.env.BASE_URL;
  const skip = (page - 1) * limit;

  const matchConditions: any[] = [];

  if (search) {
    matchConditions.push({
      $or: [
        { 'profile.basic.fullName': { $regex: search, $options: 'i' } },
        { 'profile.basic.email': { $regex: search, $options: 'i' } },
        { 'profile.basic.phone': { $regex: search, $options: 'i' } }
      ]
    });
  }

  if (status) {
    matchConditions.push({ status: status });
  }

  if (appliedFrom || appliedTo) {
    const dateFilter: any = {};
    if (appliedFrom) dateFilter.$gte = new Date(appliedFrom);
    if (appliedTo) dateFilter.$lte = new Date(appliedTo);
    matchConditions.push({ submittedAt: dateFilter });
  }

  const matchStage = matchConditions.length > 0 ? { $match: { $and: matchConditions } } : null;

  const aggregationPipeline: any[] = [
    { $sort: { submittedAt: -1 } },
    {
      $lookup: {
        from: 'userprofiles',
        localField: 'userId',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
  ];

  if (matchStage) aggregationPipeline.push(matchStage);

  aggregationPipeline.push(
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        name: '$profile.basic.fullName',
        email: '$profile.basic.email',
        phone: '$profile.basic.phone',
        profileImage: '$profile.basic.profilePicFile.url',
        submittedDate: '$submittedAt',
        status: 1,        
        adminNotes: 1,
        rejectionReason: 1
      }
    }
  );

  const applications = await Application.aggregate(aggregationPipeline);

  const countPipeline: any[] = [
    {
      $lookup: {
        from: 'userprofiles',
        localField: 'userId',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
  ];
  if (matchStage) countPipeline.push(matchStage);
  countPipeline.push({ $count: 'total' });

  const countResult = await Application.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const params = {
  page: String(page),
  limit: String(limit),
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(appliedFrom ? { appliedFrom } : {}),
    ...(appliedTo ? { appliedTo } : {})
  };

  const queryParams = new URLSearchParams(params);

  const links = {
    self: `${baseUrl}?${queryParams.toString()}`,
    next: hasNextPage ? `${baseUrl}?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}` : null,
    prev: hasPrevPage ? `${baseUrl}?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}` : null
  };

  return {
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      links
    },
    applications
  };
}

export async function getApplicationById(applicationId: string) {
  const application = await Application.findById(applicationId);
  if (!application) return null;

  const profile = await UserProfile.findOne({ userId: application.userId });

  return {
    application,
    profile: profile || null,
  };
}

export const updateApplication = async (applicationId: string, data: UpdateStatusInput) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }

  application.status = data.status;
  if (data.adminNotes) application.adminNotes = data.adminNotes;
  if (data.status === 'rejected') {
    application.rejectionReason = data.rejectionReason ?? '';
  } else {
    application.rejectionReason = undefined;
  }

  await application.save();
  return application;
};