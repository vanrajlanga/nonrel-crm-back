const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Company = sequelize.define(
  "Company",
  {
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      // Removed unique: true to avoid duplicate indexes
      comment: "Name of the company",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "City where company is located",
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Country where company is located",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User ID who created this company",
    },
  },
  {
    timestamps: true,
    // Don't set indexes: false when providing explicit indexes
    indexes: [
      {
        unique: true,
        fields: ["companyName"],
      },
    ],
  }
);

module.exports = { Company };
