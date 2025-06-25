import { Router } from "express";
import auth from "./auth.routes.js";

import users from "./user.routes.js";
import blog from "./blog.route.js";
import schoolBranch from "./schoolsBranch.routes.js";
const route = Router();

route.use("/auth", auth);
route.use("/users", users);
route.use("/school-branches", schoolBranch);
route.use("/blog",  blog);

export default route;
