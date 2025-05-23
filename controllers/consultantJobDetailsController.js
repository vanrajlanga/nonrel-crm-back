const { ConsultantJobDetails } = require("../models/consultantJobDetailsModel");
const { Consultant } = require("../models/consultantModel");
const { InterviewSchedule } = require("../models/interviewScheduleModel");
const { AgreementDetails } = require("../models/agreementDetailsModel");
const { sequelize } = require("../config/database");

// Create job details for a consultant
exports.createJobDetails = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Log user information for debugging
    console.log('User attempting to create job details:', {
      userId: req.user.id,
      userRole: req.user.role,
      consultantId: consultantId
    });

    // Check user permissions with detailed logging
    if (req.user.role !== 'superAdmin' && 
        req.user.role !== 'coordinator' && 
        req.user.role !== 'teamLead') {
      console.log('Permission denied: Invalid role', req.user.role);
      return res.status(403).json({ 
        message: "Access forbidden: Only superAdmin, coordinator, and team lead can create job details",
        currentRole: req.user.role 
      });
    }

    // Validate if consultant exists and check access
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      console.log('Consultant not found:', consultantId);
      return res.status(404).json({ message: "Consultant not found" });
    }

    // For non-superAdmin users, check if they are assigned to this consultant
    if (req.user.role !== 'superAdmin') {
      if (req.user.role === 'coordinator') {
        if (consultant.assignedCoordinatorId !== req.user.id) {
          console.log('Coordinator access denied:', {
            userId: req.user.id,
            assignedCoordinatorId: consultant.assignedCoordinatorId
          });
          return res.status(403).json({ 
            message: "Access forbidden: You are not assigned as the coordinator for this consultant",
            yourId: req.user.id,
            assignedCoordinatorId: consultant.assignedCoordinatorId
          });
        }
      } else if (req.user.role === 'teamLead') {
        if (consultant.assignedTeamLeadId !== req.user.id) {
          console.log('Team Lead access denied:', {
            userId: req.user.id,
            assignedTeamLeadId: consultant.assignedTeamLeadId
          });
          return res.status(403).json({ 
            message: "Access forbidden: You are not assigned as the team lead for this consultant",
            yourId: req.user.id,
            assignedTeamLeadId: consultant.assignedTeamLeadId
          });
        }
      }
    }

    // Check if job details already exist for this consultant
    const existingJobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
    });
    if (existingJobDetails) {
      console.log('Job details already exist for consultant:', consultantId);
      return res
        .status(400)
        .json({ message: "Job details already exist for this consultant" });
    }

    // Validate required fields
    const requiredFields = ["companyName", "jobType", "dateOfOffer"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Only allow superAdmin to set fees related fields
    const jobData = { ...req.body };
    if (req.user.role !== 'superAdmin' && req.user.role !== 'Accounts' && req.user.role !== 'admin') {
      delete jobData.totalFees;
      delete jobData.receivedFees;
    }

    // Ensure isJob is set to true for new job details
    jobData.isJob = true;
    // Set placementStatus to "active" by default
    jobData.placementStatus = "active";

    // Add creator information
    jobData.createdBy = req.user.id;
    jobData.createdByName = req.user.name || req.user.username;

    console.log('Creating job details with data:', {
      ...jobData,
      consultantId
    });

    // Create job details
    const jobDetails = await ConsultantJobDetails.create({
      ...jobData,
      consultantId
    });

    // Update consultant's status to active
    await consultant.update({ 
      isPlaced: false,
      isHold: false,
      isActive: true,
      isOfferPending: false
    });

    // Format response based on user role
    const response = {
      message: "Job details created successfully",
      jobDetails: {
        id: jobDetails.id,
        companyName: jobDetails.companyName,
        position: jobDetails.jobType,
        dateOfOffer: jobDetails.dateOfOffer,
        isJob: jobDetails.isJob,
        placementStatus: jobDetails.placementStatus,
        feesStatus: jobDetails.feesStatus,
        isAgreement: jobDetails.isAgreement,
        createdBy: {
          id: jobDetails.createdBy,
          name: jobDetails.createdByName
        },
        consultant: {
          id: consultant.id,
          fullName: consultant.fulllegalname,
          isPlaced: consultant.isPlaced,
          isHold: consultant.isHold,
          isActive: consultant.isActive,
          isOfferPending: consultant.isOfferPending
        }
      }
    };

    // Add detailed fees information for superAdmin only
    if (req.user.role === 'superAdmin' || req.user.role === 'Accounts' || req.user.role === 'admin') {
      response.jobDetails.feesInfo = {
        totalFees: jobDetails.totalFees,
        receivedFees: jobDetails.receivedFees,
        remainingFees: jobDetails.remainingFees
      };
    }

    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job details for a consultant
exports.getJobDetails = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Include fees in attributes based on role
    const attributes = [
      "companyName", 
      "jobType", 
      "dateOfOffer", 
      "feesStatus",
      "isAgreement",
      "createdBy",
      "createdByName",
      "isJob",
      "placementStatus"
    ];
    if (req.user.role === 'superAdmin' || req.user.role === 'Accounts' || req.user.role === 'admin') {
      attributes.push("totalFees", "receivedFees", "remainingFees");
    }

    // Find the consultant first
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // For non-superAdmin users, check if they are assigned to this consultant
    if (req.user.role !== 'superAdmin' && req.user.role !== 'Accounts' && req.user.role !== 'admin') {
      if (req.user.role === 'coordinator' && consultant.assignedCoordinatorId !== req.user.id) {
        return res.status(403).json({ 
          message: "Access forbidden: You are not assigned as the coordinator for this consultant"
        });
      }
      if (req.user.role === 'teamLead' && consultant.assignedTeamLeadId !== req.user.id) {
        return res.status(403).json({ 
          message: "Access forbidden: You are not assigned as the team lead for this consultant"
        });
      }
      if (req.user.role === 'resumeBuilder' && consultant.assignedResumeBuilder !== req.user.id) {
        return res.status(403).json({ 
          message: "Access forbidden: You are not assigned as the resume builder for this consultant"
        });
      }
    }

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email", "isPlaced", "paymentStatus"],
        },
      ],
      attributes
    });

    if (!jobDetails) {
      return res
        .status(404)
        .json({ message: "Job details not found for this consultant" });
    }

    // Format the response
    const formattedResponse = {
      fullName: jobDetails.Consultant.fulllegalname,
      email: jobDetails.Consultant.email,
      companyName: jobDetails.companyName,
      position: jobDetails.jobType,
      dateOfOffer: jobDetails.dateOfOffer,
      feesStatus: jobDetails.feesStatus,
      isAgreement: jobDetails.isAgreement,
      isPlaced: jobDetails.Consultant.isPlaced,
      paymentStatus: jobDetails.Consultant.paymentStatus,
      isJob: jobDetails.isJob,
      placementStatus: jobDetails.placementStatus,
      createdBy: {
        id: jobDetails.createdBy,
        name: jobDetails.createdByName
      }
    };

    // Add detailed fees information for superAdmin only
    if (req.user.role === 'superAdmin' || req.user.role === 'Accounts' || req.user.role === 'admin') {
      formattedResponse.feesInfo = {
        totalFees: jobDetails.totalFees,
        receivedFees: jobDetails.receivedFees,
        remainingFees: jobDetails.remainingFees
      };
    }

    return res.status(200).json(formattedResponse);
  } catch (error) {
    next(error);
  }
};

// Update job details
exports.updateJobDetails = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { undoPlacement, undoPaymentVerification } = req.body;

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["id", "fulllegalname", "email", "isPlaced", "paymentStatus"],
        },
      ]
    });

    if (!jobDetails) {
      return res
        .status(404)
        .json({ message: "Job details not found for this consultant" });
    }

    // Handle placement status reversal
    if (undoPlacement === true && req.user.role === 'superAdmin') {
      // First, delete agreement details if they exist
      try {
        const AgreementDetails = require('../models/agreementDetailsModel').AgreementDetails;
        await AgreementDetails.destroy({
          where: { consultantId }
        });
      } catch (error) {
        console.log('No agreement details found or error deleting:', error);
      }

      // Then delete job details
      await jobDetails.destroy();

      // Finally update consultant's placement status
      await Consultant.update(
        { isPlaced: false },
        { where: { id: consultantId } }
      );

      return res.status(200).json({
        message: "Placement undone successfully. Job details and agreement details have been removed.",
        jobDetails: {
          fullName: jobDetails.Consultant.fulllegalname,
          email: jobDetails.Consultant.email,
          isPlaced: false,
          paymentStatus: jobDetails.Consultant.paymentStatus
        }
      });
    }

    // Handle payment verification status reversal
    if (undoPaymentVerification === true && (req.user.role === 'superAdmin' || req.user.role === 'Accounts' || req.user.role === 'admin')) {
      await Consultant.update(
        { paymentStatus: false },
        { where: { id: consultantId } }
      );
    }

    // Only allow superAdmin to update fees
    const updateData = { ...req.body };
    delete updateData.undoPlacement;  // Remove from updateData
    delete updateData.undoPaymentVerification;  // Remove from updateData
    
    if (req.user.role !== 'superAdmin' && req.user.role !== 'Accounts' && req.user.role !== 'admin') {
      delete updateData.totalFees;
      delete updateData.receivedFees;
      delete updateData.remainingFees;
      delete updateData.feesStatus;
    }

    // Don't allow updating creator information
    delete updateData.createdBy;
    delete updateData.createdByName;

    // Update job details
    await jobDetails.update(updateData);

    // Fetch updated data with consultant info
    const attributes = [
      "companyName", 
      "jobType", 
      "dateOfOffer", 
      "feesStatus",
      "isAgreement",
      "createdBy",
      "createdByName"
    ];
    if (req.user.role === 'superAdmin' || req.user.role === 'Accounts' || req.user.role === 'admin') {
      attributes.push("totalFees", "receivedFees", "remainingFees");
    }

    // Fetch fresh data after all updates
    const updatedJobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email", "isPlaced", "paymentStatus"],
        },
      ],
      attributes
    });

    // Format the response
    const formattedResponse = {
      fullName: updatedJobDetails.Consultant.fulllegalname,
      email: updatedJobDetails.Consultant.email,
      companyName: updatedJobDetails.companyName,
      position: updatedJobDetails.jobType,
      dateOfOffer: updatedJobDetails.dateOfOffer,
      feesStatus: updatedJobDetails.feesStatus,
      isAgreement: updatedJobDetails.isAgreement,
      isPlaced: updatedJobDetails.Consultant.isPlaced,
      paymentStatus: updatedJobDetails.Consultant.paymentStatus,
      createdBy: {
        id: updatedJobDetails.createdBy,
        name: updatedJobDetails.createdByName
      }
    };

    // Add detailed fees information for superAdmin only
    if (req.user.role === 'superAdmin' || req.user.role === 'Accounts' || req.user.role === 'admin') {
      formattedResponse.feesInfo = {
        totalFees: updatedJobDetails.totalFees,
        receivedFees: updatedJobDetails.receivedFees,
        remainingFees: updatedJobDetails.remainingFees
      };
    }

    return res.status(200).json({
      message: "Job details updated successfully",
      jobDetails: formattedResponse
    });
  } catch (error) {
    next(error);
  }
};

// Delete job details and reset consultant status
exports.deleteJobDetails = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Check user permissions
    if (req.user.role !== 'superAdmin' && 
        req.user.role !== 'coordinator' && 
        req.user.role !== 'teamLead') {
      return res.status(403).json({ 
        message: "Access forbidden: Only superAdmin, coordinator, and team lead can delete job details"
      });
    }

    // Find the consultant
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // For non-superAdmin users, check if they are assigned to this consultant
    if (req.user.role !== 'superAdmin') {
      if (req.user.role === 'coordinator') {
        if (consultant.assignedCoordinatorId !== req.user.id) {
          return res.status(403).json({ 
            message: "Access forbidden: You are not assigned as the coordinator for this consultant"
          });
        }
      } else if (req.user.role === 'teamLead') {
        if (consultant.assignedTeamLeadId !== req.user.id) {
          return res.status(403).json({ 
            message: "Access forbidden: You are not assigned as the team lead for this consultant"
          });
        }
      }
    }

    // Find job details
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId }
    });

    if (!jobDetails) {
      return res.status(404).json({ message: "Job details not found for this consultant" });
    }

    // Start a transaction to ensure all operations are atomic
    const t = await sequelize.transaction();

    try {
      // First update job details to set isJob and placementStatus
      // This needs to be done before deletion to avoid hook interference
      await jobDetails.update({
        isJob: false,
        placementStatus: null, // Set to null to avoid hooks setting isJob back to true
        isAgreement: false
      }, { 
        transaction: t,
        hooks: false // Disable hooks to prevent automatic isJob setting
      });

      // Delete associated interview schedules
      await InterviewSchedule.destroy({
        where: { consultantId },
        transaction: t
      });

      // Delete associated agreement details if they exist
      await AgreementDetails.destroy({
        where: { consultantJobDetailsId: jobDetails.id },
        transaction: t
      });

      // Delete the job details
      await jobDetails.destroy({ transaction: t });

      // Reset consultant's status, remove staff assignments, and reset jobLostCount
      await consultant.update({
        isPlaced: false,
        isHold: false,
        isActive: false,
        isOfferPending: false,
        assignedCoordinatorId: null,
        assignedCoordinator2Id: null,
        assignedTeamLeadId: null,
        jobLostCount: 0 // Reset job lost count to 0
      }, { 
        transaction: t,
        hooks: false // Disable hooks to prevent automatic status changes
      });

      // Commit the transaction
      await t.commit();

      return res.status(200).json({
        message: "Job details, interview schedules, and agreement details deleted successfully. All statuses reset.",
        consultant: {
          id: consultant.id,
          fullName: consultant.fulllegalname,
          isPlaced: false,
          isHold: false,
          isActive: false,
          isOfferPending: false,
          jobLostCount: 0,
          assignedCoordinatorId: null,
          assignedCoordinator2Id: null,
          assignedTeamLeadId: null,
          assignedResumeBuilder: null
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await t.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Add a new function to get all placed consultants' job details
exports.getAllPlacedJobDetails = async (req, res, next) => {
  try {
    // Only superAdmin can access this endpoint
    if (req.user.role !== 'superAdmin' && req.user.role !== 'Accounts' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Access forbidden: Only superAdmin, Accounts, and admin can view all job details"
      });
    }

    const attributes = [
      "consultantId",
      "companyName", 
      "jobType", 
      "dateOfOffer", 
      "feesStatus",
      "isAgreement",
      "createdBy",
      "createdByName",
      "totalFees",
      "receivedFees",
      "remainingFees",
      "isJob",
      "placementStatus"
    ];

    const allJobDetails = await ConsultantJobDetails.findAll({
      where: {
        isJob: true // Changed from checking isPlaced to checking isJob
      },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email", "isPlaced", "paymentStatus", "isHold", "isActive", "isOfferPending"],
        },
      ],
      attributes,
      order: [['dateOfOffer', 'DESC']] // Most recent first
    });

    const formattedResponse = allJobDetails.map(jobDetail => ({
      id: jobDetail.consultantId,
      fullName: jobDetail.Consultant.fulllegalname,
      email: jobDetail.Consultant.email,
      companyName: jobDetail.companyName,
      position: jobDetail.jobType,
      dateOfOffer: jobDetail.dateOfOffer,
      feesStatus: jobDetail.feesStatus,
      isAgreement: jobDetail.isAgreement,
      isJob: jobDetail.isJob,
      placementStatus: jobDetail.placementStatus,
      consultantStatus: {
        isPlaced: jobDetail.Consultant.isPlaced,
        isHold: jobDetail.Consultant.isHold,
        isActive: jobDetail.Consultant.isActive,
        isOfferPending: jobDetail.Consultant.isOfferPending
      },
      paymentStatus: jobDetail.Consultant.paymentStatus,
      createdBy: {
        id: jobDetail.createdBy,
        name: jobDetail.createdByName
      },
      feesInfo: {
        totalFees: jobDetail.totalFees,
        receivedFees: jobDetail.receivedFees,
        remainingFees: jobDetail.remainingFees
      }
    }));

    return res.status(200).json({
      count: formattedResponse.length,
      jobDetails: formattedResponse
    });
  } catch (error) {
    next(error);
  }
};

// Update placement status
exports.updatePlacementStatus = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { placementStatus } = req.body;

    // Validate consultantId
    if (!consultantId || consultantId === "undefined") {
      return res.status(400).json({
        message: "Invalid consultant ID. Please provide a valid consultant ID in the URL.",
        example: "PUT /api/consultants/123/placement-status"
      });
    }

    // Validate placementStatus in request body
    if (!placementStatus) {
      return res.status(400).json({
        message: "Placement status is required in the request body",
        example: { "placementStatus": "hold" }
      });
    }

    // Validate the placement status value
    if (!["placed", "hold", "active", "offerPending"].includes(placementStatus)) {
      return res.status(400).json({
        message: "Invalid placement status. Must be one of: placed, hold, active, offerPending",
        validValues: ["placed", "hold", "active", "offerPending"]
      });
    }

    console.log('Updating placement status:', {
      consultantId,
      placementStatus,
      userId: req.user.id,
      userRole: req.user.role
    });

    // Find the job details
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["id", "fulllegalname", "email"],
        },
      ],
    });

    if (!jobDetails) {
      return res.status(404).json({
        message: "Job details not found for this consultant",
        consultantId,
        suggestion: "Make sure the consultant exists and has job details created"
      });
    }

    // Check if job is active
    if (jobDetails.isJob === false) {
      return res.status(400).json({
        message: "Cannot update placement status: This is not an active job",
        suggestion: "Set isJob to true before updating placement status"
      });
    }

    // Check authorization
    if (
      req.user.role !== "superAdmin" &&
      req.user.role !== "admin" &&
      req.user.role !== "coordinator" &&
      req.user.role !== "teamLead"
    ) {
      return res.status(403).json({
        message: "Access forbidden: You are not authorized to update placement status",
      });
    }

    // For non-superAdmin users, check if they are assigned to this consultant
    if (req.user.role !== "superAdmin" && req.user.role !== "admin") {
      const consultant = await Consultant.findByPk(consultantId);
      if (!consultant) {
        return res.status(404).json({ message: "Consultant not found" });
      }

      if (
        req.user.role === "coordinator" &&
        consultant.assignedCoordinatorId !== req.user.id
      ) {
        return res.status(403).json({
          message: "Access forbidden: You are not assigned as the coordinator for this consultant",
        });
      }
      if (
        req.user.role === "teamLead" &&
        consultant.assignedTeamLeadId !== req.user.id
      ) {
        return res.status(403).json({
          message: "Access forbidden: You are not assigned as the team lead for this consultant",
        });
      }
    }

    // Update the placement status
    await jobDetails.update({ placementStatus });

    // Update the consultant's status based on the placement status
    const consultant = await Consultant.findByPk(consultantId);
    if (consultant) {
      await consultant.update({
        isPlaced: placementStatus === "placed",
        isHold: placementStatus === "hold",
        isActive: placementStatus === "active",
        isOfferPending: placementStatus === "offerPending"
      });
    }

    res.status(200).json({
      message: "Placement status updated successfully",
      jobDetails: {
        id: jobDetails.id,
        consultantId: jobDetails.consultantId,
        isJob: jobDetails.isJob,
        placementStatus: jobDetails.placementStatus,
        consultant: {
          id: consultant.id,
          fullName: consultant.fulllegalname,
          email: consultant.email,
          isPlaced: consultant.isPlaced,
          isHold: consultant.isHold,
          isActive: consultant.isActive,
          isOfferPending: consultant.isOfferPending
        },
      },
    });
  } catch (error) {
    console.error("Error in updatePlacementStatus:", error);
    next(error);
  }
};

// Reset fees for a consultant's job details
exports.resetFees = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Check user permissions - only superAdmin, admin, and Accounts can reset fees
    if (req.user.role !== 'superAdmin' && req.user.role !== 'admin' && req.user.role !== 'Accounts') {
      return res.status(403).json({ 
        message: "Access forbidden: Only superAdmin, admin, and Accounts can reset fees"
      });
    }

    // Find the job details
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["id", "fulllegalname", "email"],
        },
      ],
    });

    if (!jobDetails) {
      return res.status(404).json({
        message: "Job details not found for this consultant",
        consultantId
      });
    }

    // Reset only fee-related fields
    await jobDetails.update({
      totalFees: 0,
      receivedFees: 0,
      remainingFees: 0,
      feesStatus: "pending"
    });

    // Return the updated job details
    return res.status(200).json({
      message: "Fees reset successfully",
      jobDetails: {
        id: jobDetails.id,
        consultantId: jobDetails.consultantId,
        consultant: {
          id: jobDetails.Consultant.id,
          fullName: jobDetails.Consultant.fulllegalname,
          email: jobDetails.Consultant.email
        },
        feesInfo: {
          totalFees: 0,
          receivedFees: 0,
          remainingFees: 0,
          feesStatus: "pending"
        },
        isAgreement: jobDetails.isAgreement // Return current agreement status without modifying it
      }
    });

  } catch (error) {
    console.error("Error in resetFees:", error);
    next(error);
  }
};

// Update job details after job lost
exports.updateAfterJobLost = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { companyName, jobType, dateOfOffer } = req.body;

    // Validate required fields
    if (!companyName || !jobType || !dateOfOffer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: {
          companyName: "Name of the new company",
          jobType: "Position/job type",
          dateOfOffer: "Date of the new offer (YYYY-MM-DD)"
        }
      });
    }

    // Find the consultant
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ 
        success: false,
        message: "Consultant not found" 
      });
    }

    // Find existing job details
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId }
    });

    if (!jobDetails) {
      return res.status(404).json({ 
        success: false,
        message: "Job details not found for this consultant" 
      });
    }

    // Start a transaction
    const t = await sequelize.transaction();

    try {
      // Update job details with new company information
      await jobDetails.update({
        companyName,
        jobType,
        dateOfOffer,
        isJob: true,
        placementStatus: "active",
        isAgreement: false
        // Keep fees-related fields unchanged:
        // totalFees, receivedFees, remainingFees, feesStatus
      }, { 
        transaction: t,
        hooks: false // Disable hooks temporarily
      });

      // Update consultant status
      await consultant.update({
        isPlaced: false,
        isHold: false,
        isActive: true,
        isOfferPending: false
      }, { 
        transaction: t,
        hooks: false
      });

      // Re-enable hooks with a separate update to ensure proper status handling
      await jobDetails.update({}, { 
        transaction: t,
        hooks: true 
      });

      await t.commit();

      // Fetch updated job details with consultant info
      const updatedJobDetails = await ConsultantJobDetails.findOne({
        where: { consultantId },
        include: [
          {
            model: Consultant,
            attributes: ["id", "fulllegalname", "email", "jobLostCount", "isPlaced", "isHold", "isActive", "isOfferPending"]
          }
        ]
      });

      return res.status(200).json({
        success: true,
        message: "Job details updated successfully with new company information",
        data: {
          jobDetails: {
            id: updatedJobDetails.id,
            companyName: updatedJobDetails.companyName,
            position: updatedJobDetails.jobType,
            dateOfOffer: updatedJobDetails.dateOfOffer,
            isJob: updatedJobDetails.isJob,
            placementStatus: updatedJobDetails.placementStatus,
            isAgreement: updatedJobDetails.isAgreement,
            feesStatus: updatedJobDetails.feesStatus,
            totalFees: updatedJobDetails.totalFees,
            receivedFees: updatedJobDetails.receivedFees,
            remainingFees: updatedJobDetails.remainingFees
          },
          consultant: {
            id: updatedJobDetails.Consultant.id,
            fullName: updatedJobDetails.Consultant.fulllegalname,
            email: updatedJobDetails.Consultant.email,
            jobLostCount: updatedJobDetails.Consultant.jobLostCount,
            status: {
              isPlaced: updatedJobDetails.Consultant.isPlaced,
              isHold: updatedJobDetails.Consultant.isHold,
              isActive: updatedJobDetails.Consultant.isActive,
              isOfferPending: updatedJobDetails.Consultant.isOfferPending
            }
          }
        }
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error in updateAfterJobLost:", error);
    next(error);
  }
};

module.exports = exports;
