import { fail } from '../utils/response.js';

export default function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err.message);

  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(', ');
    return fail(res, msg, 400);
  }
  if (err.name === 'CastError') return fail(res, 'Invalid ID', 400);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return fail(res, `Duplicate value for ${field}`, 409);
  }
  if (err.name === 'JsonWebTokenError') return fail(res, 'Invalid token', 401);

  return fail(res, err.message || 'Server error', err.status || 500);
}