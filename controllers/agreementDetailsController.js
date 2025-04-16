const { AgreementDetails } = require("../models/agreementDetailsModel");
const { ConsultantJobDetails } = require("../models/consultantJobDetailsModel");
const { Consultant } = require("../models/consultantModel");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

// Create new agreement
exports.createAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const {
      emiDate,
      totalSalary,
      remarks,
    } = req.body;

    // Get consultant details first
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found",
      });
    }

    // Check if an agreement already exists for this consultant using their unique identifiers
    const existingAgreement = await AgreementDetails.findOne({
      where: {
        [Op.or]: [
          { consultantName: consultant.fulllegalname },
          { email: consultant.email }
        ]
      }
    });

    if (existingAgreement) {
      return res.status(400).json({
        success: false,
        message: `An agreement already exists for consultant ${consultant.fulllegalname} (${consultant.email}). Please delete the existing agreement before creating a new one.`
      });
    }

    // Get consultant job details using consultantId
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email", "phone"],
        },
      ],
    });

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: "Consultant job details not found",
      });
    }

    if (!jobDetails.dateOfOffer) {
      return res.status(400).json({
        success: false,
        message: "Date of offer is required in job details",
      });
    }

    // Calculate total service fee (typically 8% of total salary)
    const totalServiceFee = totalSalary * 0.08;
    
    // Calculate monthly payment amount (total service fee divided by 8 months)
    const monthlyPaymentAmount = totalServiceFee / 8;

    // Create agreement details
    const agreementDetails = await AgreementDetails.create({
      consultantJobDetailsId: jobDetails.id,
      emiDate,
      totalSalary,
      totalServiceFee,
      monthlyPaymentAmount,
      remarks,
      consultantName: jobDetails.Consultant.fulllegalname,
      email: jobDetails.Consultant.email,
      phone: jobDetails.Consultant.phone,
      jobStartDate: jobDetails.dateOfOffer,
      createdBy: req.user.id,
      // Set due dates for each month
      month1DueDate: new Date(jobDetails.dateOfOffer),
      month2DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 1)),
      month3DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 2)),
      month4DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 3)),
      month5DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 4)),
      month6DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 5)),
      month7DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 6)),
      month8DueDate: new Date(new Date(jobDetails.dateOfOffer).setMonth(new Date(jobDetails.dateOfOffer).getMonth() + 7)),
      // Set initial payment status
      nextDueDate: new Date(jobDetails.dateOfOffer),
      remainingBalance: totalServiceFee,
      totalPaidSoFar: 0,
      paymentCompletionStatus: "in_progress"
    });

    // Update isAgreement in ConsultantJobDetails
    await jobDetails.update({
      isAgreement: true
    });

    return res.status(201).json({
      success: true,
      message: "Agreement created successfully and job details updated",
      agreementDetails,
      jobDetails: {
        id: jobDetails.id,
        isAgreement: true
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new agreement details
exports.createAgreementDetails = async (req, res, next) => {
  try {
    const {
      consultantJobDetailsId,
      emiDate,
      totalSalary,
      remarks,
    } = req.body;

    // Get consultant job details to fetch consultant information
    const jobDetails = await ConsultantJobDetails.findByPk(consultantJobDetailsId, {
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email", "phone"],
        },
      ],
    });

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: "Consultant job details not found",
      });
    }

    // Create agreement details
    const agreementDetails = await AgreementDetails.create({
      consultantJobDetailsId,
      emiDate,
      totalSalary,
      remarks,
      consultantName: jobDetails.Consultant.fulllegalname,
      email: jobDetails.Consultant.email,
      phone: jobDetails.Consultant.phone,
      jobStartDate: jobDetails.startDate,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Agreement details created successfully",
      agreementDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Get all agreement details
exports.getAllAgreementDetails = async (req, res, next) => {
  try {
    const agreementDetails = await AgreementDetails.findAll({
      include: [
        {
          model: ConsultantJobDetails,
          as: "ConsultantJobDetail",
          include: [
            {
              model: Consultant,
              attributes: ["fulllegalname", "email", "phone"],
            },
          ],
        },
      ],
    });

    return res.status(200).json(agreementDetails);
  } catch (error) {
    next(error);
  }
};

// Get agreement details by ID
exports.getAgreementDetailsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const agreementDetails = await AgreementDetails.findByPk(id, {
      include: [
        {
          model: ConsultantJobDetails,
          as: "jobDetails",
          include: [
            {
              model: Consultant,
              attributes: ["fulllegalname", "email", "phone"],
            },
          ],
        },
      ],
    });

    if (!agreementDetails) {
      return res.status(404).json({
        success: false,
        message: "Agreement details not found",
      });
    }

    return res.status(200).json(agreementDetails);
  } catch (error) {
    next(error);
  }
};

// Upload EMI proof for a specific month
exports.uploadEmiProof = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { monthNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a proof file",
      });
    }

    // Get consultant job details first
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
    });

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: "Consultant job details not found",
      });
    }

    // Find agreement using job details ID
    const agreement = await AgreementDetails.findOne({
      where: { consultantJobDetailsId: jobDetails.id },
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    // Check if agreement is active
    if (!jobDetails.isAgreement) {
      return res.status(400).json({
        success: false,
        message: "No active agreement found for this consultant",
      });
    }

    // Validate month number
    if (!monthNumber || monthNumber < 1 || monthNumber > 8) {
      return res.status(400).json({
        success: false,
        message: "Invalid month number. Must be between 1 and 8",
      });
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `emi-proof-${consultantId}-month${monthNumber}-${Date.now()}${fileExt}`;
    
    // Create the proofs directory if it doesn't exist
    const proofsDir = path.join(__dirname, '../uploads/emi-proofs');
    if (!fs.existsSync(proofsDir)) {
      fs.mkdirSync(proofsDir, { recursive: true });
    }

    // Set up the file paths
    const filePath = path.join(proofsDir, fileName);

    // Since we're using disk storage, the file is already saved in the temp location
    // We just need to move it to our target directory
    fs.renameSync(req.file.path, filePath);

    // Update agreement with proof file path - store just the filename
    const updateData = {};
    updateData[`month${monthNumber}Proof`] = fileName;
    await agreement.update(updateData);

    return res.status(200).json({
      success: true,
      message: "EMI proof uploaded successfully",
      data: {
        monthNumber,
        proofFile: `/uploads/emi-proofs/${fileName}`,
      },
    });
  } catch (error) {
    // Clean up uploaded file if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error in uploadEmiProof:", error);
    next(error);
  }
};

// Update payment for a specific month
exports.updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      monthNumber,
      amountReceived,
      receivedDate,
      notes,
    } = req.body;

    const agreementDetails = await AgreementDetails.findByPk(id);

    if (!agreementDetails) {
      return res.status(404).json({
        success: false,
        message: "Agreement details not found",
      });
    }

    // Check if proof is uploaded for this month
    const proofField = `month${monthNumber}Proof`;
    if (!agreementDetails[proofField]) {
      return res.status(400).json({
        success: false,
        message: `Please upload proof for month ${monthNumber} before updating payment`,
      });
    }

    // Update payment details for the specified month
    agreementDetails[`month${monthNumber}AmountReceived`] = amountReceived;
    agreementDetails[`month${monthNumber}ReceivedDate`] = receivedDate;
    agreementDetails[`month${monthNumber}Notes`] = notes;
    agreementDetails[`month${monthNumber}Status`] = "paid";

    // Update total paid and remaining balance
    agreementDetails.totalPaidSoFar = Object.keys(agreementDetails.toJSON())
      .filter(key => key.startsWith("month") && key.endsWith("AmountReceived"))
      .reduce((sum, key) => sum + (agreementDetails[key] || 0), 0);

    agreementDetails.remainingBalance = agreementDetails.totalServiceFee - agreementDetails.totalPaidSoFar;

    // Update next due date
    const currentMonth = parseInt(monthNumber);
    if (currentMonth < 8) {
      agreementDetails.nextDueDate = agreementDetails[`month${currentMonth + 1}DueDate`];
    }

    // Update payment completion status
    if (agreementDetails.remainingBalance <= 0) {
      agreementDetails.paymentCompletionStatus = "completed";
    }

    await agreementDetails.save();

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      agreementDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Update job lost date
exports.updateJobLostDate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { jobLostDate } = req.body;

    const agreementDetails = await AgreementDetails.findByPk(id);

    if (!agreementDetails) {
      return res.status(404).json({
        success: false,
        message: "Agreement details not found",
      });
    }

    agreementDetails.jobLostDate = jobLostDate;
    agreementDetails.paymentCompletionStatus = "terminated";

    await agreementDetails.save();

    return res.status(200).json({
      success: true,
      message: "Job lost date updated successfully",
      agreementDetails,
    });
  } catch (error) {
    next(error);
  }
};

// Get agreement by consultant ID (modified to include proof files)
exports.getAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // First find the job details for the consultant
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
      include: [
        {
          model: Consultant,
          attributes: ["fulllegalname", "email", "phone"],
        },
      ],
    });

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: "Consultant job details not found",
      });
    }

    // Then find the agreement using the job details ID
    const agreement = await AgreementDetails.findOne({
      where: { consultantJobDetailsId: jobDetails.id },
      include: [
        {
          model: ConsultantJobDetails,
          include: [
            {
              model: Consultant,
              attributes: ["fulllegalname", "email", "phone"],
            },
          ],
        },
      ],
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    // Format payment status and proof information
    const paymentInfo = [];
    for (let i = 1; i <= 8; i++) {
      const proofFile = agreement[`month${i}Proof`];
      paymentInfo.push({
        monthNumber: i,
        status: agreement[`month${i}Status`] || "pending",
        amountReceived: agreement[`month${i}AmountReceived`] || 0,
        receivedDate: agreement[`month${i}ReceivedDate`],
        notes: agreement[`month${i}Notes`],
        dueDate: agreement[`month${i}DueDate`],
        proofFile: proofFile ? `/uploads/emi-proofs/${proofFile}` : null,
      });
    }

    // Add payment info to response
    const response = {
      success: true,
      agreement: {
        ...agreement.toJSON(),
        paymentInfo,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update agreement
exports.updateAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const {
      emiDate,
      totalSalary,
      remarks,
    } = req.body;

    const agreement = await AgreementDetails.findOne({
      where: { consultantJobDetailsId: consultantId },
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    // Update agreement details
    await agreement.update({
      emiDate,
      totalSalary,
      remarks,
    });

    return res.status(200).json({
      success: true,
      message: "Agreement updated successfully",
      agreement,
    });
  } catch (error) {
    next(error);
  }
};

// Delete agreement
exports.deleteAgreement = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    // First find the job details for the consultant
    const jobDetails = await ConsultantJobDetails.findOne({
      where: { consultantId },
    });

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: "Consultant job details not found",
      });
    }

    // Then find and delete the agreement using the job details ID
    const agreement = await AgreementDetails.findOne({
      where: { consultantJobDetailsId: jobDetails.id },
    });

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    await agreement.destroy();

    // Update isAgreement in ConsultantJobDetails
    await jobDetails.update({
      isAgreement: false
    });

    return res.status(200).json({
      success: true,
      message: "Agreement deleted successfully and job details updated",
      jobDetails: {
        id: jobDetails.id,
        isAgreement: false
      }
    });
  } catch (error) {
    next(error);
  }
}; 