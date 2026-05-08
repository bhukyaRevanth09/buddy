import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config({ quiet: true });

// ACCESS TOKEN (short life)
export const TokenSetter = (data) => {
  try {
    const { id, role } = data;

    if (!id || !role) {
      throw new Error("Missing ID or Role for Access Token");
    }

    return jwt.sign(
      { id, role },
      process.env.JWT_KEY,
      { expiresIn: "15m" }   //  short lived
    );

  } catch (error) {
    console.error("Access Token Generation Error:", error.message);
    return null;
  }
};

// REFRESH TOKEN (long life)
export const refreshTokenSetter = (data) => {
  try {
    const { id, role } = data;

    if (!id || !role) {
      throw new Error("Missing ID or Role for Refresh Token");
    }

    return jwt.sign(
      { id, role },
      process.env.REFRESH_KEY,
      { expiresIn: "40d" }   //  long lived
    );

  } catch (error) {
    console.error("Refresh Token Generation Error:", error.message);
    return null;
  }
};