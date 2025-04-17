// src/controllers/consultantController.js
const { Consultant } = require("../models/consultantModel");
const User = require("../models/userModel");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const { ConsultantJobDetails } = require("../models/consultantJobDetailsModel");
const { AgreementDetails } = require("../models/agreementDetailsModel");

// Helper function to check if user is assigned to consultant
const isUserAssignedToConsultant = (consultant, userId) => {
	return (
		consultant.assignedCoordinatorId === userId ||
		consultant.assignedTeamLeadId === userId
	);
};

// Helper function to check authorization
const checkConsultantAuthorization = async (consultantId, userId, userRole) => {
	const consultant = await Consultant.findByPk(consultantId);
	if (!consultant) {
		throw new Error("Consultant not found");
	}

	// SuperAdmin and admin can access all consultants
	if (userRole === "superAdmin" || userRole === "admin" || userRole === "Accounts") {
		return consultant;
	}

	// For coordinator and teamLead, check if they are assigned to this consultant
	if (["coordinator", "teamLead"].includes(userRole)) {
		if (!isUserAssignedToConsultant(consultant, userId)) {
			throw new Error("You are not authorized to access this consultant");
		}
		return consultant;
	}

	throw new Error("Unauthorized access");
};

exports.createConsultant = async (req, res, next) => {
  try {
		// Check if user is authorized to create consultants
		if (req.user.role !== "superAdmin" && req.user.role !== "Candidate") {
			return res.status(403).json({
				message:
					"Access forbidden: Only superAdmin and Candidate can create consultants",
			});
		}

		// If user is a Candidate, check if they already have a consultant profile
		if (req.user.role === "Candidate") {
			const existingConsultant = await Consultant.findOne({
				where: { createdBy: req.user.id },
			});

			if (existingConsultant) {
      return res.status(400).json({
					message:
						"You already have a consultant profile. Candidates can only create one profile.",
				});
			}
		}

		// Create consultant with all fields from req.body and add createdBy
		const consultant = await Consultant.create({
			...req.body,
			createdBy: req.user.id,
		});

		res.status(201).json({
			message: "Consultant created successfully",
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				email: consultant.email,
				createdBy: req.user.id,
				createdAt: consultant.createdAt,
			},
		});
  } catch (error) {
		console.error("Error in createConsultant:", error);
    next(error);
  }
};

// Upload payment proof
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		const { id: consultantId } = req.params;

		// Create a unique filename
		const filename = `proof-${consultantId}-${Date.now()}${path.extname(req.file.originalname)}`;

		// Create directory path
		const uploadDir = path.join(__dirname, "../uploads/proofs");
		const filePath = path.join(uploadDir, filename);

		// Ensure the uploads directory exists
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Write the file to the uploads folder
		fs.writeFileSync(filePath, req.file.buffer);

		// Update the consultant's record with the file path
		const consultant = await Consultant.findByPk(consultantId);
    if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		await consultant.update({
			registrationProof: `/uploads/proofs/${filename}`, // Store the relative path
		});

		return res.status(200).json({
			message: "Proof uploaded successfully",
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				hasProof: true,
			},
		});
  } catch (error) {
		console.error("Error in uploadDocument:", error);
    next(error);
  }
};

// Get all consultants with pagination, search, and filters
exports.getAllConsultants = async (req, res, next) => {
  try {
    let whereClause = {};
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Handle different roles
    if (req.user.role === "resumeBuilder") {
      // Show consultants that either have no resume builder or are assigned to this builder
      whereClause = {
        [Op.or]: [
          { assignedResumeBuilder: null },
          { assignedResumeBuilder: req.user.id },
        ],
      };
    } else if (req.user.role !== "superAdmin" && req.user.role !== "Accounts" && req.user.role !== "admin") {
      // For coordinator and team lead, show only their assigned consultants
      whereClause = {
        [Op.or]: [
          { assignedCoordinatorId: req.user.id },
          { assignedCoordinator2Id: req.user.id },
          { assignedTeamLeadId: req.user.id },
        ],
      };
    }

    // Get total count for pagination
    const totalCount = await Consultant.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);

    const consultants = await Consultant.findAll({
      where: whereClause,
      attributes: {
        exclude: ["registrationProof"],
      },
      include: [
        {
          model: User,
          as: "coordinator",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "coordinator2",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "teamLead",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "resumeBuilder",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "role"],
        },
        {
          model: ConsultantJobDetails,
          attributes: ["isJob"],
          required: false
        }
      ],
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']] // Order by latest first
    });

    // Transform the response to include coordinators as an array
    const transformedConsultants = consultants.map(consultant => {
      const consultantData = consultant.toJSON();
      const coordinators = [];

      // Add primary coordinator if exists
      if (consultantData.coordinator && consultantData.coordinator.id) {
        coordinators.push({
          id: consultantData.coordinator.id,
          username: consultantData.coordinator.username,
          email: consultantData.coordinator.email
        });
      }

      // Add secondary coordinator if exists
      if (consultantData.coordinator2 && consultantData.coordinator2.id) {
        coordinators.push({
          id: consultantData.coordinator2.id,
          username: consultantData.coordinator2.username,
          email: consultantData.coordinator2.email
        });
      }

      // Remove individual coordinator fields
      delete consultantData.coordinator;
      delete consultantData.coordinator2;

      // Add coordinators array
      consultantData.coordinators = coordinators;

      // Add isJob field
      consultantData.isJob = consultantData.ConsultantJobDetails?.isJob || 
                            consultant.isPlaced || 
                            consultant.isHold || 
                            consultant.isActive;
      delete consultantData.ConsultantJobDetails;

      // Add openForWork status to response
      consultantData.openForWork = consultant.openForWork;

      return consultantData;
    });

    return res.status(200).json({
      consultants: transformedConsultants,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error in getAllConsultants:", error);
    next(error);
  }
};

// Get a single consultant by ID
exports.getConsultantById = async (req, res, next) => {
  try {
    const consultant = await checkConsultantAuthorization(
      req.params.id,
      req.user.id,
      req.user.role
    );

    const consultantWithDetails = await Consultant.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "coordinator",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "teamLead",
          attributes: ["id", "username", "email"],
        },
        {
          model: ConsultantJobDetails,
          attributes: ["isJob"],
          required: false
        }
      ],
    });

    // Add isJob and openForWork to the response
    const response = consultantWithDetails.toJSON();
    response.isJob = response.ConsultantJobDetails?.isJob || 
                    consultantWithDetails.isPlaced || 
                    consultantWithDetails.isHold || 
                    consultantWithDetails.isActive;
    response.openForWork = consultantWithDetails.openForWork;
    delete response.ConsultantJobDetails;

    return res.status(200).json(response);
  } catch (error) {
    if (error.message === "You are not authorized to access this consultant") {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === "Consultant not found") {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.updateConsultant = async (req, res, next) => {
  try {
		const consultant = await checkConsultantAuthorization(
			req.params.id,
			req.user.id,
			req.user.role
		);
    
    await consultant.update(req.body);

		const updatedConsultant = await Consultant.findByPk(req.params.id, {
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
			],
		});

		return res.status(200).json(updatedConsultant);
  } catch (error) {
		if (error.message === "You are not authorized to access this consultant") {
			return res.status(403).json({ message: error.message });
		}
		if (error.message === "Consultant not found") {
			return res.status(404).json({ message: error.message });
		}
    next(error);
  }
};

exports.deleteConsultant = async (req, res, next) => {
  try {
    const consultant = await Consultant.findByPk(req.params.id);
    if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
    }
    
    await consultant.destroy();
		return res.status(200).json({ message: "Consultant deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
		const { id: consultantId } = req.params;
		const { verifybtn, undoPaymentVerification } = req.body;

		// Only superAdmin can verify or undo payment verification
		if (req.user.role !== "superAdmin" && req.user.role !== "Accounts" && req.user.role !== "admin") {
			return res.status(403).json({
				message: "Only superAdmin can verify or undo payment verification",
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
					paymentStatus: false,
				},
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
					paymentStatus: true,
				},
			});
		}

		return res.status(400).json({ message: "Invalid request" });
	} catch (error) {
		console.error("Error in verifyPayment:", error);
		next(error);
	}
};

// Assign staff to consultant
exports.assignStaff = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;
		const { coordinatorId, coordinator2Id, teamLeadId } = req.body;

		// Find the consultant
		const consultant = await Consultant.findByPk(consultantId);
		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Validate coordinator IDs if provided
		if (coordinatorId) {
			const coordinator = await User.findByPk(coordinatorId);
			if (!coordinator || coordinator.role !== "coordinator") {
				return res.status(400).json({
					message: "Invalid primary coordinator ID or user is not a coordinator",
				});
			}
		}

		if (coordinator2Id) {
			const coordinator2 = await User.findByPk(coordinator2Id);
			if (!coordinator2 || coordinator2.role !== "coordinator") {
				return res.status(400).json({
					message: "Invalid secondary coordinator ID or user is not a coordinator",
				});
			}
		}

		// Validate team lead ID if provided
		if (teamLeadId) {
			const teamLead = await User.findByPk(teamLeadId);
			if (!teamLead || teamLead.role !== "teamLead") {
				return res.status(400).json({
					message: "Invalid team lead ID or user is not a team lead",
				});
			}
		}

		// Update the consultant with new staff assignments
		const updateData = {
			assignedCoordinatorId: coordinatorId || null,
			assignedCoordinator2Id: coordinator2Id || null,
			assignedTeamLeadId: teamLeadId || null,
			assignmentDate: new Date(),
		};

		await consultant.update(updateData);

		// Fetch updated consultant with all related staff
		const updatedConsultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "coordinator2",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
			],
		});

		res.status(200).json({
			message: "Staff assigned successfully",
			consultant: {
				id: updatedConsultant.id,
				fullName: updatedConsultant.fulllegalname,
				coordinator: updatedConsultant.coordinator
					? {
							id: updatedConsultant.coordinator.id,
							username: updatedConsultant.coordinator.username,
							email: updatedConsultant.coordinator.email,
						}
					: null,
				coordinator2: updatedConsultant.coordinator2
					? {
							id: updatedConsultant.coordinator2.id,
							username: updatedConsultant.coordinator2.username,
							email: updatedConsultant.coordinator2.email,
						}
					: null,
				teamLead: updatedConsultant.teamLead
					? {
							id: updatedConsultant.teamLead.id,
							username: updatedConsultant.teamLead.username,
							email: updatedConsultant.teamLead.email,
						}
					: null,
				assignmentDate: updatedConsultant.assignmentDate,
			},
		});
	} catch (error) {
		console.error("Error in assignStaff:", error);
		next(error);
	}
};

// Get consultants assigned to a coordinator or team lead
exports.getAssignedConsultants = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const userRole = req.user.role;

		if (!["coordinator", "teamLead"].includes(userRole)) {
			return res.status(403).json({
				message:
					"Access denied. Only coordinators and team leads can view assigned consultants.",
			});
		}

		const whereClause =
			userRole === "coordinator"
				? { assignedCoordinatorId: userId }
				: { assignedTeamLeadId: userId };

		const consultants = await Consultant.findAll({
			where: whereClause,
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
			],
		});

		return res.status(200).json(consultants);
	} catch (error) {
		console.error("Error in getAssignedConsultants:", error);
		next(error);
	}
};

// Assign self as resume builder
exports.assignSelfAsResumeBuilder = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;

		// Only resume builders can assign themselves
		if (req.user.role !== "resumeBuilder") {
			return res.status(403).json({
				message: "Only resume builders can assign themselves to consultants",
			});
		}

		const consultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if consultant already has a resume builder assigned
		if (consultant.assignedResumeBuilder) {
			return res.status(400).json({
				message: "Consultant already has a resume builder assigned",
				assignedTo: consultant.resumeBuilder,
			});
		}

		// Assign the resume builder
		await consultant.update({
			assignedResumeBuilder: req.user.id,
			resumeStatus: "not_built", // Reset status when newly assigned
		});

		// Get updated consultant data
		const updatedConsultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
		});

		res.status(200).json({
			message: "Successfully assigned as resume builder",
			consultant: {
				id: updatedConsultant.id,
				fullName: updatedConsultant.fulllegalname,
				resumeStatus: updatedConsultant.resumeStatus,
				resumeBuilder: updatedConsultant.resumeBuilder,
			},
		});
	} catch (error) {
		console.error("Error in assignSelfAsResumeBuilder:", error);
		next(error);
	}
};

// Update resume status (for superAdmin)
exports.updateResumeStatus = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;
		const { status } = req.body;

		// Validate status
		if (!["accepted", "rejected"].includes(status)) {
			return res.status(400).json({
				message: "Invalid status. Must be either 'accepted' or 'rejected'",
			});
		}

		// Only superAdmin can update resume status
		if (req.user.role !== "superAdmin") {
			return res.status(403).json({
				message: "Access forbidden: Only superAdmin can update resume status",
			});
		}

		const consultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if resume exists
		if (!consultant.resumeFile) {
			return res
				.status(400)
				.json({ message: "No resume found for this consultant" });
		}

		// Update the resume status
		await consultant.update({ resumeStatus: status });

		res.status(200).json({
			message: `Resume ${status} successfully`,
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				resumeStatus: consultant.resumeStatus,
				resumeBuilder: consultant.resumeBuilder,
			},
		});
	} catch (error) {
		console.error("Error in updateResumeStatus:", error);
		next(error);
	}
};

// Upload resume PDF
exports.uploadResumePDF = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;

		// Check if file was uploaded
		if (!req.file) {
			return res.status(400).json({ message: "No resume file uploaded" });
		}

		// Validate file type
		if (req.file.mimetype !== "application/pdf") {
			return res.status(400).json({
				message: "Invalid file type. Only PDF files are allowed",
			});
		}

		// Only resume builders can upload resumes
		if (req.user.role !== "resumeBuilder") {
			return res.status(403).json({
				message: "Only resume builders can upload resumes",
			});
		}

		const consultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if this resume builder is assigned to this consultant
		if (consultant.assignedResumeBuilder !== req.user.id) {
			return res.status(403).json({
				message:
					"You are not assigned as the resume builder for this consultant",
			});
		}

		// Create a unique filename
		const filename = `resume-${consultantId}-${Date.now()}.pdf`;
		const uploadsDir = path.join(__dirname, "../../uploads/resumes");
		const filePath = path.join(uploadsDir, filename);

		// Ensure the uploads directory exists
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true });
		}

		// Write the file to the uploads folder
		fs.writeFileSync(filePath, req.file.buffer);

		// Update consultant with the resume file path and set status to not_built
		await consultant.update({
			resumeFile: `/uploads/resumes/${filename}`, // Store the relative path
			resumeStatus: "not_built", // Reset to not_built so superAdmin can review
		});

		res.status(200).json({
			message: "Resume uploaded successfully. Waiting for admin approval.",
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				resumeStatus: consultant.resumeStatus,
				resumeBuilder: consultant.resumeBuilder,
				hasResume: true,
			},
		});
	} catch (error) {
		console.error("Error in uploadResumePDF:", error);
		next(error);
	}
};

// Disassign resume builder (for resumeBuilder)
exports.disassignSelfAsResumeBuilder = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;

		// Only resume builders can disassign themselves
		if (req.user.role !== "resumeBuilder") {
			return res.status(403).json({
				message:
					"Only resume builders can disassign themselves from consultants",
			});
		}

		const consultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if the current user is actually assigned as the resume builder
		if (consultant.assignedResumeBuilder !== req.user.id) {
			return res.status(403).json({
				message:
					"You are not assigned as the resume builder for this consultant",
			});
		}

		// Disassign the resume builder
		await consultant.update({
			assignedResumeBuilder: null,
			resumeStatus: "not_built", // Reset status when disassigned
		});

		res.status(200).json({
			message: "Successfully disassigned as resume builder",
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				resumeStatus: "not_built",
			},
		});
	} catch (error) {
		console.error("Error in disassignSelfAsResumeBuilder:", error);
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
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if resume exists
		if (!consultant.resumeFile) {
			return res
				.status(404)
				.json({ message: "No resume found for this consultant" });
		}

		// Check authorization
		if (
			req.user.role !== "superAdmin" &&
			req.user.role !== "resumeBuilder" &&
			req.user.role !== "coordinator" &&
			req.user.role !== "teamLead"
		) {
			return res.status(403).json({
				message: "Access forbidden: You are not authorized to view resumes",
			});
		}

		// For non-superAdmin users, check if they are assigned to this consultant
		if (req.user.role !== "superAdmin") {
			if (
				req.user.role === "resumeBuilder" &&
				consultant.assignedResumeBuilder !== req.user.id
			) {
				return res.status(403).json({
					message:
						"Access forbidden: You are not assigned as the resume builder for this consultant",
				});
			}
			if (
				req.user.role === "coordinator" &&
				consultant.assignedCoordinatorId !== req.user.id
			) {
				return res.status(403).json({
					message:
						"Access forbidden: You are not assigned as the coordinator for this consultant",
				});
			}
			if (
				req.user.role === "teamLead" &&
				consultant.assignedTeamLeadId !== req.user.id
			) {
				return res.status(403).json({
					message:
						"Access forbidden: You are not assigned as the team lead for this consultant",
				});
			}
		}

		// Get the absolute path of the resume file
		const filePath = path.join(__dirname, "../..", consultant.resumeFile);

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ message: "Resume file not found" });
		}

		// Set response headers for PDF
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`inline; filename=resume-${consultant.fulllegalname}.pdf`
		);

		// Send the file
		res.sendFile(filePath);
	} catch (error) {
		console.error("Error in getResumePDF:", error);
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
			return res
				.status(404)
				.json({ message: "No proof found for this consultant" });
		}

		// Get the absolute path of the proof file
		const filePath = path.join(
			__dirname,
			"../..",
			consultant.registrationProof
		);

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ message: "Proof file not found" });
		}

		// Get the file extension
		const ext = path.extname(consultant.registrationProof).toLowerCase();

		// Set appropriate content type based on file extension
		let contentType = "application/octet-stream";
		if (ext === ".pdf") {
			contentType = "application/pdf";
		} else if (ext === ".jpg" || ext === ".jpeg") {
			contentType = "image/jpeg";
		} else if (ext === ".png") {
			contentType = "image/png";
		}

		// Set response headers
		res.setHeader("Content-Type", contentType);
		res.setHeader(
			"Content-Disposition",
			`inline; filename=proof-${consultant.fulllegalname}${ext}`
		);

		// Send the file
		res.sendFile(filePath);
	} catch (error) {
		console.error("Error in getProofFile:", error);
		next(error);
	}
};

exports.getPendingResumes = async (req, res, next) => {
	try {
		// Only superAdmin can view pending resumes
		if (req.user.role !== "superAdmin") {
			return res.status(403).json({
				message: "Access forbidden: Only superAdmin can view pending resumes",
			});
		}

		const consultants = await Consultant.findAll({
			where: {
				resumeStatus: "not_built",
				resumeFile: { [Op.ne]: null }, // Has a resume file uploaded
			},
			include: [
				{
					model: User,
					as: "resumeBuilder",
					attributes: ["id", "username", "email"],
				},
			],
			order: [["updatedAt", "DESC"]], // Most recently updated first
		});

		res.status(200).json({
			count: consultants.length,
			consultants: consultants.map((consultant) => ({
				id: consultant.id,
				fullName: consultant.fulllegalname,
				resumeStatus: consultant.resumeStatus,
				resumeFile: consultant.resumeFile,
				resumeBuilder: consultant.resumeBuilder,
				updatedAt: consultant.updatedAt,
			})),
		});
	} catch (error) {
		console.error("Error in getPendingResumes:", error);
		next(error);
	}
};

exports.getMyProfile = async (req, res, next) => {
	try {
		// Only candidates can view their own profile
		if (req.user.role !== "Candidate") {
			return res.status(403).json({
				message: "Access forbidden: Only candidates can view their own profile",
			});
		}

		// Find the consultant profile created by this candidate
		const consultant = await Consultant.findOne({
			where: { createdBy: req.user.id },
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "creator",
					attributes: ["id", "username", "email", "role"],
				},
				{
					model: ConsultantJobDetails,
					attributes: ["isAgreement", "id"],
					required: false
				}
			],
		});

		if (!consultant) {
			return res.status(404).json({
				message: "No profile found",
			});
		}

		// Get job details separately to ensure we get the latest data
		const jobDetails = await ConsultantJobDetails.findOne({
			where: { consultantId: consultant.id },
			attributes: ['isAgreement', 'id']
		});

		const hasAgreement = jobDetails ? jobDetails.isAgreement : false;

		// Get agreement details if they exist
		let agreementInfo = null;
		if (hasAgreement && jobDetails) {
			const agreement = await AgreementDetails.findOne({
				where: { consultantJobDetailsId: jobDetails.id }
			});
			if (agreement) {
				// Format monthly payment and proof information
				const monthlyInfo = [];
				for (let i = 1; i <= 8; i++) {
					const proofFile = agreement[`month${i}Proof`];
					monthlyInfo.push({
						monthNumber: i,
						status: agreement[`month${i}Status`] || "pending",
						amountReceived: agreement[`month${i}AmountReceived`] || 0,
						receivedDate: agreement[`month${i}ReceivedDate`],
						notes: agreement[`month${i}Notes`],
						dueDate: agreement[`month${i}DueDate`],
						proofFile: proofFile ? `/uploads/emi-proofs/${proofFile}` : null,
					});
				}

				agreementInfo = {
					totalServiceFee: agreement.totalServiceFee,
					monthlyPaymentAmount: agreement.monthlyPaymentAmount,
					paymentCompletionStatus: agreement.paymentCompletionStatus,
					totalPaidSoFar: agreement.totalPaidSoFar,
					remainingBalance: agreement.remainingBalance,
					nextDueDate: agreement.nextDueDate,
					monthlyInfo: monthlyInfo
				};
			}
		}

		// Check if documents are uploaded
		const hasDocuments =
			consultant.document1 &&
			consultant.document2 &&
			consultant.document3 &&
			consultant.document4 &&
			consultant.document5;

		res.status(200).json({
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				email: consultant.email,
				phone: consultant.phone,
				resumeStatus: consultant.resumeStatus,
				paymentStatus: consultant.paymentStatus,
				hasResume: consultant.hasResume,
				hasProof: consultant.hasProof,
				isPlaced: consultant.isPlaced,
				hasAgreement: hasAgreement,
				agreementInfo: agreementInfo,
				documentVerificationStatus: hasDocuments
					? consultant.documentVerificationStatus
					: "not_uploaded",
				documents: {
					document1: consultant.document1,
					document2: consultant.document2,
					document3: consultant.document3,
					document4: consultant.document4,
					document5: consultant.document5,
				},
				coordinator: consultant.coordinator,
				teamLead: consultant.teamLead,
				createdBy: consultant.creator,
				createdAt: consultant.createdAt,
				updatedAt: consultant.updatedAt,
			},
		});
	} catch (error) {
		console.error("Error in getMyProfile:", error);
		next(error);
	}
};

exports.uploadCandidateDocuments = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;

		// Check if user is authorized (only candidates can upload their own documents)
		if (req.user.role !== "Candidate") {
			return res.status(403).json({
				message: "Access forbidden: Only candidates can upload their documents",
			});
		}

		// Find the consultant
		const consultant = await Consultant.findByPk(consultantId);
      if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if consultant is created by this candidate
		if (consultant.createdBy !== req.user.id) {
			return res.status(403).json({
				message:
					"Access forbidden: You can only upload documents for your own profile",
			});
		}

		// Check if consultant is placed
		const jobDetails = await ConsultantJobDetails.findOne({
			where: { consultantId: consultant.id },
		});

		if (!jobDetails) {
			return res.status(400).json({
				message: "Cannot upload documents: Consultant is not placed yet",
			});
		}

		// Check if exactly 5 files were uploaded
		if (!req.files || req.files.length !== 5) {
			return res.status(400).json({
				message: "Exactly 5 documents are required",
			});
		}

		const uploadedFiles = {};
		const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
		const maxFileSize = 5 * 1024 * 1024; // 5MB

		// Ensure the documents directory exists
		const documentsDir = path.join(__dirname, "../../uploads/documents");
		if (!fs.existsSync(documentsDir)) {
			fs.mkdirSync(documentsDir, { recursive: true });
		}

		// Process each uploaded file
		for (let i = 0; i < req.files.length; i++) {
			const file = req.files[i];
			const docNumber = i + 1;

			// Validate file type
			if (!allowedTypes.includes(file.mimetype)) {
				return res.status(400).json({
					message: `Invalid file type for document ${docNumber}. Only PDF, JPEG, and PNG files are allowed`,
				});
			}

			// Validate file size
			if (file.size > maxFileSize) {
				return res.status(400).json({
					message: `File too large for document ${docNumber}. Maximum size is 5MB`,
				});
			}

			// Create a unique filename
			const filename = `doc-${consultantId}-${docNumber}-${Date.now()}${path.extname(file.originalname)}`;
			const filePath = path.join(documentsDir, filename);

			// Write the file to the uploads folder
			fs.writeFileSync(filePath, file.buffer);

			// Store the file path in the corresponding document field
			uploadedFiles[`document${docNumber}`] = `/uploads/documents/${filename}`;
		}

		// Update the consultant's document paths and set verification status to pending
		await consultant.update({
			...uploadedFiles,
			documentVerificationStatus: "pending",
		});

		res.status(200).json({
			message: "Documents uploaded successfully. Waiting for verification.",
			documents: uploadedFiles,
			documentVerificationStatus: "pending",
		});
	} catch (error) {
		console.error("Error in uploadCandidateDocuments:", error);
		next(error);
	}
};

// Get document file
exports.getDocument = async (req, res, next) => {
	try {
		const { id: consultantId, documentName } = req.params;

		// Find the consultant
		const consultant = await Consultant.findByPk(consultantId);
		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Handle both numeric and full document names
		let documentField;
		if (/^\d+$/.test(documentName)) {
			// If it's just a number, prepend 'document'
			documentField = `document${documentName}`;
    } else {
			// If it's already in documentX format, use as is
			documentField = documentName;
		}

		// Get the document path
		const documentPath = consultant[documentField];

		if (!documentPath) {
			return res.status(404).json({ message: "Document not found" });
		}

		// Get the absolute path of the document file
		const filePath = path.join(__dirname, "../..", documentPath);
	

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			console.error("File not found at path:", filePath);
			return res.status(404).json({ message: "Document file not found" });
		}

		// Get the file extension
		const ext = path.extname(documentPath).toLowerCase();

		// Set appropriate content type based on file extension
		let contentType = "application/octet-stream";
		if (ext === ".pdf") {
			contentType = "application/pdf";
		} else if (ext === ".jpg" || ext === ".jpeg") {
			contentType = "image/jpeg";
		} else if (ext === ".png") {
			contentType = "image/png";
		}

		// Set response headers
		res.setHeader("Content-Type", contentType);
		res.setHeader(
			"Content-Disposition",
			`inline; filename=${documentField}${ext}`
		);

		// For PDFs, also set these headers to help browsers display them properly
		if (ext === ".pdf") {
			res.setHeader("X-Content-Type-Options", "nosniff");
			res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
			res.setHeader("Pragma", "no-cache");
			res.setHeader("Expires", "0");
		}

		// Send the file
		res.sendFile(filePath, (err) => {
			if (err) {
				console.error("Error sending file:", err);
				if (!res.headersSent) {
					res.status(500).json({ message: "Error serving file" });
				}
			}
		});
  } catch (error) {
		console.error("Error in getDocument:", error);
		next(error);
	}
};

// Send document verification request
exports.sendDocumentVerificationRequest = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;

		// Find the consultant
		const consultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if all documents are uploaded
		if (
			!consultant.document1 ||
			!consultant.document2 ||
			!consultant.document3 ||
			!consultant.document4 ||
			!consultant.document5
		) {
			return res.status(400).json({
				message: "All documents must be uploaded before requesting verification",
				missingDocuments: {
					document1: !consultant.document1,
					document2: !consultant.document2,
					document3: !consultant.document3,
					document4: !consultant.document4,
					document5: !consultant.document5
				}
			});
		}

		// Check if verification is already pending
		if (consultant.documentVerificationStatus === "pending") {
			return res.status(400).json({
				message: "Document verification is already pending",
			});
		}

		// Check if coordinator and team lead are assigned
		if (!consultant.assignedCoordinatorId || !consultant.assignedTeamLeadId) {
			return res.status(400).json({
				message: "Both coordinator and team lead must be assigned before requesting verification",
				assigned: {
					coordinator: !!consultant.assignedCoordinatorId,
					teamLead: !!consultant.assignedTeamLeadId
				}
			});
		}

		// Update verification status to pending
		await consultant.update({ documentVerificationStatus: "pending" });

		// Get coordinator and team lead details
		const coordinator = consultant.coordinator;
		const teamLead = consultant.teamLead;

		res.status(200).json({
			message: "Document verification request sent successfully",
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				documentVerificationStatus: "pending",
				documents: {
					document1: consultant.document1,
					document2: consultant.document2,
					document3: consultant.document3,
					document4: consultant.document4,
					document5: consultant.document5
				},
				coordinator: coordinator
					? {
							id: coordinator.id,
							username: coordinator.username,
							email: coordinator.email,
						}
					: null,
				teamLead: teamLead
					? {
							id: teamLead.id,
							username: teamLead.username,
							email: teamLead.email,
						}
					: null,
			},
		});
	} catch (error) {
		console.error("Error in sendDocumentVerificationRequest:", error);
		next(error);
	}
};

// Get pending document verification requests
exports.getPendingDocumentVerifications = async (req, res, next) => {
	try {
		// Only team lead and coordinator can view pending verifications
		const userRole = req.user.role;
		if (!["teamLead", "coordinator"].includes(userRole)) {
			return res.status(403).json({
				message:
					"Access forbidden: Only team lead and coordinator staff can view pending verifications",
			});
		}

		// Build the where clause based on user role
		const whereClause = {
			documentVerificationStatus: "pending",
			// Ensure all documents are present
			document1: { [Op.ne]: null },
			document2: { [Op.ne]: null },
			document3: { [Op.ne]: null },
			document4: { [Op.ne]: null },
			document5: { [Op.ne]: null }
		};

		if (userRole === "teamLead") {
			whereClause.assignedTeamLeadId = req.user.id;
		} else if (userRole === "coordinator") {
			whereClause.assignedCoordinatorId = req.user.id;
		}

		// Find consultants with pending document verification
		const consultants = await Consultant.findAll({
			where: whereClause,
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "creator",
					attributes: ["id", "username", "email", "role"],
				},
			],
			order: [["updatedAt", "DESC"]], // Most recent first
		});

		res.status(200).json({
			count: consultants.length,
			consultants: consultants.map((consultant) => ({
				id: consultant.id,
				fullName: consultant.fulllegalname,
				email: consultant.email,
				phone: consultant.phone,
				documentVerificationStatus: consultant.documentVerificationStatus,
				documents: {
					document1: consultant.document1,
					document2: consultant.document2,
					document3: consultant.document3,
					document4: consultant.document4,
					document5: consultant.document5,
				},
				coordinator: consultant.coordinator,
				teamLead: consultant.teamLead,
				createdBy: consultant.creator,
				updatedAt: consultant.updatedAt,
			})),
		});
	} catch (error) {
		console.error("Error in getPendingDocumentVerifications:", error);
		next(error);
	}
};

// Approve document verification
exports.approveDocumentVerification = async (req, res, next) => {
	try {
		const { id: consultantId } = req.params;
		const userRole = req.user.role;

		// Find the consultant
		const consultant = await Consultant.findByPk(consultantId, {
			include: [
				{
					model: User,
					as: "coordinator",
					attributes: ["id", "username", "email"],
				},
				{
					model: User,
					as: "teamLead",
					attributes: ["id", "username", "email"],
				},
			],
		});

		if (!consultant) {
			return res.status(404).json({ message: "Consultant not found" });
		}

		// Check if user is authorized to approve verification
		if (
			userRole === "teamLead" &&
			consultant.assignedTeamLeadId !== req.user.id
		) {
			return res.status(403).json({
				message:
					"Access forbidden: You are not assigned as the team lead for this consultant",
			});
		}
		if (
			userRole === "coordinator" &&
			consultant.assignedCoordinatorId !== req.user.id
		) {
			return res.status(403).json({
				message:
					"Access forbidden: You are not assigned as the coordinator for this consultant",
			});
		}

		// Check if documents are uploaded
		if (
			!consultant.document1 ||
			!consultant.document2 ||
			!consultant.document3 ||
			!consultant.document4 ||
			!consultant.document5
		) {
			return res.status(400).json({
				message: "All documents must be uploaded before approving verification",
			});
		}

		// Check if verification is pending
		if (consultant.documentVerificationStatus !== "pending") {
			return res.status(400).json({
				message: "Document verification is not in pending status",
			});
		}

		// Update verification status to verified
		await consultant.update({ documentVerificationStatus: "verified" });

		res.status(200).json({
			message: "Document verification approved successfully",
			consultant: {
				id: consultant.id,
				fullName: consultant.fulllegalname,
				documentVerificationStatus: "verified",
				coordinator: consultant.coordinator,
				teamLead: consultant.teamLead,
			},
		});
  } catch (error) {
		console.error("Error in approveDocumentVerification:", error);
    next(error);
  }
};

// Update openForWork status
exports.updateOpenForWorkStatus = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;
    const { openForWork } = req.body;

    // Validate input
    if (typeof openForWork !== 'boolean') {
      return res.status(400).json({
        message: "openForWork must be a boolean value (true/false)"
      });
    }

    const consultant = await checkConsultantAuthorization(
      consultantId,
      req.user.id,
      req.user.role
    );

    await consultant.update({ openForWork });

    return res.status(200).json({
      message: `Consultant's open for work status updated to ${openForWork}`,
      consultant: {
        id: consultant.id,
        fullName: consultant.fulllegalname,
        openForWork: consultant.openForWork
      }
    });
  } catch (error) {
    console.error("Error in updateOpenForWorkStatus:", error);
    next(error);
  }
};

// Update BGV verification status
exports.updateBgvStatus = async (req, res, next) => {
  try {
    const { id: consultantId } = req.params;
    const { bgvVerified } = req.body;

    // Validate input
    if (typeof bgvVerified !== 'boolean') {
      return res.status(400).json({
        message: "bgvVerified must be a boolean value (true/false)"
      });
    }

    const consultant = await checkConsultantAuthorization(
      consultantId,
      req.user.id,
      req.user.role
    );

    await consultant.update({ bgvVerified });

    return res.status(200).json({
      message: `Consultant's BGV verification status updated to ${bgvVerified}`,
      consultant: {
        id: consultant.id,
        fullName: consultant.fulllegalname,
        bgvVerified: consultant.bgvVerified
      }
    });
  } catch (error) {
    console.error("Error in updateBgvStatus:", error);
    next(error);
  }
};
