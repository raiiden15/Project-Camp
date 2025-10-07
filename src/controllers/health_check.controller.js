import { ApiResponse } from "../utils/api_response.js";
import { async_handler } from "../utils/async_handler.js";

// const healthCheck = (req, res) => {
//     // try {
//     //     res.status(200).json(
//     //         new ApiResponse(200, {message: "Server is running"})
//     //     )
//     // } catch (error) {
//     //     console.log(error);
//     // }
// };

// this is a better way to do it, its just a wrapper function.
const healthCheck = async_handler(async (requestAnimationFrame, res) => {
    res.status(200).json(
        new ApiResponse(200, { message: "Server is running" }),
    );
});
export { healthCheck };
