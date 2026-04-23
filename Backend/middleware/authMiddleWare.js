// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import userModel from "../models/userSchema.js";
import buddyModel from "../models/BuddySchema.js";

// Mapping roles to models
const ROLE_MODELS = {
  user: userModel,
  buddy: buddyModel,
};



const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
  console.log(token)
    // FIX: Match the environment variable name used in TokenSetter (JWT_KEY)
    const secret = process.env.JWT_KEY; 
    
    if (!secret) {
        console.error("FATAL ERROR: JWT_KEY is not defined in .env");
        return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Session expired. Please refresh token." });
      }
      return res.status(401).json({ success: false, message: "Invalid session. Please log in again." });
    }

    // Dynamic Role Handling
    const { id, role } = decoded;
    console.log("token LL:: ",id,role)
    const Model = ROLE_MODELS[role];

    if (!Model) return res.status(403).json({ success: false, message: "Invalid account type." });

    // Use .lean() for speed
    const account = await Model.findById(id).select("-password").lean();

    if (!account) return res.status(404).json({ success: false, message: "Account not found." });

    // Attach data
    req.user = account; // This is now a plain JS object
    req.role = role;
    req.userId = id; 

    next();
  } catch (error) {
    console.error(`[Auth Error]: ${error.message}`);
    return res.status(500).json({ success: false, message: "Auth Error" });
  }
};
export default authMiddleware;