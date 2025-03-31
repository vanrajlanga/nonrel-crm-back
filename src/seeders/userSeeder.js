const User = require('../models/userModel');
const { connectDB } = require('../config/database');

// Admin user data
const adminUser = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123', // This will be hashed by the model hooks
  role: 'admin'
};

// Function to seed the admin user
const seedAdmin = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to database for seeding');

    // Check if any admin user already exists
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists in the database');
      return;
    }

    // Create admin user
    const admin = await User.create(adminUser);
    console.log('Admin user created successfully:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    });

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeder
seedAdmin();
