import { Application } from '../models/application.model';

export async function dashboard() {
  const totalApplications = await Application.countDocuments();

  const appliedCount = await Application.countDocuments({ status: 'applied' });
  const submittedCount = await Application.countDocuments({ status: 'submitted' });
  const scheduledCount = await Application.countDocuments({ status: 'scheduled' });
  const underReviewCount = await Application.countDocuments({ status: 'under-review' });
  const selectedCount = await Application.countDocuments({ status: 'selected' });
  const rejectedCount = await Application.countDocuments({ status: 'rejected' });

  return {
    totalApplications,
    appliedCount,
    submittedCount,
    scheduledCount,
    underReviewCount,
    selectedCount,
    rejectedCount
  };
}


export async function recentApplications() {

  const recentApplications = await Application.aggregate([
    { $sort: { submittedAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'userprofiles', 
        localField: 'userId',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
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
  ])

  return recentApplications 
}


