import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { chat } from '../services/aiService.js';

export const ask = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  if (!message) return ok(res, { reply: 'Please type a question.' });
  const reply = await chat(message, context);
  return ok(res, { reply });
});