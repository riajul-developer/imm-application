import { Application } from '../models/application.model';

export async function dashboard(startDate?: string, endDate?: string) {
  let dateFilter = {};
  
  if (startDate && endDate) {
    dateFilter = { 
      createdAt: { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      } 
    };
  } else if (startDate) {
    dateFilter = { 
      createdAt: { 
        $gte: new Date(startDate) 
      } 
    };
  } else if (endDate) {
    dateFilter = { 
      createdAt: { 
        $lte: new Date(endDate) 
      } 
    };
  }

  const totalApplications = await Application.countDocuments(dateFilter);
  const appliedCount = await Application.countDocuments({
    status: 'applied',
    ...dateFilter
  });
  const submittedCount = await Application.countDocuments({
    status: 'submitted',
    ...dateFilter
  });
  const scheduledCount = await Application.countDocuments({
    status: 'scheduled',
    ...dateFilter
  });
  const underReviewCount = await Application.countDocuments({
    status: 'under-review',
    ...dateFilter
  });
  const selectedCount = await Application.countDocuments({
    status: 'selected',
    ...dateFilter
  });
  const rejectedCount = await Application.countDocuments({
    status: 'rejected',
    ...dateFilter
  });

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


