// src/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config');
const { Op } = require('sequelize');

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpire });
};

// Valid roles
const VALID_ROLES = ['superAdmin', 'coordinator', 'resumeBuilder', 'Support', 'Candidate'];

// @desc    Register a new user with role
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    // Check for existing user by email
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Create user with default role 'Candidate' if no role specified
    const user = await User.create({ 
      username, 
      email, 
      password, 
      role: role || 'Candidate'
    });
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }
    
    const user = await User.findOne({ where: { email } });
    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
};
