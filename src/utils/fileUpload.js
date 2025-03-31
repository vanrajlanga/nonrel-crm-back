// src/utils/fileUpload.js
const multer = require('multer');

// Configure multer to store files in memory as Buffer objects.
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
