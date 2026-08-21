import { Router } from "express";
import auth from "./auth.routes.js";

import users from "./user.routes.js";
import blog from "./blog.route.js";
import schoolBranch from "./schoolsBranch.routes.js";
import translate from "./translate.routes.js";
import health from "./health.routes.js";
import contact from "./contact.routes.js";
const route = Router();

route.use("/auth", auth);
route.use("/users", users);
route.use("/school-branches", schoolBranch);
route.use("/blog",  blog);
route.use("/translate", translate);
route.use("/health", health);
route.use("/contact", contact);

export default route;
