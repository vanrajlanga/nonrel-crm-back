const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { ConsultantJobDetails } = require("./consultantJobDetailsModel");

const AgreementDetails = sequelize.define(
  "AgreementDetails",
  {
    // Basic Information
    consultantName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the consultant",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Email of the consultant",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Phone number of the consultant",
    },
    jobStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Date when the job started",
    },
    totalSalary: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Total salary amount",
    },
    totalServiceFee: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Total service fee (20% of total salary)",
    },
    monthlyPaymentAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Monthly payment amount (totalServiceFee / 8)",
    },
    emiDate: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 31,
      },
      comment: "Day of month when EMI is due",
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional remarks about the agreement",
    },

    // Month 1 Payment Details
    month1DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 1 payment due date",
    },
    month1AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 1 payment received amount",
    },
    month1ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 1 payment received date",
    },
    month1Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 1 payment status",
    },
    month1Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 1 payment notes",
    },

    // Month 2 Payment Details
    month2DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 2 payment due date",
    },
    month2AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 2 payment received amount",
    },
    month2ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 2 payment received date",
    },
    month2Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 2 payment status",
    },
    month2Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 2 payment notes",
    },

    // Month 3 Payment Details
    month3DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 3 payment due date",
    },
    month3AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 3 payment received amount",
    },
    month3ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 3 payment received date",
    },
    month3Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 3 payment status",
    },
    month3Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 3 payment notes",
    },

    // Month 4 Payment Details
    month4DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 4 payment due date",
    },
    month4AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 4 payment received amount",
    },
    month4ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 4 payment received date",
    },
    month4Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 4 payment status",
    },
    month4Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 4 payment notes",
    },

    // Month 5 Payment Details
    month5DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 5 payment due date",
    },
    month5AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 5 payment received amount",
    },
    month5ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 5 payment received date",
    },
    month5Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 5 payment status",
    },
    month5Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 5 payment notes",
    },

    // Month 6 Payment Details
    month6DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 6 payment due date",
    },
    month6AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 6 payment received amount",
    },
    month6ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 6 payment received date",
    },
    month6Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 6 payment status",
    },
    month6Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 6 payment notes",
    },

    // Month 7 Payment Details
    month7DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 7 payment due date",
    },
    month7AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 7 payment received amount",
    },
    month7ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 7 payment received date",
    },
    month7Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 7 payment status",
    },
    month7Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Month 7 payment notes",
    },

    // Month 8 Payment Details
    month8DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Month 8 payment due date",
    },
    month8AmountReceived: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: "Month 8 payment received amount",
    },
    month8ReceivedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Month 8 payment received date",
    },
    month8Status: {
      type: DataTypes.ENUM("pending", "paid", "overdue"),
      defaultValue: "pending",
      comment: "Month 8 payment status",
    },
    month8Notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notes for month 8 payment",
    },

    // Add proof fields for each month
    month1Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 1 payment",
    },
    month2Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 2 payment",
    },
    month3Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 3 payment",
    },
    month4Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 4 payment",
    },
    month5Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 5 payment",
    },
    month6Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 6 payment",
    },
    month7Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 7 payment",
    },
    month8Proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to proof file for month 8 payment",
    },

    // Summary Information
    nextDueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Next payment due date",
    },
    totalPaidSoFar: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: "Total amount paid so far",
    },
    remainingBalance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Remaining balance to be paid",
    },
    jobLostDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Date when the job was lost",
    },
    paymentCompletionStatus: {
      type: DataTypes.ENUM("in_progress", "completed", "terminated"),
      defaultValue: "in_progress",
      comment: "Overall payment completion status",
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
      comment: "ID of the user who created this agreement",
    },
  },
  {
    timestamps: true,
    indexes: [],
    hooks: {
      beforeCreate: async (agreement) => {
        // Calculate monthly payment amount (20% of total salary divided by 8)
        agreement.totalServiceFee = agreement.totalSalary * 0.2;
        agreement.monthlyPaymentAmount = agreement.totalServiceFee / 8;
        agreement.remainingBalance = agreement.totalServiceFee;

        // Calculate all due dates based on emiDate
        const startDate = new Date(agreement.jobStartDate);
        for (let i = 1; i <= 8; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(startDate.getMonth() + i);
          dueDate.setDate(agreement.emiDate);
          agreement[`month${i}DueDate`] = dueDate;
        }

        // Set next due date to first month's due date
        agreement.nextDueDate = agreement.month1DueDate;
      },
    },
  }
);

// Set up one-to-one relationship
ConsultantJobDetails.hasOne(AgreementDetails, {
  foreignKey: "consultantJobDetailsId",
  as: "agreementDetails",
});

AgreementDetails.belongsTo(ConsultantJobDetails, {
  foreignKey: "consultantJobDetailsId",
});

module.exports = { AgreementDetails };
