import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api_response.js";
import { async_handler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import {
    email_verification_mail_gen_content,
    forgot_password_mail_gen_content,
    sendMail,
} from "../utils/mail_gen.js";

const generate_tokens = async (user_id) => {
    try {
        const user = await User.findById(user_id);
        const access_token = user.generate_access_token();
        const refresh_token = user.generate_refresh_token();

        user.refresh_token = refresh_token;
        await user.save({ validateBeforeSave: false }); // just update single value, not all values.
        return { access_token, refresh_token };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const register_user = async_handler(async (req, res) => {
    const { email, user_name, password, role } = req.body;

    const user_exists = await User.findOne({
        $or: [{ user_name }, { email }],
    });

    if (user_exists) {
        throw new ApiError(
            409,
            "User with this email / password, already exists",
        );
    }

    const user = await User.create({
        email,
        password,
        user_name,
        is_email_verified: false,
    });

    // generate token
    const { unhashed_token, hashed_token, token_expiry } =
        user.generate_temp_token();
    user.email_verification_token = hashed_token;
    user.email_verification_expiry = token_expiry;

    await user.save({ validateBeforeSave: false });

    await sendMail({
        email: user?.email,
        subject: "Please verify Email",
        mail_gen_content: email_verification_mail_gen_content(
            user.user_name,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashed_token}`,
        ),
    });

    const created_user = await User.findById(user._id).select(
        "-password -refresh_token -email_verification_token -email_verification_expiry",
    ); // - attributes are not sent.

    if (!created_user) {
        throw new ApiError(
            500,
            "Something went wrong while registring an user.",
        );
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            {
                user: created_user,
            },
            "User Registered Successfully, Mail has been sent on your respective email. ",
        ),
    );
});

const login = async_handler(async (req, res) => {
    const {email, password} = req.body

    if (!email) {
        throw new ApiError(400, "Username or email is empty!");
    }

    const user = await User.findOne({ email }); 

    if (!user) {
        throw new ApiError(400, "User does not exists");
    }

    const is_pass_correct = await user.is_pass_correct(password) 

    if (!is_pass_correct) {
        throw new ApiError(400, "Invalid Password")
    }

    const {access_token, refresh_token} = await generate_tokens(user._id);

    const loggedin_user = await User.findById(user._id).select(
        "-password -refresh_token -email_verification_token -email_verification_expiry",
    ); // - attributes are not sent.

    if (!loggedin_user) {
        throw new ApiError(
            500,
            "Something went wrong while registring an user.",
        );
    }

    const options = {
        httpOnly: true, 
        secure: true
    }

    return res
        .status(200)
        .cookie("access_token", access_token, options)
        .cookie("refresh_token", refresh_token, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedin_user,
                    access_token, 
                    refresh_token
                }, 
                "User Logged in Successfully.!"
            )
        )
    }
)

export { register_user, login };
