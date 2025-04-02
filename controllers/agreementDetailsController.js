const { AgreementDetails } = require("../models/agreementDetailsModel");
const { ConsultantJobDetails } = require("../models/consultantJobDetailsModel");
const { Consultant } = require("../models/consultantModel");

// Create agreement details
exports.createAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Only admin can create agreements
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can create agreements" });
    }

    // Find the consultant job details with consultant info
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [{
        model: Consultant,
        attributes: ["fulllegalname"]
      }]
    });

    if (!jobDetails) {
      return res.status(404).json({ message: "Job details not found" });
    }

    // Check if agreement already exists
    const existingAgreement = await AgreementDetails.findOne({
      where: { consultantJobDetailsId: jobDetails.id }
    });

    if (existingAgreement) {
      return res.status(400).json({ message: "Agreement already exists for this job" });
    }

    // Validate required fields
    const requiredFields = ["agreementDate", "emiDate", "emiAmount"];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields
      });
    }

    // Validate emiDate range
    if (req.body.emiDate < 1 || req.body.emiDate > 31) {
      return res.status(400).json({
        message: "EMI date must be between 1 and 31"
      });
    }

    // Validate emiAmount
    if (req.body.emiAmount <= 0) {
      return res.status(400).json({
        message: "EMI amount must be greater than 0"
      });
    }

    // Ensure agreementDate is a valid date
    const agreementDate = new Date(req.body.agreementDate);
    if (isNaN(agreementDate.getTime())) {
      return res.status(400).json({
        message: "Invalid agreement date format"
      });
    }

    // Create agreement
    const agreementData = {
      agreementDate: agreementDate,
      emiDate: parseInt(req.body.emiDate),
      emiAmount: parseFloat(req.body.emiAmount),
      remarks: req.body.remarks || '',
      consultantJobDetailsId: jobDetails.id,
      createdBy: req.user.id,
      createdByName: req.user.name || req.user.username
    };

    // Calculate nextEmiDueDate based on agreement date
    const nextEmiDate = new Date(agreementDate.getFullYear(), agreementDate.getMonth(), agreementData.emiDate);
    
    // If agreement date is past this month's EMI date, set for next month
    if (agreementDate.getDate() >= agreementData.emiDate) {
      nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
    }
    agreementData.nextEmiDueDate = nextEmiDate;

    console.log('Creating agreement with data:', agreementData);

    const agreement = await AgreementDetails.create(agreementData);

    // Update job details isAgreement flag
    await jobDetails.update({ isAgreement: true });

    return res.status(201).json({
      message: "Agreement created successfully",
      agreement: {
        id: agreement.id,
        consultantName: jobDetails.Consultant.fulllegalname,
        companyName: jobDetails.companyName,
        jobTitle: jobDetails.jobType,
        agreementDate: agreement.agreementDate,
        emiDate: agreement.emiDate,
        emiAmount: agreement.emiAmount,
        remarks: agreement.remarks
      }
    });
  } catch (error) {
    console.error('Error creating agreement:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        message: "Database error",
        error: error.message
      });
    }
    return res.status(500).json({
      message: "Error creating agreement",
      error: error.message
    });
  }
};

// Get agreement details
exports.getAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname"]
        },
        {
          model: AgreementDetails,
          as: "agreementDetails",
          attributes: [
            "id", "agreementDate", "emiDate", "emiAmount",
            "remarks"
          ]
        }
      ]
    });

    if (!jobDetails) {
      return res.status(404).json({ message: "Job details not found" });
    }

    if (!jobDetails.agreementDetails) {
      return res.status(404).json({ message: "No agreement found for this job" });
    }

    return res.status(200).json({
      agreement: {
        id: jobDetails.agreementDetails.id,
        consultantName: jobDetails.Consultant.fulllegalname,
        companyName: jobDetails.companyName,
        jobTitle: jobDetails.jobType,
        agreementDate: jobDetails.agreementDetails.agreementDate,
        emiDate: jobDetails.agreementDetails.emiDate,
        emiAmount: jobDetails.agreementDetails.emiAmount,
        remarks: jobDetails.agreementDetails.remarks
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update agreement details
exports.updateAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Only admin can update agreements
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can update agreements" });
    }

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname"]
        },
        {
          model: AgreementDetails,
          as: "agreementDetails"
        }
      ]
    });

    if (!jobDetails || !jobDetails.agreementDetails) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    // Update agreement
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.createdByName;
    delete updateData.consultantJobDetailsId;

    await jobDetails.agreementDetails.update(updateData);

    return res.status(200).json({
      message: "Agreement updated successfully",
      agreement: {
        id: jobDetails.agreementDetails.id,
        consultantName: jobDetails.Consultant.fulllegalname,
        companyName: jobDetails.companyName,
        jobTitle: jobDetails.jobType,
        agreementDate: jobDetails.agreementDetails.agreementDate,
        emiDate: jobDetails.agreementDetails.emiDate,
        emiAmount: jobDetails.agreementDetails.emiAmount,
        remarks: jobDetails.agreementDetails.remarks
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete agreement
exports.deleteAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // Only admin can delete agreements
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can delete agreements" });
    }

    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname"]
        },
        {
          model: AgreementDetails,
          as: "agreementDetails"
        }
      ]
    });

    if (!jobDetails || !jobDetails.agreementDetails) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    // Store agreement details before deletion
    const deletedAgreement = {
      id: jobDetails.agreementDetails.id,
      consultantName: jobDetails.Consultant.fulllegalname,
      companyName: jobDetails.companyName,
      jobTitle: jobDetails.jobType,
      agreementDate: jobDetails.agreementDetails.agreementDate,
      emiDate: jobDetails.agreementDetails.emiDate,
      emiAmount: jobDetails.agreementDetails.emiAmount,
      remarks: jobDetails.agreementDetails.remarks
    };

    // Delete agreement
    await jobDetails.agreementDetails.destroy();

    // Update job details isAgreement flag
    await jobDetails.update({ isAgreement: false });

    return res.status(200).json({
      message: "Agreement deleted successfully",
      deletedAgreement
    });
  } catch (error) {
    next(error);
  }
}; 