import express from "express";
import { body } from "express-validator";
import { googleAuth, logOut } from "../controllers/auth.controller.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import validateRequest from "../middlewares/validateRequest.js";

const authRouter = express.Router();

authRouter.post(
  "/google",
  authLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required."),
    body("name").trim().notEmpty().withMessage("Name is required."),
  ],
  validateRequest,
  googleAuth
);

authRouter.get("/logout", logOut);

export default authRouter;
