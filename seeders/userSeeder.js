const User = require('../models/userModel');
const { connectDB } = require('../config/database');

// Initial users data
const initialUsers = [
  {
    username: 'superAdmin',
    email: 'superAdmin@example.com',
    password: 'superAdmin123',
    role: 'superAdmin'
  },
  {
    username: 'admin1',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'hr1',
    email: 'hr@example.com',
    password: 'hr123',
    role: 'HR'
  },
  {
    username: 'coordinator1',
    email: 'coordinator@example.com',
    password: 'coordinator123',
    role: 'coordinator'
  },
  {
    username: 'resumebuilder1',
    email: 'resumebuilder@example.com',
    password: 'resume123',
    role: 'resumeBuilder'
  },
  {
    username: 'teamlead1',
    email: 'teamlead@example.com',
    password: 'teamlead123',
    role: 'teamLead'
  },
  {
    username: 'accounts1',
    email: 'accounts@example.com',
    password: 'accounts123',
    role: 'Accounts'
  },
  {
    username: 'operations1',
    email: 'operations@example.com',
    password: 'operations123',
    role: 'Operational Manager'
  }
];

// Function to seed the users
const seedUsers = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to database for seeding');

    // Check if superAdmin already exists
    const existingsuperAdmin = await User.findOne({
      where: { role: 'superAdmin' }
    });

    if (existingsuperAdmin) {
      console.log('superAdmin user already exists in the database');
    } else {
      // Create users
      for (const userData of initialUsers) {
        const existingUser = await User.findOne({
          where: { email: userData.email }
        });

        if (!existingUser) {
          const user = await User.create(userData);
          console.log(`${userData.role} user created successfully:`, {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          });
        } else {
          console.log(`User with email ${userData.email} already exists`);
        }
      }
    }

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeder
seedUsers();
