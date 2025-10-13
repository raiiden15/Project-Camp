import { body } from "express-validator";

const user_register_validator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("user_name")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("username must be in lowercase")
            .isLength({ min: 3 })
            .withMessage("Must be atleast 3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password cannot be empty"),
        body("full_name").trim().notEmpty(),
    ];
};

const user_login_validator = () => {
    return [
        body("email")
            .isEmail()
            .withMessage("Email is invalid")
            .notEmpty()
            .withMessage("Email cannot be empty"),
        body("password").notEmpty().withMessage("Password cannot be empty"),
    ];
};

const userChangeCurrentPassValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("Old Password is required"),
        body("newPassword").notEmpty().withMessage("New Password is required")
    ]
};

const userForgotValidator = () => {
    return [
        body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid")
    ]
};

const userResetForgotPassValidator = () => {
    return [
        body("newPassword").isEmpty().withMessage("Password is required")
    ]
}
export { user_register_validator, user_login_validator, userChangeCurrentPassValidator, userForgotValidator, userResetForgotPassValidator };
