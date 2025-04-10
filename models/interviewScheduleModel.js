const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { Consultant } = require("./consultantModel");
const { Company } = require("./companyModel");

const InterviewSchedule = sequelize.define(
  "InterviewSchedule",
  {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Interview date"
    },
    timeEST: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: "Interview time in EST"
    },
    timeIST: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: "Interview time in IST (auto-calculated)"
    },
    duration: {
      type: DataTypes.ENUM("30", "45", "60", "90"),
      allowNull: false,
      comment: "Interview duration in minutes"
    },
    country: {
      type: DataTypes.ENUM("India", "Canada", "USA", "Germany", "Australia"),
      allowNull: false,
      defaultValue: "USA",
      comment: "Country for the interview"
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Company,
        key: "id"
      },
      comment: "Foreign key to Company table"
    },
    jobPostingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Foreign key to Company's job posting"
    },
    isVideo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Whether it's a video interview"
    },
    interviewSupportName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Name of interview support person"
    },
    round: {
      type: DataTypes.ENUM("1st", "2nd", "3rd", "HR", "Final"),
      allowNull: false,
      comment: "Interview round"
    },
    callStatus: {
      type: DataTypes.ENUM("active", "hold", "done"),
      defaultValue: "active",
      comment: "Status of the call"
    },
    mode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Mode of interview"
    },
    interviewStatus: {
      type: DataTypes.ENUM("Pending", "InProgress", "Reschedule", "Rejected", "Completed"),
      defaultValue: "Pending",
      comment: "Status of the interview"
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason for rejection (if status is Rejected)"
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "General comments about the interview"
    },
    panelDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Details about the interview panel"
    },
    otterLink: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Link to Otter recording"
    },
    consultantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Consultant,
        key: "id"
      },
      comment: "Foreign key to Consultant table"
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the user who created this schedule"
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID of the user who last updated this schedule"
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeValidate: async (schedule) => {
        // Convert EST to IST (EST + 9:30 hours)
        if (schedule.timeEST) {
          const estTime = new Date(`2000-01-01T${schedule.timeEST}`);
          estTime.setHours(estTime.getHours() + 9);
          estTime.setMinutes(estTime.getMinutes() + 30);
          schedule.timeIST = estTime.toTimeString().split(' ')[0];
        }
      }
    }
  }
);

// Set up associations
Consultant.hasMany(InterviewSchedule, {
  foreignKey: "consultantId",
  as: "interviews"
});

InterviewSchedule.belongsTo(Consultant, {
  foreignKey: "consultantId",
  as: "consultant"
});

Company.hasMany(InterviewSchedule, {
  foreignKey: "companyId",
  as: "interviews"
});

InterviewSchedule.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company"
});

module.exports = { InterviewSchedule }; 