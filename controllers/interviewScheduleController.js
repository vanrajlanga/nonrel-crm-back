const { InterviewSchedule } = require("../models/interviewScheduleModel");
const { Consultant } = require("../models/consultantModel");
const { Company } = require("../models/companyModel");
const { ConsultantJobDetails } = require("../models/consultantJobDetailsModel");
const User = require("../models/userModel");
const { Op } = require("sequelize");

// Helper function to get coordinator info
const getCoordinatorInfo = async (consultant) => {
  if (!consultant || !consultant.assignedCoordinatorId) return null;

  try {
    // Only get the first coordinator's info
    const coordinator = await User.findByPk(consultant.assignedCoordinatorId);
    if (coordinator) {
      return {
        id: coordinator.id,
        name: coordinator.username,
        email: coordinator.email
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching coordinator info:', error);
    return null;
  }
};

// Create a new interview schedule
exports.createInterviewSchedule = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Check if user has permission
    if (req.user.role !== 'superAdmin' && 
        req.user.role !== 'admin' && 
        req.user.role !== 'coordinator') {
      return res.status(403).json({
        message: "Only superAdmin, admin, and coordinators can schedule interviews"
      });
    }

    // Get consultant with coordinator info
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // If coordinator, check if they are assigned to this consultant
    if (req.user.role === 'coordinator') {
      if (consultant.assignedCoordinatorId !== req.user.id && 
          consultant.assignedCoordinator2Id !== req.user.id) {
        return res.status(403).json({
          message: "You can only schedule interviews for consultants assigned to you"
        });
      }
    }

    // Validate country
    const validCountries = ["India", "Canada", "USA", "Germany", "Australia"];
    if (!validCountries.includes(req.body.country)) {
      return res.status(400).json({
        message: "Invalid country. Must be one of: India, Canada, USA, Germany, Australia"
      });
    }

    // Get consultant's active job details
    const jobDetails = await ConsultantJobDetails.findOne({
      where: {
        consultantId,
        isJob: true
      }
    });

    if (!jobDetails) {
      return res.status(400).json({
        message: "Cannot schedule interview. Consultant does not have an active job placement."
      });
    }

    // Find or create company based on the job details
    const [company] = await Company.findOrCreate({
      where: { 
        companyName: jobDetails.companyName 
      },
      defaults: {
        companyName: jobDetails.companyName,
        city: "Unknown",
        country: req.body.country,
        createdBy: req.user.id
      }
    });

    // Create interview schedule with job details
    const interviewSchedule = await InterviewSchedule.create({
      ...req.body,
      consultantId,
      companyId: company.id,
      jobPostingId: jobDetails.id,
      createdBy: req.user.id
    });

    // Get coordinator info
    const coordinatorInfo = await getCoordinatorInfo(consultant);

    // Add job details and coordinator info to response
    const responseData = {
      ...interviewSchedule.toJSON(),
      coordinator: coordinatorInfo,
      jobDetails: {
        id: jobDetails.id,
        jobPosition: jobDetails.jobType,
        companyName: jobDetails.companyName,
        isJob: jobDetails.isJob,
        placementStatus: jobDetails.placementStatus
      }
    };

    return res.status(201).json({
      message: "Interview schedule successfully created",
      schedule: responseData
    });

  } catch (error) {
    console.error('Error creating interview schedule:', error);
    next(error);
  }
};

// Get all interview schedules
exports.getAllInterviewSchedules = async (req, res, next) => {
  try {
    let whereClause = {};
    
    // For coordinators, only show their consultants' interviews
    if (req.user.role === 'coordinator') {
      const assignedConsultants = await Consultant.findAll({
        where: {
          [Op.or]: [
            { assignedCoordinatorId: req.user.id },
            { assignedCoordinator2Id: req.user.id }
          ]
        },
        attributes: ['id']
      });
      
      whereClause.consultantId = {
        [Op.in]: assignedConsultants.map(c => c.id)
      };
    }

    // Add date filter if provided
    if (req.query.date) {
      whereClause.date = req.query.date;
    }

    // Add status filter if provided
    if (req.query.status) {
      whereClause.interviewStatus = req.query.status;
    }

    // Add company filter if provided
    if (req.query.companyId) {
      whereClause.companyId = req.query.companyId;
    }

    const schedules = await InterviewSchedule.findAll({
      where: whereClause,
      include: [
        {
          model: Consultant,
          as: 'consultant',
          attributes: ['id', 'fulllegalname', 'email', 'assignedCoordinatorId', 'assignedCoordinator2Id']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'companyName']
        }
      ],
      order: [['date', 'DESC'], ['timeEST', 'DESC']]
    });

    // Get job details and coordinator info for each schedule
    const schedulesWithDetails = await Promise.all(schedules.map(async (schedule) => {
      const jobDetails = await ConsultantJobDetails.findOne({
        where: {
          consultantId: schedule.consultantId,
          isJob: true
        }
      });

      const coordinatorInfo = await getCoordinatorInfo(schedule.consultant);

      return {
        ...schedule.toJSON(),
        coordinator: coordinatorInfo,
        jobDetails: jobDetails ? {
          id: jobDetails.id,
          jobPosition: jobDetails.jobType,
          companyName: jobDetails.companyName,
          isJob: jobDetails.isJob,
          placementStatus: jobDetails.placementStatus
        } : null
      };
    }));

    return res.status(200).json(schedulesWithDetails);

  } catch (error) {
    next(error);
  }
};

// Get interview schedule by ID
exports.getInterviewScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const schedule = await InterviewSchedule.findByPk(id, {
      include: [
        {
          model: Consultant,
          as: 'consultant',
          attributes: ['id', 'fulllegalname', 'email', 'assignedCoordinatorId', 'assignedCoordinator2Id']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'companyName']
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({ message: "Interview schedule not found" });
    }

    // Check permission for coordinators
    if (req.user.role === 'coordinator') {
      if (schedule.consultant.assignedCoordinatorId !== req.user.id && 
          schedule.consultant.assignedCoordinator2Id !== req.user.id) {
        return res.status(403).json({
          message: "You can only view interviews for consultants assigned to you"
        });
      }
    }

    // Get job details and coordinator info
    const jobDetails = await ConsultantJobDetails.findOne({
      where: {
        consultantId: schedule.consultantId,
        isJob: true
      }
    });

    const coordinatorInfo = await getCoordinatorInfo(schedule.consultant);

    const responseData = {
      ...schedule.toJSON(),
      coordinator: coordinatorInfo,
      jobDetails: jobDetails ? {
        id: jobDetails.id,
        jobPosition: jobDetails.jobType,
        companyName: jobDetails.companyName,
        isJob: jobDetails.isJob,
        placementStatus: jobDetails.placementStatus
      } : null
    };

    return res.status(200).json(responseData);

  } catch (error) {
    next(error);
  }
};

// Update interview schedule
exports.updateInterviewSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId, jobPostingId, interviewStatus } = req.body;
    
    const schedule = await InterviewSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: "Interview schedule not found" });
    }

    // Check permission
    if (req.user.role === 'coordinator') {
      const consultant = await Consultant.findByPk(schedule.consultantId);
      if (consultant.assignedCoordinatorId !== req.user.id && 
          consultant.assignedCoordinator2Id !== req.user.id) {
        return res.status(403).json({
          message: "You can only update interviews for consultants assigned to you"
        });
      }
    }

    // Validate interviewStatus if provided
    const validInterviewStatuses = ["Pending", "InProgress", "Reschedule", "Rejected", "Completed"];
    if (interviewStatus && !validInterviewStatuses.includes(interviewStatus)) {
      return res.status(400).json({
        message: "Invalid interview status. Must be one of: Pending, InProgress, Reschedule, Rejected, Completed"
      });
    }

    // If company or job posting is being updated, verify they exist
    if (companyId && jobPostingId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const jobPosting = await company.getJobs({
        where: { id: jobPostingId }
      });

      if (!jobPosting || jobPosting.length === 0) {
        return res.status(404).json({ message: "Job posting not found for this company" });
      }
    }

    // Update schedule
    await schedule.update({
      ...req.body,
      updatedBy: req.user.id
    });

    // Fetch updated schedule with all details
    const updatedSchedule = await InterviewSchedule.findByPk(id, {
      include: [
        {
          model: Consultant,
          as: 'consultant',
          attributes: ['id', 'fulllegalname', 'email', 'assignedCoordinatorId', 'assignedCoordinator2Id']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'companyName']
        }
      ]
    });

    // Get job details and coordinator info
    const jobDetails = await ConsultantJobDetails.findOne({
      where: {
        consultantId: updatedSchedule.consultantId,
        isJob: true
      }
    });

    const coordinatorInfo = await getCoordinatorInfo(updatedSchedule.consultant);

    const responseData = {
      ...updatedSchedule.toJSON(),
      coordinator: coordinatorInfo,
      jobDetails: jobDetails ? {
        id: jobDetails.id,
        jobPosition: jobDetails.jobType,
        companyName: jobDetails.companyName,
        isJob: jobDetails.isJob,
        placementStatus: jobDetails.placementStatus
      } : null
    };

    return res.status(200).json({
      message: "Interview schedule updated successfully",
      schedule: responseData
    });

  } catch (error) {
    console.error('Error updating interview schedule:', error);
    next(error);
  }
};

// Delete interview schedule
exports.deleteInterviewSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const schedule = await InterviewSchedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: "Interview schedule not found" });
    }

    // Only superAdmin and admin can delete schedules
    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Only superAdmin and admin can delete interview schedules"
      });
    }

    await schedule.destroy();

    return res.status(200).json({
      message: "Interview schedule deleted successfully"
    });

  } catch (error) {
    next(error);
  }
}; 