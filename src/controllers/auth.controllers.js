import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api_response.js";
import { async_handler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import {
    email_verification_mail_gen_content,
    forgot_password_mail_gen_content,
    sendMail,
} from "../utils/mail_gen.js";
import jwt from "jsonwebtoken";

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
    const { email, password } = req.body;

    if (!email) {
        throw new ApiError(400, "Username or email is empty!");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User does not exists");
    }

    const is_pass_correct = await user.is_pass_correct(password);

    if (!is_pass_correct) {
        throw new ApiError(400, "Invalid Password");
    }

    const { access_token, refresh_token } = await generate_tokens(user._id);

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
        secure: true,
    };

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
                    refresh_token,
                },
                "User Logged in Successfully.!",
            ),
        );
});

const logout = async_handler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refresh_token: "", // change our refresh token to empty
            },
        },
        {
            new: true, // give a new object after update
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("access_token", options)
        .clearCookie("refresh_token", options)
        .json(new ApiResponse(200, {}, "User Logged Out"));
});

const get_current_user = async_handler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully"),
        );
});

const verify_email = async_handler(async (req, res) => {
    const { verification_token } = req.params;

    if (!verification_token) {
        throw new ApiError(400, "Email Verification Missing");
    }

    let hashed_token = crypto
        .createHash("sha256")
        .update(verification_token)
        .digest("hex");

    const user = await User.findOne({
        email_verification_token: hashed_token,
        email_verification_expiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Token is invalid or expired.");
    }

    user.email_verification_token = undefined;
    user.email_verification_expiry = undefined;

    user.is_email_verified = true;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { is_email_verified: true },
                "Email is verified",
            ),
        );
});

const resent_email_verification = async_handler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "user does not exist");
    }

    if (user.is_email_verified) {
        throw new ApiError(409, "Email is already verified");
    }

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

    return req
        .status(200)
        .json(new ApiResponse(200, {}, "Mail has been sent to your email Id."));
});

const refresh_access_token = async_handler(async (req, res) => {
    const incoming_refresh_token =
        req.cookies.refresh_token || req.body.refresh_token;

    if (!incoming_refresh_token) {
        throw new ApiError(401, "Unauthorized Access");
    }

    try {
        const decoded_refresh_token = jwt.verify(
            incoming_refresh_token,
            process.env.REFRESH_TOKEN_SECRET,
        );
        const user = await User.findById(decoded_refresh_token?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incoming_refresh_token != user?.refresh_token) {
            throw new ApiError(401, "Refresh token is expired");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { access_token, refresh_token: new_refresh_token } =
            await generate_tokens(user._id);

        user.refresh_token = new_refresh_token;
        await user.save();

        return res
            .status(200)
            .cookie("accessToken", access_token, options)
            .cookie("refreshToken", new_refresh_token, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        access_token,
                        refresh_token: new_refresh_token,
                    },
                    "Access token refreshed",
                ),
            );
    } catch (error) {
        throw new ApiError(401, "Invalid Refresh Token");
        console.log(error);
    }
});

export {
    register_user,
    login,
    logout,
    get_current_user,
    verify_email,
    resent_email_verification,
    refresh_access_token,
};
