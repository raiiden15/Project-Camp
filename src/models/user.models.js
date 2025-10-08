import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto, { hash } from "crypto";

const user_schema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localPath: String,
            },
            default: {
                url: `https://placehold.co/200x200`,
                localPath: "",
            },
        },
        user_name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            type: String,
        },
        full_name: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is really required"],
        },
        is_email_verified: {
            type: Boolean,
            default: false,
        },
        refresh_token: {
            type: String,
        },
        forgot_password_token: {
            type: String,
        },
        forgot_password_expiry: {
            type: Date,
        },
        email_verification_token: {
            type: String,
        },
        email_verification_expiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

// we need to apply hash only when a password is saved, not when someone changed user profile or name and other stuff
user_schema.pre("save", async function (next) {
    // this helps when we are not working with password.
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// mongoose methods.
user_schema.methods.is_pass_correct = async function (password) {
    return await bcrypt.compare(password, this.password);
};

user_schema.methods.generate_access_token = function () {
    return jwt.sign(
        {
            // payload
            _id: this._id,
            email: this.email,
            user_name: this.user_name,
        },
        // secret
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};

user_schema.methods.generate_refresh_token = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiredIn: process.env.REFRESH_TOKEN_EXPIRY },
    );
};

user_schema.methods.generate_temp_token = function () {
    const unhashed_token = crypto.randomBytes(20).toString("hex");

    const hashed_token = crypto
        .createHash("sha256")
        .update(unhashed_token)
        .digest("hex");

    const token_expiry = Date.now() + 20 * 60 * 1000;

    return { unhashed_token, hashed_token, token_expiry };
};

export const User = mongoose.model("User", user_schema);
