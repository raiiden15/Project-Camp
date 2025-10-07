import { Router } from "express";
import { healthCheck } from "../controllers/health_check.controller.js";

const router = Router();

// why are we creating it in the first place, its because, no matter how many routes we have, we can just check all of them at once, using this file, instead of writing it in app.js everytime.
router.route("/").get(healthCheck);

export default router;
