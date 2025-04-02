const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Name of the company'
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'City where company is located'
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Country where company is located'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID who created this company'
  }
}, {
  timestamps: true
});

module.exports = { Company }; 