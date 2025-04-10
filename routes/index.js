const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../utils/fileUpload');

// Import controllers
const {
  signup,
  login
} = require('../controllers/authController');

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const {
  createConsultant,
  uploadDocument,
  getAllConsultants,
  getConsultantById,
  updateConsultant,
  deleteConsultant,
  verifyPayment,
  assignStaff,
  getAssignedConsultants,
  assignSelfAsResumeBuilder,
  disassignSelfAsResumeBuilder,
  updateResumeStatus,
  uploadResumePDF,
  getResumePDF,
  getProofFile,
  getPendingResumes,
  getMyProfile,
  uploadCandidateDocuments,
  getDocument,
  sendDocumentVerificationRequest,
  getPendingDocumentVerifications,
  approveDocumentVerification
} = require('../controllers/consultantController');

const {
  createJobDetails,
  getJobDetails,
  updateJobDetails,
  deleteJobDetails,
  getAllPlacedJobDetails,
  updatePlacementStatus
} = require('../controllers/consultantJobDetailsController');

// Import company controller
const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  addJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getCompanyJobs
} = require('../controllers/companyController');

const {
  createAgreementDetails,
  getAllAgreementDetails,
  getAgreementDetailsById,
  updatePayment,
  updateJobLostDate,
  createAgreement,
  getAgreement,
  updateAgreement,
  deleteAgreement
} = require("../controllers/agreementDetailsController");

// Auth routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// User routes
router.get('/users', protect, authorizeRoles('superAdmin', 'admin'), getUsers);
router.get('/users/:id', protect, getUserById);
router.post('/users', protect, authorizeRoles('superAdmin', 'admin'), createUser);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, authorizeRoles('superAdmin'), deleteUser);

// Consultant routes
router.post('/consultants', protect, authorizeRoles('superAdmin', 'admin', 'Candidate'), createConsultant);
router.get('/consultants/pending-verifications', protect, authorizeRoles('coordinator', 'teamLead'), getPendingDocumentVerifications);
router.get('/consultants/pending-resumes', protect, authorizeRoles('superAdmin'), getPendingResumes);
router.get('/consultants', protect, authorizeRoles('superAdmin', 'admin', 'coordinator', 'resumeBuilder', 'teamLead', 'Accounts'), getAllConsultants);
router.get('/consultants/:id', protect, authorizeRoles('superAdmin', 'admin', 'coordinator', 'resumeBuilder', 'teamLead', 'Accounts'), getConsultantById);
router.get('/my-profile', protect, getMyProfile);
router.post('/consultants/:id/upload-documents', protect, upload.array('documents', 5), uploadCandidateDocuments);
router.get('/consultants/:id/documents/:documentName', protect, getDocument);
router.post('/consultants/:id/request-verification', protect, sendDocumentVerificationRequest);
router.post('/consultants/:id/approve-verification', protect, authorizeRoles('teamLead', 'coordinator'), approveDocumentVerification);
router.put('/consultants/:id', protect, authorizeRoles('superAdmin', 'coordinator'), updateConsultant);
router.delete('/consultants/:id', protect, authorizeRoles('superAdmin'), deleteConsultant);
router.post('/consultants/:id/upload-proof', protect, upload.single('proof'), uploadDocument);
router.get('/consultants/:id/proof', protect, authorizeRoles('superAdmin'), getProofFile);
router.post('/consultants/:id/verify-payment', protect, authorizeRoles('superAdmin', 'Accounts', 'admin'), verifyPayment);

// Resume builder routes
router.post('/consultants/:id/assign-resume-builder', protect, authorizeRoles('resumeBuilder'), assignSelfAsResumeBuilder);
router.post('/consultants/:id/disassign-resume-builder', protect, authorizeRoles('resumeBuilder'), disassignSelfAsResumeBuilder);
router.put('/consultants/:id/resume-status', protect, authorizeRoles('superAdmin'), updateResumeStatus);
router.post('/consultants/:id/upload-resume', protect, authorizeRoles('resumeBuilder'), upload.single('resume'), uploadResumePDF);
router.get('/consultants/:id/resume', protect, authorizeRoles('superAdmin', 'coordinator', 'resumeBuilder', 'teamLead'), getResumePDF);

// New routes for staff assignment
router.post('/consultants/:id/assign-staff', protect, authorizeRoles('superAdmin', 'admin'), assignStaff);
router.get('/my-assigned-consultants', protect, authorizeRoles('superAdmin', 'admin', 'coordinator', 'teamLead'), getAssignedConsultants);

// Consultant Job Details routes
router.get('/placed-consultants', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), getAllPlacedJobDetails);
router.post('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin', 'admin', 'coordinator', 'teamLead'), createJobDetails);
router.get('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin', 'admin', 'coordinator', 'resumeBuilder', 'teamLead', 'Accounts'), getJobDetails);
router.put('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin', 'Accounts', 'admin'), updateJobDetails);
router.delete('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin'), deleteJobDetails);

// Update placement status
router.put(
  "/consultants/:consultantId/placement-status",
  protect,
  authorizeRoles("superAdmin", "coordinator", "teamLead"),
  updatePlacementStatus
);

// Company routes
router.post('/companies', protect, authorizeRoles('superAdmin', 'admin', 'coordinator'), createCompany);
router.get('/companies', protect, getAllCompanies);
router.get('/companies/:id', protect, getCompanyById);
router.put('/companies/:id', protect, authorizeRoles('superAdmin', 'coordinator'), updateCompany);
router.delete('/companies/:id', protect, authorizeRoles('superAdmin'), deleteCompany);

// Company job routes
router.get('/companies/:id/jobs', protect, getCompanyJobs);
router.post('/companies/:id/jobs', protect, authorizeRoles('superAdmin', 'admin', 'coordinator'), addJobPosting);
router.put('/companies/:companyId/jobs/:jobId', protect, authorizeRoles('superAdmin', 'coordinator'), updateJobPosting);
router.delete('/companies/:companyId/jobs/:jobId', protect, authorizeRoles('superAdmin'), deleteJobPosting);

// Agreement routes
router.post('/consultants/:consultantId/agreement', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), createAgreement);
router.get('/consultants/:consultantId/agreement', protect, authorizeRoles('superAdmin', 'admin', 'coordinator', 'teamLead', 'Accounts'), getAgreement);
router.put('/consultants/:consultantId/agreement', protect, authorizeRoles('superAdmin', 'Accounts'), updateAgreement);
router.delete('/consultants/:consultantId/agreement', protect, authorizeRoles('superAdmin'), deleteAgreement);

// Agreement Details Routes
router.post('/agreement-details', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), createAgreementDetails);
router.get('/agreement-details', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), getAllAgreementDetails);
router.get('/agreement-details/:id', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), getAgreementDetailsById);
router.put('/agreement-details/:id/payment', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), updatePayment);
router.put('/agreement-details/:id/job-lost', protect, authorizeRoles('superAdmin', 'admin', 'Accounts'), updateJobLostDate);

module.exports = router;
