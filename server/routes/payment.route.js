import express from "express";
import { body } from "express-validator";
import isAuth from "../middlewares/isAuth.js";
import validateRequest from "../middlewares/validateRequest.js";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";

const paymentRouter = express.Router();

paymentRouter.post(
  "/order",
  isAuth,
  [body("planId").isIn(["basic", "pro"]).withMessage("Invalid plan ID.")],
  validateRequest,
  createOrder
);

paymentRouter.post(
  "/verify",
  isAuth,
  [
    body("razorpay_order_id").notEmpty().withMessage("Order ID is required."),
    body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required."),
    body("razorpay_signature").notEmpty().withMessage("Signature is required."),
  ],
  validateRequest,
  verifyPayment
);

export default paymentRouter;
