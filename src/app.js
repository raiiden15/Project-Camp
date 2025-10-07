import express from "express";
import cors from "cors";

const app = express();

// middleware, basic configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // we are doing this to parse the form data
app.use(express.static("public")); // to serve static files like images, css files, js files

// cors configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type"],
    }),
);

// import routes
import healthCheckRouter from "./routes/health_check.routes.js";
app.use("/api/v1/healthCheck", healthCheckRouter);

app.get("/", (req, res) => {
    res.send("welcome to project camp");
});

export default app;
