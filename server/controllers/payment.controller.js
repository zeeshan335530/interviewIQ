import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/razorpay.service.js";
import crypto from "crypto";

const PLAN_CONFIG = {
  basic: { amount: 100, credits: 150 },
  pro: { amount: 500, credits: 650 },
};

export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = PLAN_CONFIG[planId];
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan selected." });
    }

    const options = {
      amount: plan.amount * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      userId: req.userId,
      planId,
      amount: plan.amount,
      credits: plan.credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.json(order);
  } catch (error) {
    console.error("[createOrder]", error.message);
    return res.status(500).json({ message: "Failed to create payment order. Please try again." });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields." });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found." });
    }

    // Idempotency: already processed
    if (payment.status === "paid") {
      const user = await User.findById(payment.userId);
      return res.json({ success: true, message: "Payment already processed.", user });
    }

    // Verify the payment belongs to the requesting user
    if (payment.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    const updatedUser = await User.findByIdAndUpdate(
      payment.userId,
      { $inc: { credits: payment.credits } },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Payment verified and credits added.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[verifyPayment]", error.message);
    return res.status(500).json({ message: "Payment verification failed. Please contact support." });
  }
};
