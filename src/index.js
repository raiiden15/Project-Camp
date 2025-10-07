import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/database.js";

dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB()
    .then(
        app.listen(port, () => {
            console.log("Server is running on port " + port);
        }),
    )
    .catch((err) => {
        console.error("MongoDB Connection Error ", err);
        process.exit(1);
    });
