import genToken from "../config/token.js";
import User from "../models/user.model.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    let user = await User.findOne({ email });

if (!user) {
  user = await User.create({
    name: name || email.split("@")[0],
    email,
  });
} else if (!user.name) {
  user.name = name || email.split("@")[0];
  await user.save();
}
    const token = genToken(user._id);

    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(200).json(user);
  } catch (error) {
    console.error("[googleAuth]", error);
    return res.status(500).json({ message: "Authentication failed. Please try again." });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("[logOut]", error.message);
    return res.status(500).json({ message: "Logout failed. Please try again." });
  }
};
