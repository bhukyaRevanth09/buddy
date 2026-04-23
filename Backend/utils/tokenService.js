import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ quiet: true });

export const TokenSetter = (data) => {
  try {
    const { id, role } = data;
    
    if (!id || !role) {
      throw new Error("Missing ID or Role for Access Token");
    }

    // Using JWT_KEY from your .env
   // Inside your TokenSetter
return jwt.sign(
  { id, role },
  process.env.JWT_KEY, 
  { expiresIn: '30d' } // Change '3h' to '30d' (30 days)
);
  } catch (error) {
    console.error("Access Token Generation Error:", error.message);
    return null;
  }
};

export const refreshTokenSetter = (data) => {
  try {
    const { id, role } = data;
    
    if (!id || !role) {
      throw new Error("Missing ID or Role for Refresh Token");
    }

    // Using REFRESH_KEY from your .env
    return jwt.sign(
      { id, role },
      process.env.REFRESH_KEY,
      { expiresIn: '40d' }
    );
  } catch (error) {
    console.error("Refresh Token Generation Error:", error.message);
    return null;
  }
};