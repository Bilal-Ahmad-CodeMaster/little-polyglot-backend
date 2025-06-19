import { Router } from "express";
import auth from "./auth.routes.js";

import users from "./user.routes.js";
import schoolBranch from "./schoolsBranch.routes.js";
import { JWTVerify } from "../middleware/auth.middleware.js";
const route = Router();

route.use("/auth", auth);
route.use("/users", users);
route.use("/school-branches", JWTVerify, schoolBranch);

export default route;
