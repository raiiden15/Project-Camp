import { Router } from "express";
import {
    register_user,
    login,
    logout,
    verify_email,
    refresh_access_token,
    forgot_password,
    reset_forgot_password,
    get_current_user,
    change_current_password,
    resent_email_verification,
} from "../controllers/auth.controllers.js";
import { user_register_validator, userChangeCurrentPassValidator, userForgotValidator } from "../validators/index.js";
import { user_login_validator } from "../validators/index.js";
import { validator } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// unsecured route
router.route("/register").post(user_register_validator(), validator, register_user); // d
router.route("/login").post(user_login_validator(), validator, login); // d
router.route("/verify-email/:verificationToken").get(verify_email);
router.route("/refresh-token").post(refresh_access_token); // d 
router.route("/forgot-password").post(userForgotValidator(), validator, forgot_password);
router.route("/reset-password/:resetToken").post(userForgotValidator(), validator, reset_forgot_password);


// secure route
router.route("/logout").post(verifyJWT, logout);
router.route("/current-user").post(verifyJWT, get_current_user);
router.route("/change-password").post(verifyJWT, userChangeCurrentPassValidator(), validator, change_current_password);
router.route("resend-email").post(verifyJWT, resent_email_verification)


export default router;
