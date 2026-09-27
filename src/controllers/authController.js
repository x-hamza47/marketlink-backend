import User from '../models/User.js';
import FarmerProfile from '../models/FarmerProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';
import { signToken } from '../utils/token.js';
import Market from '../models/Market.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password || !phone)
    return fail(res, 'name, email, password and phone are required');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return fail(res, 'Email already registered', 409);

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name, email, passwordHash, phone,
    address: address || '',
    role: 'customer',
  });

  const token = signToken(user._id);
  return ok(res, { token, user: user.toSafeObject() }, 'Registered successfully', 201);
});

export const registerFarmer = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    stallName,
    contactPerson,
    description,
    markets,
    location,
  } = req.body;

  if (!name || !email || !password || !phone || !stallName || !contactPerson)
    return fail(res, 'Missing required fields');

  const exists = await User.findOne({ email: email.toLowerCase() });

  if (exists)
    return fail(res, 'Email already registered', 409);

  if (!markets || markets.length === 0) {
    return fail(res, 'At least one market is required');
  }

  for (const farmerMarket of markets) {
    const market = await Market.findById(farmerMarket.marketId);

    if (!market) {
      return fail(res, 'Market not found', 404);
    }

    const invalidDays = farmerMarket.operatingDays.filter(
      day => !market.operatingDays.includes(day)
    );

    if (invalidDays.length > 0) {
      return fail(
        res,
        `Invalid operating days for ${market.name}: ${invalidDays.join(', ')}`
      );
    }

    const pickupStart = farmerMarket.pickupStart;
    const pickupEnd = farmerMarket.pickupEnd;

    if (
      pickupStart < market.timings.open ||
      pickupEnd > market.timings.close
    ) {
      return fail(
        res,
        `Pickup time for ${market.name} must be between ${market.timings.open} and ${market.timings.close}`
      );
    }

    if (pickupStart >= pickupEnd) {
      return fail(
        res,
        `Pickup start time must be before pickup end time for ${market.name}`
      );
    }
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    address: address || '',
    role: 'farmer',
    isApproved: false,
  });

  await FarmerProfile.create({
    userId: user._id,
    stallName,
    contactPerson,
    description: description || '',
    markets: markets || [],
    location: location
      ? {
        ...location,
        type: 'Point',
        coordinates: [
          location.lng || 0,
          location.lat || 0,
        ],
      }
      : {
        address: '',
        lat: 0,
        lng: 0,
        type: 'Point',
        coordinates: [0, 0],
      },
  });

  return ok(
    res,
    {
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    },
    'Farmer registered. Await admin approval.',
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return fail(res, 'Invalid credentials', 401);
  if (!user.isActive) return fail(res, 'Account deactivated', 403);

  const match = await user.comparePassword(password);
  if (!match) return fail(res, 'Invalid credentials', 401);

  if (user.role === 'farmer' && !user.isApproved)
    return fail(res, 'Account pending admin approval', 403);

  const token = signToken(user._id);
  return ok(res, { token, user: user.toSafeObject() }, 'Logged in');
});

export const me = asyncHandler(async (req, res) => ok(res, req.user.toSafeObject()));

export const logout = asyncHandler(async (req, res) =>
  ok(res, null, 'Logged out')
);