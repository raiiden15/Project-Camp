import { validationResult } from "express-validator";
import { ApiError } from "../utils/api_error.js"

export const validator = (req, res, next) => {
    const errors = validationResult(req)
    
    if (errors.isEmpty()) {
        return next()
    }

    const extracted_errors = [];

    errors.array().map((err) => {
        extracted_errors.push({[err.path]: err.msg})
    })
    throw new ApiError(422, "Recieved Data is not valid", extracted_errors)
};
