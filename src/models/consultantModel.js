const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consultant = sequelize.define('Consultant', {
  fulllegalname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  technology: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  stateOfResidence: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Which state you live in?'
  },
  visaStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Current Visa Status'
  },
  maritalStatus: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  currentAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  usaLandingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Date of Landing in USA'
  },
  // USA IT Experience
  hasUsaItExperience: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Do you have any IT Work Experience in USA?'
  },
  usaFirstExperience: {
    type: DataTypes.TEXT
  },
  usaSecondExperience: {
    type: DataTypes.TEXT
  },
  usaOtherExperiences: {
    type: DataTypes.TEXT,
    comment: 'Other Experiences List here (if any)'
  },
  // Outside USA IT Experience
  hasOutsideUsaItExperience: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Do you have any IT work experience Outside USA?'
  },
  outsideUsaFirstExperience: {
    type: DataTypes.TEXT
  },
  outsideUsaSecondExperience: {
    type: DataTypes.TEXT
  },
  outsideUsaOtherExperiences: {
    type: DataTypes.TEXT,
    comment: 'Other Experiences List here (if any)'
  },
  // USA Education
  hasUsaEducation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Do you have Education in USA?'
  },
  usaPgDiploma: {
    type: DataTypes.TEXT,
    comment: 'PG-Diploma'
  },
  usaMastersDegree: {
    type: DataTypes.TEXT,
    comment: 'Masters Degree'
  },
  usaOtherCertifications: {
    type: DataTypes.TEXT,
    comment: 'Other degrees/Certifications (if any)'
  },
  // Outside USA Education
  hasOutsideUsaEducation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Do you have any Educational Background outside USA?'
  },
  outsideUsaBachelorsDegree: {
    type: DataTypes.TEXT,
    comment: 'Bachelors Degree'
  },
  outsideUsaMastersDegree: {
    type: DataTypes.TEXT,
    comment: 'Masters Degree'
  },
  outsideUsaOtherCertifications: {
    type: DataTypes.TEXT,
    comment: 'Other degrees/Certifications (if any)'
  },
  // Documents
  passportId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Please upload your Passport ID'
  },
  termsAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'I have read and agree to the Terms and Conditions'
  },
  registrationProof: {
    type: DataTypes.TEXT,
    comment: 'Upload your payment proof (screenshot of Zelle/Wire transfer confirmation)'
  },
  paymentStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Payment verification status'
  },
  isPlaced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indicates if consultant has been placed in a job'
  }
}, {
  timestamps: true
});

module.exports = { Consultant };
