const { ConsultantJobDetails } = require("../models/consultantJobDetailsModel");
const { Consultant } = require("../models/consultantModel");

// Create job details for a consultant
exports.createJobDetails = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Validate if consultant exists
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if job details already exist for this consultant
    const existingJobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
    });
    if (existingJobDetails) {
      return res
        .status(400)
        .json({ message: "Job details already exist for this consultant" });
    }

    // Validate required fields
    const requiredFields = ["companyName", "jobType", "dateOfJoining"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Only allow admin to set fees related fields
    const jobData = { ...req.body };
    if (req.user.role !== 'admin') {
      delete jobData.totalFees;
      delete jobData.receivedFees;
    }

    // Add creator information
    jobData.createdBy = req.user.id;
    jobData.createdByName = req.user.name || req.user.username;

    // Create job details and update consultant status
    const jobDetails = await ConsultantJobDetails.create({
      ...jobData,
      consultantId
    });

    // Update consultant's placement status
    await consultant.update({ isPlaced: true });

    // Format response based on user role
    const response = {
      message: "Job details created successfully",
      jobDetails: {
        id: jobDetails.id,
        companyName: jobDetails.companyName,
        position: jobDetails.jobType,
        dateOfJoining: jobDetails.dateOfJoining,
        feesStatus: jobDetails.feesStatus,
        createdBy: {
          id: jobDetails.createdBy,
          name: jobDetails.createdByName
        },
        consultant: {
          id: consultant.id,
          fullName: consultant.fulllegalname,
          isPlaced: consultant.isPlaced,
        }
      }
    };

    // Add detailed fees information for admin only
    if (req.user.role === 'admin') {
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
      "dateOfJoining", 
      "feesStatus",
      "createdBy",
      "createdByName"
    ];
    if (req.user.role === 'admin') {
      attributes.push("totalFees", "receivedFees", "remainingFees");
    }

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email"],
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
      dateOfJoining: jobDetails.dateOfJoining,
      feesStatus: jobDetails.feesStatus,
      createdBy: {
        id: jobDetails.createdBy,
        name: jobDetails.createdByName
      }
    };

    // Add detailed fees information for admin only
    if (req.user.role === 'admin') {
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

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId }
    });

    if (!jobDetails) {
      return res
        .status(404)
        .json({ message: "Job details not found for this consultant" });
    }

    // Only allow admin to update fees
    const updateData = { ...req.body };
    if (req.user.role !== 'admin') {
      delete updateData.totalFees;
      delete updateData.receivedFees;
      delete updateData.remainingFees;
      // Allow feesStatus to be visible but not updatable by non-admin
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
      "dateOfJoining", 
      "feesStatus",
      "createdBy",
      "createdByName"
    ];
    if (req.user.role === 'admin') {
      attributes.push("totalFees", "receivedFees", "remainingFees");
    }

    const updatedJobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email"],
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
      dateOfJoining: updatedJobDetails.dateOfJoining,
      feesStatus: updatedJobDetails.feesStatus,
      createdBy: {
        id: updatedJobDetails.createdBy,
        name: updatedJobDetails.createdByName
      }
    };

    // Add detailed fees information for admin only
    if (req.user.role === 'admin') {
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

// Delete job details
exports.deleteJobDetails = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Include fees in attributes based on role
    const attributes = [
      "companyName", 
      "jobType", 
      "dateOfJoining", 
      "feesStatus",
      "createdBy",
      "createdByName"
    ];
    if (req.user.role === 'admin') {
      attributes.push("totalFees", "receivedFees", "remainingFees");
    }

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email"],
        },
      ],
      attributes
    });

    if (!jobDetails) {
      return res
        .status(404)
        .json({ message: "Job details not found for this consultant" });
    }

    // Format the response before deleting
    const formattedResponse = {
      fullName: jobDetails.Consultant.fulllegalname,
      email: jobDetails.Consultant.email,
      companyName: jobDetails.companyName,
      position: jobDetails.jobType,
      dateOfJoining: jobDetails.dateOfJoining,
      feesStatus: jobDetails.feesStatus,
      createdBy: {
        id: jobDetails.createdBy,
        name: jobDetails.createdByName
      }
    };

    // Add detailed fees information for admin only
    if (req.user.role === 'admin') {
      formattedResponse.feesInfo = {
        totalFees: jobDetails.totalFees,
        receivedFees: jobDetails.receivedFees,
        remainingFees: jobDetails.remainingFees
      };
    }

    // Delete the job details
    await jobDetails.destroy();

    // Update consultant's placement status
    const consultant = await Consultant.findByPk(consultantId);
    await consultant.update({ isPlaced: false });

    return res.status(200).json({
      message: "Job details deleted successfully",
      deletedJobDetails: formattedResponse
    });
  } catch (error) {
    next(error);
  }
};
