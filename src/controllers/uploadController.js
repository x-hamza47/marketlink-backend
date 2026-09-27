import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';
import { uploadBuffer } from '../services/cloudinaryService.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 'No file');
  const result = await uploadBuffer(req.file.buffer);
  return ok(res, { url: result.secure_url }, 'Uploaded');
});