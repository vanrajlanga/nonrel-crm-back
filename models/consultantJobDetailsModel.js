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
    isJob: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Indicates if this is an active job",
    },
    placementStatus: {
      type: DataTypes.ENUM("placed", "hold", "active"),
      defaultValue: "placed",
      comment: "Status of the consultant's placement",
    },
    isAgreement: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Whether agreement has been made",
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
      type: DataTypes.ENUM("pending", "partial", "completed"),
      defaultValue: "pending",
      comment: "Status of fees collection",
    },
    dateOfOffer: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Date when consultant received the job offer",
    },
    consultantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Consultant,
        key: "id",
      },
      comment: "Foreign key to Consultant table",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the user who created this record",
    },
    createdByName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the user who created this record",
    },
  },
  {
    timestamps: true,
    indexes: [], // Empty array instead of false
    hooks: {
      beforeSave: async (jobDetails) => {
        // Calculate remaining fees and update status
        if (jobDetails.totalFees !== undefined) {
          jobDetails.remainingFees =
            jobDetails.totalFees - (jobDetails.receivedFees || 0);

          // Update fees status
          if (jobDetails.remainingFees === 0 && jobDetails.totalFees > 0) {
            jobDetails.feesStatus = "completed";
          } else if (jobDetails.receivedFees > 0) {
            jobDetails.feesStatus = "partial";
          } else {
            jobDetails.feesStatus = "pending";
          }
        }

        // If isJob is false, set placementStatus to "active"
        if (jobDetails.isJob === false) {
          jobDetails.placementStatus = "active";
        }
      },
      afterSave: async (jobDetails) => {
        // Update consultant's status based on placementStatus and isJob
        if (jobDetails.changed('placementStatus') || jobDetails.changed('isJob')) {
          const consultant = await Consultant.findByPk(jobDetails.consultantId);
          if (consultant) {
            if (jobDetails.isJob === false) {
              await consultant.update({
                isPlaced: false,
                isHold: false,
                isActive: true
              });
            } else {
              await consultant.update({
                isPlaced: jobDetails.placementStatus === "placed",
                isHold: jobDetails.placementStatus === "hold",
                isActive: jobDetails.placementStatus === "active"
              });
            }
          }
        }
      },
      afterCreate: async (jobDetails) => {
        // When job details are created, update consultant's status
        const consultant = await Consultant.findByPk(jobDetails.consultantId);
        if (consultant) {
          if (jobDetails.isJob === false) {
            await consultant.update({
              isPlaced: false,
              isHold: false,
              isActive: true
            });
          } else {
            await consultant.update({
              isPlaced: jobDetails.placementStatus === "placed",
              isHold: jobDetails.placementStatus === "hold",
              isActive: jobDetails.placementStatus === "active"
            });
          }
        }
      }
    },
  }
);

// Set up one-to-one relationship with proper foreign key configuration
Consultant.hasOne(ConsultantJobDetails, {
  foreignKey: "consultantId",
  unique: true, // Add unique constraint at the association level instead
});

ConsultantJobDetails.belongsTo(Consultant, {
  foreignKey: "consultantId",
});

module.exports = { ConsultantJobDetails };
