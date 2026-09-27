export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const msg = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ success: false, error: msg });
  }
  req.body = value;
  next();
};