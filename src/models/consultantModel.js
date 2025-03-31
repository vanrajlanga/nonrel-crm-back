const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consultant = sequelize.define('Consultant', {
  fulllegalname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  registrationFee: {
    type: DataTypes.FLOAT
  },
  registrationDate: {
    type: DataTypes.DATE
  },
  registrationProof: {
    type: DataTypes.TEXT // Using TEXT for storing base64 strings
  },
  paymentStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  onboardingFee: {
    type: DataTypes.FLOAT
  },
  onboardingDate: {
    type: DataTypes.DATE
  },
  onboardingProof: {
    type: DataTypes.TEXT
  },
  consultantSalary: {
    type: DataTypes.FLOAT
  },
  dateOfJoining: {
    type: DataTypes.DATE
  },
  contractDuration: {
    type: DataTypes.INTEGER
  },
  monthlyFee: {
    type: DataTypes.FLOAT
  },
  monthlyStartDate: {
    type: DataTypes.DATE
  },
  monthlyDueDay: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
});

// Create a separate model for extra services
const ExtraService = sequelize.define('ExtraService', {
  description: {
    type: DataTypes.STRING
  },
  fee: {
    type: DataTypes.FLOAT
  },
  paymentDate: {
    type: DataTypes.DATE
  },
  proof: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

// Set up the relationship
Consultant.hasMany(ExtraService, { onDelete: 'CASCADE' });
ExtraService.belongsTo(Consultant);

module.exports = { Consultant, ExtraService };
