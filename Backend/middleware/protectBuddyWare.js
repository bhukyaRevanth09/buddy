import jwt from "jsonwebtoken";
import buddyModel from "../models/BuddySchema.js"; // Ensure path is correct

const protectBuddy = async (req, res, next) => {
  try {
    let token;

    // 1. Check if Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Access Denied: No token provided" 
      });
    }

    // 2. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // 3. Fetch fresh data from DB and attach to req.user
    // This ensures req.user._id is always available and valid
    req.user = await buddyModel.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found or account deleted" 
      });
    }

    // 4. Role Authorization (Optional but recommended)
    if (req.user.role !== 'buddy') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: Access restricted to Buddies" 
      });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

export default protectBuddy;