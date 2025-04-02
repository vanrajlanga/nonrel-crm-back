const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { ConsultantJobDetails } = require("./consultantJobDetailsModel");

const AgreementDetails = sequelize.define(
  "AgreementDetails",
  {
    agreementDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Date when agreement was created",
    },
    emiDate: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 31
      },
      comment: "Day of month when EMI is due",
    },
    emiAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Monthly EMI amount",
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional remarks about the agreement",
    },
    nextEmiDueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Next EMI due date",
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'terminated'),
      defaultValue: 'active',
      comment: "Status of the agreement",
    },
    consultantJobDetailsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ConsultantJobDetails,
        key: "id",
      },
      comment: "Foreign key to ConsultantJobDetails table",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the admin who created this agreement"
    },
    createdByName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the admin who created this agreement"
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (agreement) => {
        // Calculate the next EMI due date based on emiDate
        const today = new Date();
        const nextEmiDate = new Date(today.getFullYear(), today.getMonth(), agreement.emiDate);
        
        // If today's date is past this month's EMI date, set for next month
        if (today.getDate() >= agreement.emiDate) {
          nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
        }
        
        agreement.nextEmiDueDate = nextEmiDate;
      },
      beforeUpdate: async (agreement) => {
        // Recalculate next EMI due date if emiDate is changed
        if (agreement.changed('emiDate')) {
          const today = new Date();
          const nextEmiDate = new Date(today.getFullYear(), today.getMonth(), agreement.emiDate);
          
          if (today.getDate() >= agreement.emiDate) {
            nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
          }
          
          agreement.nextEmiDueDate = nextEmiDate;
        }
      }
    }
  }
);

// Set up one-to-one relationship
ConsultantJobDetails.hasOne(AgreementDetails, {
  foreignKey: "consultantJobDetailsId",
  as: "agreementDetails"
});

AgreementDetails.belongsTo(ConsultantJobDetails, {
  foreignKey: "consultantJobDetailsId"
});

module.exports = { AgreementDetails }; 