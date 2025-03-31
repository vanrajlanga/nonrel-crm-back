// src/config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'consultant',
    dialect: 'mysql'
  },
  jwtSecret: process.env.JWT_SECRET || '8f99af685d154db7d3319dcd52c4145d5f1407e2f5df3b1e5ad30fe99316e9abp',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
};