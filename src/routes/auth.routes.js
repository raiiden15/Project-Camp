import { Router } from "express";
import { register_user, login } from "../controllers/auth.controllers.js";
import { user_register_validator } from "../validators/index.js";
import { user_login_validator } from "../validators/index.js";
import { validator } from "../middlewares/validator.middleware.js"

const router = Router();

router.route("/register").post(user_register_validator(), validator, register_user);
router.route("/login").post(user_login_validator(), validator, login);
export default router;
