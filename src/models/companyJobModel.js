const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Company } = require('./companyModel');

const CompanyJob = sequelize.define('CompanyJob', {
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Title of the job position'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indicates if the job posting is active'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID who created this job posting'
  }
}, {
  timestamps: true
});

// Set up relationship with proper foreign key naming
Company.hasMany(CompanyJob, {
  foreignKey: 'companyId'
});
CompanyJob.belongsTo(Company, {
  foreignKey: 'companyId'
});

module.exports = { CompanyJob }; 