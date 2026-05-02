const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    "qweuansdasdg123123",
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id
    },
    "qweuansdasdg123123",
    { expiresIn: "7d" }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};