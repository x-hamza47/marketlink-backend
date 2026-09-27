import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { fail } from '../utils/response.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export const verifyJWT = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return fail(res, 'No token provided', 401);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) return fail(res, 'Invalid user', 401);

    req.user = user;
    next();
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return fail(res, 'Forbidden', 403);
  next();
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.id).select('-passwordHash');
    }
  } catch { /* silent */ }
  next();
};