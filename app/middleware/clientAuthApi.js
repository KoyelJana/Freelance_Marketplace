const jwt = require("jsonwebtoken");

const clientAuthApi = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Authorization: Bearer <token>
  if (!token) return res.status(401).json({ success: false, message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY || "secret");
    if (decoded.role !== "client") {
      return res.status(403).json({ success: false, message: "Unauthorized role" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = clientAuthApi;
