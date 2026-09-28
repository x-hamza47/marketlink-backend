import Market from '../models/Market.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.day) filter.operatingDays = req.query.day;

  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: re }, { address: re }];
  } else if (req.query.city) {
    filter.address = new RegExp(req.query.city, 'i');
  }

  const markets = await Market.find(filter).sort({ name: 1 });
  return ok(res, markets);
});

export const getOne = asyncHandler(async (req, res) => {
  const m = await Market.findById(req.params.id);
  if (!m) return fail(res, 'Market not found', 404);
  return ok(res, m);
});

export const nearby = asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm, day, search } = req.query;
  if (!lat || !lng) return fail(res, 'lat and lng required');

  const geoNearStage = {
    near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
    distanceField: 'distanceMeters',
    spherical: true,
  };

  if (radiusKm && Number(radiusKm) > 0) {
    geoNearStage.maxDistance = Number(radiusKm) * 1000;
  }

  const pipeline = [
    {
      $geoNear: geoNearStage,
    },
  ];

  const match = {};
  if (day) match.operatingDays = day;
  if (search) {
    const re = new RegExp(search, 'i');
    match.$or = [{ name: re }, { address: re }];
  }
  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push({
    $addFields: { distanceKm: { $divide: ['$distanceMeters', 1000] } },
  });

  const markets = await Market.aggregate(pipeline);
  return ok(res, markets);
});
export const create = asyncHandler(async (req, res) => {
  const { name, address, lat, lng, operatingDays, timings } = req.body;
  const market = await Market.create({
    name, address, lat, lng, operatingDays, timings,
    location: { type: 'Point', coordinates: [lng, lat] },
    createdBy: req.user._id,
  });
  return ok(res, market, 'Market created', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.lat && data.lng) {
    data.location = { type: 'Point', coordinates: [data.lng, data.lat] };
  }
  const m = await Market.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!m) return fail(res, 'Not found', 404);
  return ok(res, m, 'Market updated');
});

export const remove = asyncHandler(async (req, res) => {
  const m = await Market.findByIdAndDelete(req.params.id);
  if (!m) return fail(res, 'Not found', 404);
  return ok(res, null, 'Market deleted');
});