// src/models/userModel.js
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      // No unique constraint
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // Removed unique: true to avoid hitting the key limit
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        "superAdmin",
        "coordinator",
        "resumeBuilder",
        "Support",
        "Candidate"
      ),
      defaultValue: "Candidate",
    },
  },
  {
    timestamps: true,
    indexes: [], // Empty array instead of false
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method to compare passwords
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
