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
  getPendingResumes
} = require('../controllers/consultantController');

const {
  createJobDetails,
  getJobDetails,
  updateJobDetails,
  deleteJobDetails,
  getAllPlacedJobDetails
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
  createAgreement,
  getAgreement,
  updateAgreement,
  deleteAgreement
} = require("../controllers/agreementDetailsController");

// Auth routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// User routes
router.get('/users', protect, authorizeRoles('superAdmin'), getUsers);
router.get('/users/:id', protect, getUserById);
router.post('/users', protect, authorizeRoles('superAdmin'), createUser);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, authorizeRoles('superAdmin'), deleteUser);

// Consultant routes
router.post('/consultants', protect, authorizeRoles('coordinator', 'resumeBuilder'), createConsultant);
router.get('/consultants', protect, authorizeRoles('superAdmin', 'coordinator', 'resumeBuilder', 'Support'), getAllConsultants);
router.get('/consultants/pending-resumes', protect, authorizeRoles('superAdmin'), getPendingResumes);
router.get('/consultants/:id', protect, authorizeRoles('superAdmin', 'coordinator', 'resumeBuilder'), getConsultantById);
router.put('/consultants/:id', protect, authorizeRoles('superAdmin', 'coordinator'), updateConsultant);
router.delete('/consultants/:id', protect, authorizeRoles('superAdmin'), deleteConsultant);
router.post('/consultants/:id/upload-proof', protect, upload.single('proof'), uploadDocument);
router.get('/consultants/:id/proof', protect,authorizeRoles('superAdmin'), getProofFile);
router.post('/consultants/:id/verify-payment', protect, authorizeRoles('superAdmin'), verifyPayment);

// Resume builder routes
router.post('/consultants/:id/assign-resume-builder', protect, authorizeRoles('resumeBuilder'), assignSelfAsResumeBuilder);
router.post('/consultants/:id/disassign-resume-builder', protect, authorizeRoles('resumeBuilder'), disassignSelfAsResumeBuilder);
router.put('/consultants/:id/resume-status', protect, authorizeRoles('superAdmin'), updateResumeStatus);
router.post('/consultants/:id/upload-resume', protect, authorizeRoles('resumeBuilder'), upload.single('resume'), uploadResumePDF);
router.get('/consultants/:id/resume', protect, authorizeRoles('superAdmin', 'coordinator', 'resumeBuilder', 'Support'), getResumePDF);

// New routes for staff assignment
router.post('/consultants/:id/assign-staff', protect, authorizeRoles('superAdmin'), assignStaff);
router.get('/my-assigned-consultants', protect, authorizeRoles('superAdmin', 'coordinator', 'Support'), getAssignedConsultants);

// Consultant Job Details routes
router.get('/placed-consultants', protect, authorizeRoles('superAdmin'), getAllPlacedJobDetails);
router.post('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin', 'coordinator', 'Support'), createJobDetails);
router.get('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin', 'coordinator', 'resumeBuilder', 'Support'), getJobDetails);
router.put('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin', 'coordinator'), updateJobDetails);
router.delete('/consultants/:consultantId/job-details', protect, authorizeRoles('superAdmin'), deleteJobDetails);

// Company routes
router.post('/companies', protect, authorizeRoles('superAdmin', 'coordinator'), createCompany);
router.get('/companies', protect, getAllCompanies);
router.get('/companies/:id', protect, getCompanyById);
router.put('/companies/:id', protect, authorizeRoles('superAdmin', 'coordinator'), updateCompany);
router.delete('/companies/:id', protect, authorizeRoles('superAdmin'), deleteCompany);

// Company job routes
router.get('/companies/:id/jobs', protect, getCompanyJobs);
router.post('/companies/:id/jobs', protect, authorizeRoles('superAdmin', 'coordinator'), addJobPosting);
router.put('/companies/:companyId/jobs/:jobId', protect, authorizeRoles('superAdmin', 'coordinator'), updateJobPosting);
router.delete('/companies/:companyId/jobs/:jobId', protect, authorizeRoles('superAdmin'), deleteJobPosting);

// Agreement routes
router.post("/consultants/:consultantId/agreement", protect, authorizeRoles("superAdmin", "coordinator"), createAgreement);
router.get("/consultants/:consultantId/agreement", protect, authorizeRoles("superAdmin", "coordinator", "Support"), getAgreement);
router.put("/consultants/:consultantId/agreement", protect, authorizeRoles("superAdmin", "coordinator"), updateAgreement);
router.delete("/consultants/:consultantId/agreement", protect, authorizeRoles("superAdmin"), deleteAgreement);

module.exports = router;
