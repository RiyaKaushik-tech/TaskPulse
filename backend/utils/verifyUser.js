import { ErrorHandler } from "./error.js";
import jwt from "jsonwebtoken";

/**
 * Verify JWT from Authorization: Bearer <token> OR cookie token_access / token.
 * Attaches decoded payload to req.user.
 */
export const verifyUser = (req, res, next) => {
  try {
    // Debug: helpful while troubleshooting token delivery
    // console.log("verifyUser -> headers.authorization:", req.body);
    // console.log("verifyUser -> cookies:", req.cookies);

    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    // Accept common cookie names including access_token (underscore)
    const cookieToken =
      req.cookies?.access_token ||
      req.cookies?.token_access ||
      req.cookies?.token ||
      req.cookies?.accessToken ||
      null;

    const token = bearerToken || cookieToken;
    if (!token) return next(ErrorHandler(401, "Unauthorized: no token provided"));

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(ErrorHandler(500, "Server misconfigured: JWT secret missing"));

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        console.error("JWT verify error:", err && err.message ? err.message : err);
        return next(ErrorHandler(401, "Unauthorized: invalid or expired token"));
      }
      req.user = decoded; // e.g. { id, role, iat, exp }
      return next();
    });
  } catch (err) {
    console.error("verifyUser unexpected error:", err);
    return next(ErrorHandler(500, "Internal server error"));
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return next(ErrorHandler(403, "Access denied: admins only"));
};