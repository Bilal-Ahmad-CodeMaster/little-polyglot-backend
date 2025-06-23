import dotenv from "dotenv/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/index.routes.js";
import dbConnection from "./config/db.js";
dbConnection();

const app = express();
app.use(morgan("combined"));
app.use(cors(process.env.CORS_ORIGIN));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running");
});
