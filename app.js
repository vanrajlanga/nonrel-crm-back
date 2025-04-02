// app.js
const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes"); // Import consolidated routes
const { port } = require("./config");
const { connectDB } = require("./config/database");

const app = express();

app.use(cors());

// Increase payload size limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to the Consultant Management API Git Test");
  console.log("Welcome to the Consultant Management API");
});

// Route to check database connection
app.get("/api/db-check", async (req, res) => {
  try {
    // Attempt to connect to the database.
    await connectDB();
    res.status(200).json({ message: "Database connection is healthy" });
  } catch (error) {
    console.error("Database connection error:", error);
    res
      .status(500)
      .json({ message: "Error connecting to database", error: error.message });
  }
});

// Use consolidated routes
app.use("/api", routes);

// Global error handling
app.use(errorHandler);

// Connect to the database and start the server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
