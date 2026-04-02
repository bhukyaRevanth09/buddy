import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next({
        statusCode: 401,
        message: "No token provided"
      });
    }

    
    const token = authHeader.split(" ")[1];

    if (!token) {
      return next({
        statusCode: 401,
        message: "Invalid token format"
      });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    req.data = decoded; 

    next();

  } catch (error) {
    return next({
      statusCode: 401,
      message: "Unauthorized - Invalid or expired token"
    });
  }
};

export default authMiddleware;