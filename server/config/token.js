import jwt from "jsonwebtoken";

/**
 * Generate a signed JWT for the given userId.
 * jwt.sign is synchronous — no need for async.
 * @param {string} userId
 * @returns {string}
 */
const genToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export default genToken;
