// src/controllers/consultantController.js
const { Consultant } = require('../models/consultantModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Helper function to check if user is assigned to consultant
const isUserAssignedToConsultant = (consultant, userId) => {
  return consultant.assignedCoordinatorId === userId || consultant.assignedSupportId === userId;
};

// Helper function to check authorization
const checkConsultantAuthorization = async (consultantId, userId, userRole) => {
  const consultant = await Consultant.findByPk(consultantId);
  if (!consultant) {
    throw new Error('Consultant not found');
  }

  // SuperAdmin can access all consultants
  if (userRole === 'superAdmin') {
    return consultant;
  }

  // For coordinator and support, check if they are assigned to this consultant
  if (['coordinator', 'Support'].includes(userRole)) {
    if (!isUserAssignedToConsultant(consultant, userId)) {
      throw new Error('You are not authorized to access this consultant');
    }
    return consultant;
  }

  throw new Error('Unauthorized access');
};

exports.createConsultant = async (req, res, next) => {
  try {
    // Validate required fields
    const requiredFields = [
      'fulllegalname',
      'technology',
      'dateOfBirth',
      'stateOfResidence',
      'visaStatus',
      'maritalStatus',
      'phone',
      'email',
      'currentAddress',
      'usaLandingDate'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate terms acceptance
    if (!req.body.termsAccepted) {
      return res.status(400).json({
        message: 'Terms and conditions must be accepted'
      });
    }

    console.log('Creating consultant with data:', req.body);

    const consultant = await Consultant.create(req.body);
    
    console.log('Consultant created successfully:', consultant.id);

    // Fetch the created consultant to verify it exists
    const createdConsultant = await Consultant.findByPk(consultant.id);
    console.log('Fetched created consultant:', createdConsultant ? 'exists' : 'not found');

    return res.status(201).json(consultant);
  } catch (error) {
    console.error('Error in createConsultant:', error);
    next(error);
  }
};

// Upload payment proof
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { id: consultantId } = req.params;

    // Create a unique filename
    const filename = `proof-${consultantId}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = path.join(__dirname, '../../uploads/proofs', filename);

    // Write the file to the uploads folder
    fs.writeFileSync(filePath, req.file.buffer);

    // Update the consultant's record with the file path
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    
    await consultant.update({ 
      registrationProof: `/uploads/proofs/${filename}`  // Store the relative path
    });

    return res.status(200).json({
      message: "Proof uploaded successfully",
      consultant: {
        id: consultant.id,
        fullName: consultant.fulllegalname,
        hasProof: true
      }
    });
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    next(error);
  }
};

exports.getAllConsultants = async (req, res, next) => {
  try {
    let whereClause = {};
    
    // Handle different roles
    if (req.user.role === 'resumeBuilder') {
      // Show consultants that either have no resume builder or are assigned to this builder
      whereClause = {
        [Op.or]: [
          { assignedResumeBuilder: null },
          { assignedResumeBuilder: req.user.id }
        ]
      };
    } else if (req.user.role !== 'superAdmin') {
      // For coordinator and support, show only their assigned consultants
      whereClause = {
        [Op.or]: [
          { assignedCoordinatorId: req.user.id },
          { assignedSupportId: req.user.id }
        ]
      };
    }

    const consultants = await Consultant.findAll({
      where: whereClause,
      attributes: {
        exclude: ['registrationProof']
      },
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'support',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    return res.status(200).json(consultants);
  } catch (error) {
    console.error('Error in getAllConsultants:', error);
    next(error);
  }
};

exports.getConsultantById = async (req, res, next) => {
  try {
    const consultant = await checkConsultantAuthorization(req.params.id, req.user.id, req.user.role);
    
    const consultantWithDetails = await Consultant.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'support',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    return res.status(200).json(consultantWithDetails);
  } catch (error) {
    if (error.message === 'You are not authorized to access this consultant') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Consultant not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateConsultant = async (req, res, next) => {
  try {
    const consultant = await checkConsultantAuthorization(req.params.id, req.user.id, req.user.role);
    
    await consultant.update(req.body);
    
    const updatedConsultant = await Consultant.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'support',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    return res.status(200).json(updatedConsultant);
  } catch (error) {
    if (error.message === 'You are not authorized to access this consultant') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Consultant not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.deleteConsultant = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }
    
    await consultant.destroy();
    return res.status(200).json({ message: 'Consultant deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;
    const { verifybtn, undoPaymentVerification } = req.body;

    // Only superAdmin can verify or undo payment verification
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        message: "Only superAdmin can verify or undo payment verification"
      });
    }

    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Handle payment verification status reversal
    if (undoPaymentVerification === true) {
      await consultant.update({ paymentStatus: false });
      return res.status(200).json({
        message: "Payment verification undone successfully",
        consultant: {
          id: consultant.id,
          fullName: consultant.fulllegalname,
          paymentStatus: false
        }
      });
    }

    // Handle normal payment verification
    if (verifybtn === true) {
      await consultant.update({ paymentStatus: true });
      return res.status(200).json({
        message: "Payment verified successfully",
        consultant: {
          id: consultant.id,
          fullName: consultant.fulllegalname,
          paymentStatus: true
        }
      });
    }

    return res.status(400).json({ message: "Invalid request" });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    next(error);
  }
};

// Assign staff (coordinator and support) to a consultant
exports.assignStaff = async (req, res, next) => {
  try {
    const { coordinatorId, supportId } = req.body;
    const consultantId = req.params.id;

    // Find the consultant
    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found' });
    }

    // Validate coordinator exists and has correct role
    if (coordinatorId) {
      const coordinator = await User.findOne({
        where: { id: coordinatorId, role: 'coordinator' }
      });
      if (!coordinator) {
        return res.status(400).json({ message: 'Invalid coordinator ID or user is not a coordinator' });
      }
    }

    // Validate support exists and has correct role
    if (supportId) {
      const support = await User.findOne({
        where: { id: supportId, role: 'Support' }
      });
      if (!support) {
        return res.status(400).json({ message: 'Invalid support ID or user is not a support staff' });
      }
    }

    // Update consultant with assigned staff
    await consultant.update({
      assignedCoordinatorId: coordinatorId || consultant.assignedCoordinatorId,
      assignedSupportId: supportId || consultant.assignedSupportId,
      assignmentDate: new Date()
    });

    // Fetch updated consultant with staff details
    const updatedConsultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'support',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    return res.status(200).json({
      message: 'Staff assigned successfully',
      consultant: updatedConsultant
    });
  } catch (error) {
    console.error('Error in assignStaff:', error);
    next(error);
  }
};

// Get consultants assigned to a coordinator or support staff
exports.getAssignedConsultants = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['coordinator', 'Support'].includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Only coordinators and support staff can view assigned consultants.' });
    }

    const whereClause = userRole === 'coordinator' 
      ? { assignedCoordinatorId: userId }
      : { assignedSupportId: userId };

    const consultants = await Consultant.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'coordinator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'support',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    return res.status(200).json(consultants);
  } catch (error) {
    console.error('Error in getAssignedConsultants:', error);
    next(error);
  }
};

// Assign self as resume builder
exports.assignSelfAsResumeBuilder = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;

    // Only resume builders can assign themselves
    if (req.user.role !== 'resumeBuilder') {
      return res.status(403).json({
        message: "Only resume builders can assign themselves to consultants"
      });
    }

    const consultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if consultant already has a resume builder assigned
    if (consultant.assignedResumeBuilder) {
      return res.status(400).json({
        message: "Consultant already has a resume builder assigned",
        assignedTo: consultant.resumeBuilder
      });
    }

    // Assign the resume builder
    await consultant.update({
      assignedResumeBuilder: req.user.id,
      resumeStatus: 'not_built' // Reset status when newly assigned
    });

    // Get updated consultant data
    const updatedConsultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.status(200).json({
      message: "Successfully assigned as resume builder",
      consultant: {
        id: updatedConsultant.id,
        fullName: updatedConsultant.fulllegalname,
        resumeStatus: updatedConsultant.resumeStatus,
        resumeBuilder: updatedConsultant.resumeBuilder
      }
    });
  } catch (error) {
    console.error('Error in assignSelfAsResumeBuilder:', error);
    next(error);
  }
};

// Update resume status (for superAdmin)
exports.updateResumeStatus = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be either 'accepted' or 'rejected'" 
      });
    }

    // Only superAdmin can update resume status
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        message: "Access forbidden: Only superAdmin can update resume status"
      });
    }

    const consultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if resume exists
    if (!consultant.resumeFile) {
      return res.status(400).json({ message: "No resume found for this consultant" });
    }

    // Update the resume status
    await consultant.update({ resumeStatus: status });

    res.status(200).json({
      message: `Resume ${status} successfully`,
      consultant: {
        id: consultant.id,
        fullName: consultant.fulllegalname,
        resumeStatus: consultant.resumeStatus,
        resumeBuilder: consultant.resumeBuilder
      }
    });
  } catch (error) {
    console.error('Error in updateResumeStatus:', error);
    next(error);
  }
};

// Upload resume PDF
exports.uploadResumePDF = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        message: 'Invalid file type. Only PDF files are allowed' 
      });
    }

    // Only resume builders can upload resumes
    if (req.user.role !== 'resumeBuilder') {
      return res.status(403).json({
        message: "Only resume builders can upload resumes"
      });
    }

    const consultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if this resume builder is assigned to this consultant
    if (consultant.assignedResumeBuilder !== req.user.id) {
      return res.status(403).json({
        message: "You are not assigned as the resume builder for this consultant"
      });
    }

    // Create a unique filename
    const filename = `resume-${consultantId}-${Date.now()}.pdf`;
    const uploadsDir = path.join(__dirname, '../../uploads/resumes');
    const filePath = path.join(uploadsDir, filename);

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write the file to the uploads folder
    fs.writeFileSync(filePath, req.file.buffer);

    // Update consultant with the resume file path and set status to not_built
    await consultant.update({
      resumeFile: `/uploads/resumes/${filename}`,  // Store the relative path
      resumeStatus: 'not_built'  // Reset to not_built so superAdmin can review
    });

    res.status(200).json({
      message: "Resume uploaded successfully. Waiting for admin approval.",
      consultant: {
        id: consultant.id,
        fullName: consultant.fulllegalname,
        resumeStatus: consultant.resumeStatus,
        resumeBuilder: consultant.resumeBuilder,
        hasResume: true
      }
    });
  } catch (error) {
    console.error('Error in uploadResumePDF:', error);
    next(error);
  }
};

// Disassign resume builder (for resumeBuilder)
exports.disassignSelfAsResumeBuilder = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;

    // Only resume builders can disassign themselves
    if (req.user.role !== 'resumeBuilder') {
      return res.status(403).json({
        message: "Only resume builders can disassign themselves from consultants"
      });
    }

    const consultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if the current user is actually assigned as the resume builder
    if (consultant.assignedResumeBuilder !== req.user.id) {
      return res.status(403).json({
        message: "You are not assigned as the resume builder for this consultant"
      });
    }

    // Disassign the resume builder
    await consultant.update({
      assignedResumeBuilder: null,
      resumeStatus: 'not_built' // Reset status when disassigned
    });

    res.status(200).json({
      message: "Successfully disassigned as resume builder",
      consultant: {
        id: consultant.id,
        fullName: consultant.fulllegalname,
        resumeStatus: 'not_built'
      }
    });
  } catch (error) {
    console.error('Error in disassignSelfAsResumeBuilder:', error);
    next(error);
  }
};

// Get resume PDF
exports.getResumePDF = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;

    const consultant = await Consultant.findByPk(consultantId, {
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if resume exists
    if (!consultant.resumeFile) {
      return res.status(404).json({ message: "No resume found for this consultant" });
    }

    // Check authorization
    if (req.user.role !== 'superAdmin' && 
        req.user.role !== 'resumeBuilder' && 
        req.user.role !== 'coordinator' && 
        req.user.role !== 'Support') {
      return res.status(403).json({
        message: "Access forbidden: You are not authorized to view resumes"
      });
    }

    // For non-superAdmin users, check if they are assigned to this consultant
    if (req.user.role !== 'superAdmin') {
      if (req.user.role === 'resumeBuilder' && consultant.assignedResumeBuilder !== req.user.id) {
        return res.status(403).json({
          message: "Access forbidden: You are not assigned as the resume builder for this consultant"
        });
      }
      if (req.user.role === 'coordinator' && consultant.assignedCoordinatorId !== req.user.id) {
        return res.status(403).json({
          message: "Access forbidden: You are not assigned as the coordinator for this consultant"
        });
      }
      if (req.user.role === 'Support' && consultant.assignedSupportId !== req.user.id) {
        return res.status(403).json({
          message: "Access forbidden: You are not assigned as the support staff for this consultant"
        });
      }
    }

    // Get the absolute path of the resume file
    const filePath = path.join(__dirname, '../..', consultant.resumeFile);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Resume file not found" });
    }

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=resume-${consultant.fulllegalname}.pdf`);

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error in getResumePDF:', error);
    next(error);
  }
};

// Get proof file
exports.getProofFile = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;

    const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Check if proof exists
    if (!consultant.registrationProof) {
      return res.status(404).json({ message: "No proof found for this consultant" });
    }

    // Get the absolute path of the proof file
    const filePath = path.join(__dirname, '../..', consultant.registrationProof);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Proof file not found" });
    }

    // Get the file extension
    const ext = path.extname(consultant.registrationProof).toLowerCase();
    
    // Set appropriate content type based on file extension
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename=proof-${consultant.fulllegalname}${ext}`);

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error in getProofFile:', error);
    next(error);
  }
};

exports.getPendingResumes = async (req, res, next) => {
  try {
    // Only superAdmin can view pending resumes
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        message: "Access forbidden: Only superAdmin can view pending resumes"
      });
    }

    const consultants = await Consultant.findAll({
      where: {
        resumeStatus: 'not_built',
        resumeFile: { [Op.ne]: null } // Has a resume file uploaded
      },
      include: [
        {
          model: User,
          as: 'resumeBuilder',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']] // Most recently updated first
    });

    res.status(200).json({
      count: consultants.length,
      consultants: consultants.map(consultant => ({
        id: consultant.id,
        fullName: consultant.fulllegalname,
        resumeStatus: consultant.resumeStatus,
        resumeFile: consultant.resumeFile,
        resumeBuilder: consultant.resumeBuilder,
        updatedAt: consultant.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error in getPendingResumes:', error);
    next(error);
  }
};
