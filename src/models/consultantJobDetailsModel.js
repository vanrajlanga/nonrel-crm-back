const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { Consultant } = require("./consultantModel");

const ConsultantJobDetails = sequelize.define(
  "ConsultantJobDetails",
  {
    jobType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Type of job",
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the company",
    },
    totalFees: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Total agreed fees amount",
    },
    receivedFees: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Amount received so far",
    },
    remainingFees: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Remaining fees to be collected",
    },
    feesStatus: {
      type: DataTypes.ENUM('pending', 'partial', 'completed'),
      defaultValue: 'pending',
      comment: "Status of fees collection",
    },
    dateOfJoining: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Date when consultant joined the job",
    },
    consultantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Consultant,
        key: "id",
      },
      unique: true,
      comment: "Foreign key to Consultant table",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the user who created this record"
    },
    createdByName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the user who created this record"
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: async (jobDetails) => {
        // Calculate remaining fees and update status
        if (jobDetails.totalFees !== undefined) {
          jobDetails.remainingFees = jobDetails.totalFees - (jobDetails.receivedFees || 0);
          
          // Update fees status
          if (jobDetails.remainingFees === 0 && jobDetails.totalFees > 0) {
            jobDetails.feesStatus = 'completed';
          } else if (jobDetails.receivedFees > 0) {
            jobDetails.feesStatus = 'partial';
          } else {
            jobDetails.feesStatus = 'pending';
          }
        }
      }
    }
  }
);

// Set up one-to-one relationship with proper foreign key configuration
Consultant.hasOne(ConsultantJobDetails, {
  foreignKey: "consultantId",
});

ConsultantJobDetails.belongsTo(Consultant, {
  foreignKey: "consultantId",
});

module.exports = { ConsultantJobDetails };
