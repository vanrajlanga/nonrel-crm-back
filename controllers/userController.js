const User = require('../models/userModel');
const { Op } = require('sequelize');

// Valid roles
const VALID_ROLES = ['superAdmin', 'coordinator', 'resumeBuilder', 'Support', 'Candidate'];

// Get all users - only accessible by superAdmin
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let whereClause = {};

    // If role is provided and valid, filter by role
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ 
          message: `Invalid role. Role must be one of: ${VALID_ROLES.join(', ')}`
        });
      }
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']] // Most recent first
    });

    res.status(200).json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }

    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: userExists.email === email 
          ? 'User with this email already exists' 
          : 'Username is already taken'
      });
    }
    
    // Create user with validated fields
    const newUser = await User.create({
      username,
      email,
      password,
      role: role || 'Candidate'
    });
    
    // Return user without password
    const userResponse = newUser.get();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, password, role } = req.body;
    
    // Find user first
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    // Update fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    
    await user.update(updateData);
    
    // Return user without password
    const userResponse = user.get();
    delete userResponse.password;
    
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: error.errors[0].path === 'email' 
          ? 'Email already in use' 
          : 'Username already taken'
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
