import mongoose from "mongoose";

const dbStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  return res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    status: isDbConnected ? "ok" : "degraded",
    message: isDbConnected
      ? "Little Polyglot API is running"
      : "API is running, but database is not connected",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStates[dbState] || "unknown",
    },
  });
};
