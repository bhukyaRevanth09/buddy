import jwt from "jsonwebtoken";
import userModel from "../models/userSchema.js";
import buddyModel from "../models/BuddySchema.js";

const ROLE_MODELS = {
  user: userModel,
  buddy: buddyModel,
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_KEY;

    if (!secret) {
      console.error("JWT_KEY missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const { id, role } = decoded;

    const Model = ROLE_MODELS[role];

    if (!Model) {
      return res.status(403).json({
        success: false,
        message: "Invalid role",
      });
    }

    const account = await Model.findById(id)
      .select("-password")
      .lean();

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    req.user = account;
    req.role = role;
    req.userId = id;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Auth error",
    });
  }
};

export default authMiddleware;