import {User} from "../models/user.models.js"
import {ApiError} from "../utils/api_error.js"
import {async_handler} from "../utils/async_handler.js"
import jwt from "jsonwebtoken"

export const verifyJWT = async_handler(async (req, res, next) => {
    const token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refresh_token -email_verification_token -email_verification_expiry")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, "Invalid Token");
        
    }
})