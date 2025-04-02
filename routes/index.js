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
  verifyPayment
} = require('../controllers/consultantController');

const {
  createJobDetails,
  getJobDetails,
  updateJobDetails,
  deleteJobDetails
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
router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.get('/users/:id', protect, getUserById);
router.post('/users', protect, authorizeRoles('admin'), createUser);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);

// Consultant routes
router.post('/consultants',protect, createConsultant); // Public route
router.get('/consultants', protect, authorizeRoles('admin', 'team'), getAllConsultants);
router.get('/consultants/:id', protect, authorizeRoles('admin'), getConsultantById);
router.put('/consultants/:id', protect, authorizeRoles('admin'), updateConsultant);
router.delete('/consultants/:id', protect, authorizeRoles('admin'), deleteConsultant);
router.post('/consultants/:id/upload-proof', protect, upload.single('proof'), uploadDocument);
router.post('/consultants/:id/verify-payment', protect, authorizeRoles('admin'), verifyPayment);

// Consultant Job Details routes
router.post('/consultants/:consultantId/job-details', protect, authorizeRoles('team', 'admin'), createJobDetails);
router.get('/consultants/:consultantId/job-details', protect, authorizeRoles('team', 'admin'), getJobDetails);
router.put('/consultants/:consultantId/job-details', protect, authorizeRoles('admin'), updateJobDetails);
router.delete('/consultants/:consultantId/job-details', protect, authorizeRoles('admin'), deleteJobDetails);

// Company routes
router.post('/companies', protect, authorizeRoles('admin', 'team'), createCompany);
router.get('/companies', protect, getAllCompanies);
router.get('/companies/:id', protect, getCompanyById);
router.put('/companies/:id', protect, authorizeRoles('admin'), updateCompany);
router.delete('/companies/:id', protect, authorizeRoles('admin'), deleteCompany);

// Company job routes
router.get('/companies/:id/jobs', protect, getCompanyJobs);
router.post('/companies/:id/jobs', protect, authorizeRoles('admin'), addJobPosting);
router.put('/companies/:companyId/jobs/:jobId', protect, authorizeRoles('admin'), updateJobPosting);
router.delete('/companies/:companyId/jobs/:jobId', protect, authorizeRoles('admin'), deleteJobPosting);

// Agreement routes
router.post("/consultants/:consultantId/agreement", protect, authorizeRoles("admin"), createAgreement);
router.get("/consultants/:consultantId/agreement", protect, authorizeRoles("admin"), getAgreement);
router.put("/consultants/:consultantId/agreement", protect, authorizeRoles("admin"), updateAgreement);
router.delete("/consultants/:consultantId/agreement", protect, authorizeRoles("admin"), deleteAgreement);

module.exports = router;
