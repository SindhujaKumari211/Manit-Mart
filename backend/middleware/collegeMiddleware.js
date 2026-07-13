const mongoose = require("mongoose");
const { getDatabaseName } = require("../config/colleges");
const getModels = require("../models");

// Selects a logical database on the one shared Atlas connection. `useCache`
// means repeated requests reuse the same Mongoose Connection/model registry.
const selectCollegeDatabase = (req, res, next) => {
  const college = String(req.get("X-College") || "manit").trim().toLowerCase();
  const databaseName = getDatabaseName(college);

  if (!databaseName) {
    return res.status(400).json({ message: "Unsupported college" });
  }

  req.college = college;
  req.db = mongoose.connection.useDb(databaseName, { useCache: true });
  req.models = getModels(req.db);
  next();
};

module.exports = { selectCollegeDatabase };
