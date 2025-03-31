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
  uploadProof,
  getAllConsultants,
  getConsultantById,
  updateConsultant,
  deleteConsultant,
  verifyPayment,
  addExtraService
} = require('../controllers/consultantController');

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
router.post('/consultants', protect, createConsultant);
router.get('/consultants', protect, getAllConsultants);
router.get('/consultants/:id', protect, getConsultantById);
router.put('/consultants/:id', protect, updateConsultant);
router.delete('/consultants/:id', protect, authorizeRoles('admin'), deleteConsultant);
router.post('/consultants/:id/upload-proof', protect, upload.single('proof'), uploadProof);
router.post('/consultants/:id/verify-payment', protect, authorizeRoles('admin'), verifyPayment);
router.post('/consultants/:id/extra-services', protect, addExtraService);

module.exports = router;
