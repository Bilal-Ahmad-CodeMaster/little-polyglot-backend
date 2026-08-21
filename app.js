import dotenv from "dotenv/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import router from "./routes/index.routes.js";
import dbConnection from "./config/db.js";
dbConnection();

const app = express();

// Skip noisy access logs for keep-alive/health pings so real traffic stands out.
app.use(
  morgan("combined", {
    skip: (req) => req.originalUrl === "/api/health",
  })
);

// Gzip JSON/text responses — cuts transfer size (and time) for large
// branch/blog payloads with little CPU overhead.
app.use(compression());

app.use(cors(process.env.CORS_ORIGIN));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port", process.env.PORT);
});
