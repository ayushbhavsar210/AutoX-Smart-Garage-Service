exports.success = (res, message, data = null) => {
  res.status(200).json({ success: true, message, data });
};

exports.error = (res, message, code = 400) => {
  res.status(code).json({ success: false, message });
};