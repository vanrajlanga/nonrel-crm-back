const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./userModel");

const Consultant = sequelize.define(
  "Consultant",
  {
    fulllegalname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    technology: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    stateOfResidence: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Which state you live in?",
    },
    visaStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Current Visa Status",
    },
    maritalStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    usaLandingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Date of Landing in USA",
    },
    // USA IT Experience
    hasUsaItExperience: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Do you have any IT Work Experience in USA?",
    },
    usaFirstExperience: {
      type: DataTypes.TEXT,
    },
    usaSecondExperience: {
      type: DataTypes.TEXT,
    },
    usaOtherExperiences: {
      type: DataTypes.TEXT,
      comment: "Other Experiences List here (if any)",
    },
    // Outside USA IT Experience
    hasOutsideUsaItExperience: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Do you have any IT work experience Outside USA?",
    },
    outsideUsaFirstExperience: {
      type: DataTypes.TEXT,
    },
    outsideUsaSecondExperience: {
      type: DataTypes.TEXT,
    },
    outsideUsaOtherExperiences: {
      type: DataTypes.TEXT,
      comment: "Other Experiences List here (if any)",
    },
    // USA Education
    hasUsaEducation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Do you have Education in USA?",
    },
    usaPgDiploma: {
      type: DataTypes.TEXT,
      comment: "PG-Diploma",
    },
    usaMastersDegree: {
      type: DataTypes.TEXT,
      comment: "Masters Degree",
    },
    usaOtherCertifications: {
      type: DataTypes.TEXT,
      comment: "Other degrees/Certifications (if any)",
    },
    // Outside USA Education
    hasOutsideUsaEducation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Do you have any Educational Background outside USA?",
    },
    outsideUsaBachelorsDegree: {
      type: DataTypes.TEXT,
      comment: "Bachelors Degree",
    },
    outsideUsaMastersDegree: {
      type: DataTypes.TEXT,
      comment: "Masters Degree",
    },
    outsideUsaOtherCertifications: {
      type: DataTypes.TEXT,
      comment: "Other degrees/Certifications (if any)",
    },
    // Documents
    passportId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Please upload your Passport ID",
    },
    termsAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: "I have read and agree to the Terms and Conditions",
    },
    registrationProof: {
      type: DataTypes.TEXT,
      comment:
        "Upload your payment proof (screenshot of Zelle/Wire transfer confirmation)",
    },
    paymentStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Payment verification status",
    },
    isPlaced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indicates if consultant has been placed in a job",
    },
    isHold: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indicates if consultant is on hold",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indicates if consultant is active",
    },
    isOfferPending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indicates if consultant has a pending offer",
    },
    openForWork: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Indicates if consultant is open for new opportunities",
    },
    bgvVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indicates if consultant's background verification is completed",
    },
    assignedCoordinatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      comment: "ID of the primary assigned coordinator",
    },
    assignedCoordinator2Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      comment: "ID of the secondary assigned coordinator",
    },
    assignedTeamLeadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
      comment: "ID of the assigned team lead",
    },
    assignmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Date when coordinator and team lead were assigned"
    },
    assignedResumeBuilder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      },
      comment: "ID of the assigned resume builder"
    },
    resumeStatus: {
      type: DataTypes.ENUM('not_built', 'accepted', 'rejected'),
      defaultValue: 'not_built',
      allowNull: false,
      comment: "Status of the consultant's resume"
    },
    resumeFile: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "URL or path to the uploaded resume PDF"
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    document1: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to first uploaded document"
    },
    document2: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to second uploaded document"
    },
    document3: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to third uploaded document"
    },
    document4: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to fourth uploaded document"
    },
    document5: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to fifth uploaded document"
    },
    documentVerificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    jobLostCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        max: {
          args: 2,
          msg: "A consultant can only lose their job up to 2 times"
        },
        min: {
          args: 0,
          msg: "Job lost count cannot be negative"
        }
      },
      comment: "Number of times the consultant has lost their job (max 2)"
    }
  },
  {
    timestamps: true,
    indexes: [], // Empty array instead of false
    getterMethods: {
      hasResume() {
        return this.resumeFile != null && this.resumeFile !== '';
      }
    }
  }
);

// Set up associations
Consultant.belongsTo(User, {
  as: "coordinator",
  foreignKey: "assignedCoordinatorId",
});

Consultant.belongsTo(User, {
  as: "coordinator2",
  foreignKey: "assignedCoordinator2Id",
});

Consultant.belongsTo(User, {
  as: "teamLead",
  foreignKey: "assignedTeamLeadId",
});

Consultant.belongsTo(User, {
  as: "resumeBuilder",
  foreignKey: "assignedResumeBuilder",
});

Consultant.belongsTo(User, {
  as: "creator",
  foreignKey: "createdBy",
});

// Add hooks for status validation
Consultant.addHook('beforeValidate', async (consultant) => {
  // Count how many status fields are true
  const trueCount = [
    consultant.isPlaced, 
    consultant.isHold, 
    consultant.isActive,
    consultant.isOfferPending
  ].filter(Boolean).length;

  // If more than one status is true, throw an error
  if (trueCount > 1) {
    throw new Error('Only one status (isPlaced, isHold, isActive, isOfferPending) can be true at a time');
  }

  // If all are false, set isActive to true by default
  if (trueCount === 0) {
    consultant.isActive = true;
  }
});

// Add hook to validate jobLostCount
Consultant.addHook('beforeUpdate', async (consultant) => {
  // If jobLostCount is being updated
  if (consultant.changed('jobLostCount')) {
    const newCount = consultant.jobLostCount;
    
    // Check if trying to increment beyond 2
    if (newCount > 2) {
      throw new Error('Cannot update: Job lost count cannot exceed 2');
    }
    
    // Check if trying to decrease the count
    const oldCount = consultant.previous('jobLostCount');
    if (newCount < oldCount) {
      throw new Error('Cannot update: Job lost count can only be incremented');
    }
  }
});

module.exports = { Consultant };
