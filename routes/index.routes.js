import { Router } from "express";
import auth from "./auth.routes.js";

import users from "./user.routes.js";

const route = Router();

route.use("/auth", auth);
route.use("/users", users);

export default route;
